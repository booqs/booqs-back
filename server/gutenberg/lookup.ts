import { DbPgCard, pgCards, pgEpubsBucket } from './schema'
import { downloadAsset } from '../s3'
import { LibraryCard } from '../sources'

export async function cards(ids: string[]): Promise<LibraryCard[]> {
    const docs = await (await pgCards)
        .find({ index: { $in: ids } })
        .exec()
    return mapDocs(docs)
}

export async function fileForId(id: string) {
    const doc = await (await pgCards).findOne({ index: id }).exec()
    if (!doc) {
        return undefined
    } else {
        const asset = await downloadAsset(pgEpubsBucket, doc.assetId)
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined
    }
}

export async function forAuthor(name: string, limit?: number, offset?: number) {
    let query = (await pgCards)
        .find({ author: name })
        .sort({ index: 1 })
    if (offset) {
        query = query.skip(offset)
    }
    if (limit) {
        query = query.limit(limit)
    }
    const docs = await query.exec()
    return mapDocs(docs)
}

function mapDocs(docs: DbPgCard[]): LibraryCard[] {
    return docs.map(({
        index, title, author, language, subjects,
        description, meta, cover, length,
    }) => ({
        id: index,
        cover, title, author, language, subjects, description, meta,
        length,
    }))
}
