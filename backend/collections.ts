import { sql } from './db'

export type DbCollection = {
    id: string,
    user_id: string,
    name: string,
    created_at: string,
    updated_at: string,
}

export async function booqIdsInCollections(userId: string, ...names: string[]): Promise<string[]> {
    const result = await sql`
      SELECT ucb.booq_id
      FROM user_collections_books ucb
      JOIN collections c ON ucb.collection_id = c.id
      WHERE c.user_id = ${userId}
        AND c.name = ANY(${names})
    `
    return result.map(r => r.booq_id)
}

export async function addToCollection({
    userId,
    booqId,
    name,
}: {
    userId: string,
    booqId: string,
    name: string,
}): Promise<void> {
    const [collection] = await sql`
      INSERT INTO collections (user_id, name)
      VALUES (${userId}, ${name})
      ON CONFLICT (user_id, name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `

    await sql`
      INSERT INTO user_collections_books (collection_id, booq_id)
      VALUES (${collection.id}, ${booqId})
      ON CONFLICT DO NOTHING
    `
}

export async function removeFromCollection({
    userId,
    booqId,
    name,
}: {
    userId: string,
    booqId: string,
    name: string,
}): Promise<void> {
    const [collection] = await sql`
      SELECT id FROM collections
      WHERE user_id = ${userId} AND name = ${name}
    `
    if (!collection) return

    await sql`
      DELETE FROM user_collections_books
      WHERE collection_id = ${collection.id} AND booq_id = ${booqId}
    `
}

export async function addUpload(userId: string, uploadId: string) {
    return addToCollection({
        userId,
        name: 'uploads',
        booqId: uploadId,
    })
}