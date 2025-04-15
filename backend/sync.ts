import { inspect } from 'util'
import { typedModel, TypeFromSchema } from './mongoose'
import { makeBatches } from './utils'
import { Booq, filterUndefined, nodesLength } from '@/core'
import { Asset, downloadAsset, listObjects } from './s3'
import { DbPgCard, pgCards, pgEpubsBucket } from './pg'
import { parseEpub } from '@/parser'
import { uploadBooqImages } from './images'

const schema = {
    id: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    message: String,
    data: Object,
} as const

type DbLog = TypeFromSchema<typeof schema>
const logModel = typedModel('log', schema)

async function logItem(item: Omit<DbLog, '_id'>) {
    return (await logModel).insertMany([item])
}

async function logExists({ kind, id }: {
    kind: string,
    id: string,
}) {
    return (await logModel).exists({ kind, id })
}

export async function pgSyncWorker() {
    for await (const { id, booq } of syncWithS3()) {
        uploadBooqImages(`pg/${id}`, booq)
    }
}

async function* syncWithS3() {
    report('Syncing with S3')

    const batches = makeBatches(assetsToProcess(), 1)
    for await (const batch of batches) {
        const added = await Promise.all(
            batch.map(processAsset),
        )
        yield* filterUndefined(added)
    }

    report('done syncing with S3')
}

async function* assetsToProcess() {
    const existing = await existingAssetIds()
    for await (const asset of listEpubObjects()) {
        if (!asset.Key) {
            report('bad asset', asset)
            continue
        } if (existing.some(id => id === asset.Key)) {
            continue
        } else if (await hasProblems(asset.Key)) {
            report('skipping asset with problems', asset.Key)
            continue
        }
        yield asset
    }
}

async function processAsset(asset: Asset) {
    if (!asset.Key) {
        report('bad asset', asset)
        return
    }
    try {
        const result = await downloadAndInsert(asset.Key)
        return result
    } catch (e) {
        report(`Promise rejection ${asset.Key}: ${e}`)
        logProblem(asset.Key, 'Unhandled exception', e)
        return
    }
}

async function existingAssetIds() {
    const all = await (await pgCards)
        .find()
        .select('assetId')
        .exec()
    return all.map(d => d.assetId)
}

async function hasProblems(assetId: string) {
    return logExists({
        kind: 'pg-sync',
        id: assetId,
    })
}

async function logProblem(assetId: string, message: string, err: any) {
    return logItem({
        kind: 'pg-sync',
        message,
        id: assetId,
        data: err,
    })
}

async function* listEpubObjects() {
    yield* listObjects(pgEpubsBucket)
}

async function downloadAndInsert(assetId: string) {
    report(`Processing ${assetId}`)
    const asset = await downloadAsset(pgEpubsBucket, assetId)
    if (!asset) {
        report(`Couldn't load pg asset: ${assetId}`)
        return
    }
    const { value: booq, diags } = await parseEpub({
        fileData: asset as any,
    })
    if (!booq) {
        report(`Couldn't parse epub: ${assetId}`)
        await logProblem(assetId, 'Parsing errors', diags)
        return
    }
    const document = await insertRecord(booq, assetId)
    if (document) {
        return {
            id: document.index,
            booq,
        }
    } else {
        return undefined
    }
}

async function insertRecord(booq: Booq, assetId: string) {
    const index = indexFromAssetId(assetId)
    if (index === undefined) {
        report(`Invalid asset id: ${assetId}`)
        await logProblem(assetId, 'Bad asset id', assetId)
        return undefined
    }
    const {
        title, authors, subjects, languages, descriptions, cover,
        rights, contributors,
        tags,
    } = booq.meta
    const length = nodesLength(booq.nodes)
    const doc: Omit<DbPgCard, '_id'> = {
        assetId,
        index,
        length,
        subjects,
        title,
        author: authors.join(', '),
        language: languages[0],
        description: descriptions[0],
        cover: cover?.href,
        rights,
        contributors,
        meta: tags,
    }
    const [inserted] = await (await pgCards).insertMany([doc])
    report('inserted', inserted)
    return inserted
}

function indexFromAssetId(assetId: string) {
    const match = assetId.match(/^pg(\d+)/)
    if (match) {
        const indexString = match[1]
        const index = parseInt(indexString, 10)
        return isNaN(index) ? undefined : indexString
    } else {
        return undefined
    }
}

function report(label: string, data?: any) {
    console.log('PG: \x1b[32m%s\x1b[0m', label)
    if (data) {
        console.log(inspect(data, false, 3, true))
    }
}
