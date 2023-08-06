import { createHash } from 'crypto'
import { ReadStream } from 'fs'
import { inspect } from 'util'
import { parseEpub } from '../../parser'
import { nodesLength, Booq, uniqueId } from '../../core'
import { uploadAsset } from '../s3'
import { users } from '../users'
import {
    uuCards, DbUuCard,
    userUploadedEpubsBucket, toLibraryCard,
} from './schema'
import { diagnoser } from 'booqs-epub'

export async function uploadEpub(fileStream: ReadStream, userId: string) {
    const { buffer, hash } = await buildFile(fileStream)
    const existing = await (await uuCards).findOne({ fileHash: hash }).exec()
    if (existing) {
        await addToRegistry(existing._id, userId)
        return {
            card: toLibraryCard(existing),
        }
    }

    let diags = diagnoser('upload')
    const booq = await parseEpub({
        fileData: buffer,
        diagnoser: diags,
    })
    diags.all().forEach(d => report(d.message, d.data))
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
    const doc: DbUuCard = {
        assetId,
        length,
        fileHash,
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
    return users.addUpload(userId, cardId)
}

type File = {
    buffer: Buffer,
    hash: string,
};
async function buildFile(fileStream: ReadStream) {
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
    console.log('UU: \x1b[32m%s\x1b[0m', label)
    if (data) {
        console.log(inspect(data, false, 3, true))
    }
}
