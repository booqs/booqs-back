import { createHash } from 'crypto'
import { ReadStream } from 'fs'
import { inspect } from 'util'
import type { LibraryCard, LibrarySource, SearchResult } from './library'
import { typedModel, TypeFromSchema, taggedObject, DocumentType } from './mongoose'
import { parseEpub } from '@/parser'
import { Booq, nodesLength, uniqueId } from '@/core'
import { deleteAsset, downloadAsset, uploadAsset } from './s3'
import mongoose from 'mongoose'

export const uuSource: LibrarySource = {
    search, cards, fileForId,
    uploadEpub,
    deleteAllBooksForUserId,
    // TODO: implement
    async forAuthor() { return [] },
}

export const userUploadedEpubsBucket = 'uu-epubs'

const cardsSchema = {
    assetId: {
        type: String,
        required: true,
    },
    length: {
        type: Number,
        required: true,
    },
    fileHash: {
        type: String,
        required: true,
    },
    users: {
        type: [String],
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

type DbUuCard = TypeFromSchema<typeof cardsSchema>
const uuCards = typedModel('uu-cards', cardsSchema)

function toLibraryCard(doc: DocumentType<typeof cardsSchema>): LibraryCard {
    return {
        id: doc._id,
        length: doc.length,
        title: doc.title,
        author: doc.author,
        language: doc.language,
        description: doc.description,
        subjects: doc.subjects,
        cover: doc.cover,
    }
}

async function cards(ids: string[]): Promise<LibraryCard[]> {
    return (await uuCards)
        .find(
            { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
            {
                index: true,
                title: true, author: true,
                language: true, subjects: true, description: true,
                meta: true, cover: true,
                length: true,
            },
        )
        .exec()
        .then(docs => docs.map(({
            _id, title, author, language, subjects,
            description, meta, cover, length,
        }) => ({
            id: _id,
            title, author, language, subjects, description, meta,
            cover, length,
        })))
}

async function fileForId(id: string) {
    const doc = await (await uuCards).findOne({ _id: id }).exec()
    if (!doc) {
        return undefined
    } else {
        const asset = await downloadAsset(userUploadedEpubsBucket, doc.assetId)
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined
    }
}

async function search(query: string, limit: number): Promise<SearchResult[]> {
    const docs = await (await uuCards).aggregate([{
        $search: {
            compound: {
                should: [
                    {
                        text: {
                            query,
                            path: 'title',
                            fuzzy: {},
                            score: { boost: { value: 1.1 } },
                        },
                    },
                    {
                        text: {
                            query,
                            path: 'author',
                            fuzzy: {},
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
        },
    },
    ]).exec()
    return docs.map((doc) => ({
        kind: 'book',
        card: doc,
    }))
}

export async function uploadEpub(fileBuffer: Buffer, userId: string) {
    const { buffer, hash } = await buildFileFromBuffer(fileBuffer)
    const existing = await (await uuCards).findOne({ fileHash: hash }).exec()
    if (existing) {
        await addToRegistry(existing._id, userId)
        return {
            card: toLibraryCard(existing),
        }
    }

    const { value: booq, diags } = await parseEpub({
        fileData: buffer,
    })
    diags.forEach(d => report(d.message, d.data))
    if (!booq) {
        report('Can\'t parse upload')
        return undefined
    }
    const assetId = uniqueId()
    const uploadResult = await uploadAsset(userUploadedEpubsBucket, assetId, buffer)
    if (!uploadResult.$metadata) {
        report('Can\'t upload file to S3')
        return undefined
    }
    const insertResult = await insertRecord(booq, assetId, hash)
    await addToRegistry(insertResult._id, userId)
    return {
        card: toLibraryCard(insertResult),
        booq,
    }
}

async function insertRecord(booq: Booq, assetId: string, fileHash: string) {
    const {
        title, authors, subjects, languages, descriptions, cover,
        rights, contributors,
        tags,
    } = booq.meta
    const length = nodesLength(booq.nodes)
    const doc: Omit<DbUuCard, '_id'> = {
        assetId,
        length,
        fileHash,
        users: [],
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
    const [inserted] = await (await uuCards).insertMany([doc])
    report('inserted', inserted)
    return inserted
}

async function addToRegistry(cardId: string, userId: string) {
    const result = await (await uuCards).updateOne({ _id: cardId }, {
        $addToSet: { users: userId },
    }).exec()
    if (result.modifiedCount === 0) {
        console.error('Can\'t add user to registry')
        return false
    }
    return true
}

type File = {
    buffer: Buffer,
    hash: string,
}
export async function buildFileFromBuffer(buffer: Buffer) {
    const hash = createHash('md5')
    hash.update(buffer)
    return {
        buffer,
        hash: hash.digest('base64'),
    }
}
export async function buildFileFromReadStream(fileStream: ReadStream) {
    return new Promise<File>((resolve, reject) => {
        try {
            const hash = createHash('md5')
            const chunks: any[] = []

            fileStream.on('data', chunk => {
                hash.update(chunk)
                chunks.push(chunk)
            })
            fileStream.on('end', () => {
                const buffer = Buffer.concat(chunks)
                resolve({
                    buffer,
                    hash: hash.digest('base64'),
                })
            })
        } catch (e) {
            reject(e)
        }
    })
}

function report(label: string, data?: any) {
    console.warn('UU: \x1b[32m%s\x1b[0m', label)
    if (data) {
        console.warn(inspect(data, false, 3, true))
    }
}

export async function deleteAllBooksForUserId(userId: string) {
    const result = await (await uuCards).updateMany(
        {},
        { $pull: { users: userId } },
    ).exec()
    if (result.modifiedCount > 0) {
        return deleteAllBooksWithoutUsers()
    }
    return true
}

async function deleteAllBooksWithoutUsers() {
    const cards = await (await uuCards).find({ users: { $size: 0 } }).exec()
    const results = await Promise.all(cards.map(card => deleteBook(card)))
    return results.every(result => result)
}

async function deleteBook({ _id, assetId }: {
    _id: string,
    assetId: string,
}) {
    const s3promies = deleteAsset(userUploadedEpubsBucket, assetId)
    const dbPromise = (await uuCards).deleteOne({ _id }).exec()
    const [s3Result, dbResult] = await Promise.all([s3promies, dbPromise])
    return s3Result && dbResult.deletedCount === 1
}