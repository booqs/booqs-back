import { createHash } from 'crypto'
import { ReadStream } from 'fs'
import { inspect } from 'util'
import type { LibraryCard, Library, SearchResult } from './library'
import { parseEpub } from '@/parser'
import { Booq, nodesLength, uniqueId } from '@/core'
import { deleteAsset, downloadAsset, uploadAsset } from './s3'
import { sql } from './db'

export const userUploadsLibrary: Library = {
    search, cards, fileForId,
    uploadEpub,
    deleteAllBooksForUserId,
    // TODO: implement
    async forAuthor() { return [] },
}

export const userUploadedEpubsBucket = 'uu-epubs'

export type DbUuCard = {
    id: string,
    asset_id: string,
    length: number | null,
    title: string,
    authors: string[],
    language: string | null,
    description: string | null,
    subjects: string[] | null,
    cover: string | null,
    metadata: any,
    file_hash: string,
    created_at: string,
}

export async function uploadsForUserId(userId: string): Promise<DbUuCard[]> {
    const result = await sql`
      SELECT uc.*
      FROM uu_cards uc
      JOIN uploads u ON uc.id = u.upload_id
      WHERE u.user_id = ${userId}
      ORDER BY u.uploaded_at DESC
    `
    return result as DbUuCard[]
}

async function cards(ids: string[]): Promise<LibraryCard[]> {
    if (ids.length === 0) return []

    const result = await sql`
          SELECT * FROM uu_cards
          WHERE id = ANY(${ids})
        `

    const cards = result as DbUuCard[]
    const mapped = cards.map(convertToLibraryCard)
    return mapped
}

async function fileForId(id: string) {
    const [row] = await sql`
        SELECT asset_id FROM uu_cards
        WHERE id = ${id}
      `
    if (!row.asset_id) {
        return undefined
    } else {
        const asset = await downloadAsset(userUploadedEpubsBucket, row.asset_id)
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined
    }
}

export async function search(query: string, limit = 20, offset = 0): Promise<SearchResult[]> {
    const rows = await sql`
    WITH ranked_cards AS (
      SELECT *,
        (
          similarity(title, ${query}) * 5 +
          greatest_similarity(authors, ${query}) * 4 +
          greatest_similarity(subjects, ${query}) * 3 +
          similarity(description, ${query}) * 2 +
          similarity(jsonb_to_text(metadata), ${query})
        ) AS score
      FROM uu_cards
      WHERE
        title % ${query} OR
        exists_similarity(authors, ${query}) OR
        exists_similarity(subjects, ${query}) OR
        description % ${query} OR
        jsonb_to_text(metadata) % ${query}
    )
    SELECT * FROM ranked_cards
    ORDER BY score DESC
    LIMIT ${limit} OFFSET ${offset}
  `
    const cards = rows as DbUuCard[]
    const libCards = cards.map(convertToLibraryCard)
    const results = libCards.map(card => ({
        kind: 'book' as const,
        card,
    }))
    return results
}

export async function uploadEpub(fileBuffer: Buffer, userId: string) {
    const { buffer, hash } = await buildFileFromBuffer(fileBuffer)
    const existing = await cardForHash(hash)
    if (existing) {
        await addToRegistry({
            uploadId: existing.id,
            userId,
        })
        return {
            card: convertToLibraryCard(existing),
        }
    }

    return uploadNewEpub({ buffer, hash }, userId)
}

async function uploadNewEpub({ buffer, hash }: File, userId: string) {
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
    const insertResult = await insertRecord({ booq, assetId, fileHash: hash })
    if (insertResult === null) {
        report('Can\'t insert record to DB')
        return undefined
    }
    await addToRegistry({ uploadId: insertResult.id, userId })
    return {
        card: convertToLibraryCard(insertResult),
        booq,
    }
}

async function cardForHash(hash: string) {
    const [row] = await sql`
        SELECT * FROM uu_cards
        WHERE file_hash = ${hash}
      `
    if (!row) {
        return undefined
    } else {
        return row as DbUuCard
    }
}

async function insertRecord({ booq, assetId, fileHash }: {
    booq: Booq,
    assetId: string,
    fileHash: string,
}): Promise<DbUuCard | null> {
    const {
        title, authors, subjects, languages, descriptions, cover,
        rights, contributors,
        tags,
    } = booq.meta
    if (rights) {
        tags.push({ name: 'rights', value: rights })
    }
    if (contributors) {
        tags.push({ name: 'contributors', value: contributors.join(', ') })
    }
    const id = uniqueId()
    const length = nodesLength(booq.nodes)
    // TODO: support multiple languages
    const query = sql`
      INSERT INTO uu_cards (
        id,
        asset_id,
        length,
        title,
        authors,
        language,
        description,
        subjects,
        cover,
        metadata,
        file_hash
      )
      VALUES (
        ${id},
        ${assetId},
        ${length},
        ${title},
        ${authors},
        ${languages?.join(', ') ?? null},
        ${descriptions?.join('\n') ?? null},
        ${subjects ?? []},
        ${cover?.href ?? null},
        ${{ tags }},
        ${fileHash}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `
    const [inserted] = await query
    return inserted ? (inserted as DbUuCard) : null
}

async function addToRegistry({ uploadId, userId }: {
    uploadId: string,
    userId: string,
}) {
    await sql`INSERT INTO uploads (
        upload_id, user_id
    )
    VALUES (
        ${uploadId}, ${userId}
    )`
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
    await deleteAllUploadRecordsForUserId(userId)
    await deleteAllBooksWithoutUsers()
    return true
}

async function deleteAllBooksWithoutUsers() {
    const cards = await getAllBooksWithoutUploadUsers()
    const results = await Promise.all(cards.map(card => deleteBook({
        id: card.id,
        assetId: card.asset_id,
    })))
    return results.every(result => result)
}

async function deleteBook({ id, assetId }: {
    id: string,
    assetId: string,
}) {
    const s3promies = deleteAsset(userUploadedEpubsBucket, assetId)
    const dbPromise = deleteCards([id])
    const [s3Result, dbResult] = await Promise.all([s3promies, dbPromise])
    return s3Result && dbResult
}

async function deleteAllUploadRecordsForUserId(userId: string): Promise<boolean> {
    await sql`
      DELETE FROM uploads
      WHERE user_id = ${userId}
    `
    return true
}

async function deleteCards(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false

    const rows = await sql`
      DELETE FROM uu_cards
      WHERE id = ANY(${ids})
    `
    return rows.length > 0
}

async function getAllBooksWithoutUploadUsers(): Promise<DbUuCard[]> {
    const rows = await sql`
      SELECT * FROM uu_cards
      WHERE id NOT IN (
        SELECT upload_id FROM uploads
      )
    `
    return rows as DbUuCard[]
}

function convertToLibraryCard(doc: DbUuCard): LibraryCard {
    return {
        id: doc.id,
        length: doc.length ?? 0,
        title: doc.title,
        authors: doc.authors,
        language: doc.language,
        description: doc.description,
        subjects: doc.subjects ?? [],
        cover: doc.cover,
    }
}