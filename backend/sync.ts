import { inspect } from 'util'
import { makeBatches } from './utils'
import { Booq, filterUndefined, nodesLength } from '@/core'
import { Asset, downloadAsset, listObjects } from './s3'
import {
    existingAssetIds, pgEpubsBucket, insertCard,
} from './pg'
import { parseEpub } from '@/parser'
import { uploadBooqImages } from './images'
import { redis } from './db'

type Log = {
    kind: string,
    message: string,
    id: string,
    data?: object,
}
async function logItem(item: Log) {
    return redis.hset('logs', {
        [`${item.kind}:${item.id}`]: JSON.stringify(item),
    })
}

async function logExists({ kind, id }: {
    kind: string,
    id: string,
}) {
    return redis.hexists('logs', `${kind}:${id}`)
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
            id: document.id,
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
    return insertCard({
        asset_id: assetId,
        id: index,
        length,
        subjects,
        title: title ?? 'Untitled',
        authors: authors,
        language: languages[0],
        description: descriptions[0],
        cover: cover?.href ?? null,
        metadata: {
            rights,
            contributors,
            tags,
        },
    })
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
    console.warn('PG: \x1b[32m%s\x1b[0m', label)
    if (data) {
        console.warn(inspect(data, false, 3, true))
    }
}
