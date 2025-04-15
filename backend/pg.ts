import type { LibrarySource, LibraryCard, SearchScope, SearchResult } from './library'
import { typedModel, TypeFromSchema, taggedObject } from './mongoose'
import { uniqBy } from 'lodash'
import { downloadAsset } from './s3'

export const pgSource: LibrarySource = {
    search,
    cards,
    fileForId,
    forAuthor,
}

export const pgEpubsBucket = 'pg-epubs'

const schema = {
    assetId: {
        type: String,
        required: true,
    },
    index: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    length: {
        type: Number,
        required: true,
    },
    title: String,
    author: String,
    language: String,
    description: String,
    subjects: [String],
    cover: String,
    rights: String,
    contributors: [String],
    meta: taggedObject<object>(),
} as const

export type DbPgCard = TypeFromSchema<typeof schema>
export const pgCards = typedModel('pg-cards', schema)


async function cards(ids: string[]): Promise<LibraryCard[]> {
    const docs = await (await pgCards)
        .find({ index: { $in: ids } })
        .exec()
    return mapDocs(docs)
}

async function fileForId(id: string) {
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

async function search(query: string, limit: number, scope: SearchScope[]): Promise<ScoredSearch[]> {
    const promises: Promise<ScoredSearch[]>[] = []
    for (const s of scope) {
        switch (s) {
            case 'title':
                promises.push(searchBooks({ path: 'title', query, limit }))
                break
            case 'author':
                promises.push(searchAuthors({ query, limit, boost: 1.5 }))
                break
            case 'subject':
                promises.push(searchBooks({ path: 'subjects', query, limit }))
                break
            default:
                console.warn(`Unknown search scope ${s}`)
                break
        }
    }
    const allResults = (await Promise.all(promises)).flat()
    const sorted = allResults.sort((a, b) => b.score - a.score).slice(0, limit)
    return sorted
}

type ScoredSearch = SearchResult & {
    score: number,
}
async function searchBooks({
    path,
    query,
    fuzzy = false,
    boost = 1,
    limit = 10,
}: {
    path: string,
    query: string,
    fuzzy?: boolean,
    boost?: number,
    limit?: number,
}): Promise<ScoredSearch[]> {
    const cursor = (await pgCards).aggregate([
        {
            $search: {
                compound: {
                    must: [
                        {
                            text: {
                                query,
                                path,
                                fuzzy: fuzzy ? {} : undefined,
                                score: { boost: { value: boost } },
                            },
                        },
                    ],
                },
            },
        },
        {
            $limit: limit,
        },
        {
            $addFields: {
                id: '$index',
                score: { '$meta': 'searchScore' },
            },
        },
    ])
    const docs = await cursor.exec()
    return docs.map(({ score, ...rest }) => ({
        kind: 'book',
        score,
        card: rest,
    }))
}

async function searchAuthors({
    query,
    fuzzy = false,
    boost = 1,
    limit = 10,
}: {
    query: string,
    fuzzy?: boolean,
    boost?: number,
    limit?: number,
}): Promise<ScoredSearch[]> {
    const cursor = (await pgCards).aggregate([
        {
            $search: {
                compound: {
                    must: [
                        {
                            text: {
                                query,
                                path: 'author',
                                fuzzy: fuzzy ? {} : undefined,
                                score: { boost: { value: boost } },
                            },
                        },
                    ],
                },
            },
        },
        {
            $limit: limit,
        },
        {
            $project: {
                score: { '$meta': 'searchScore' },
                name: '$author',
            },
        },
    ])
    const docs = await cursor.exec()
    const mapped = docs.map(d => ({
        kind: 'author' as const,
        score: d.score,
        author: {
            name: d.name,
        },
    }))
    const unique = uniqBy(mapped, a => a.author.name)
    return unique
}