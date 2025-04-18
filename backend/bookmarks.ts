import { BooqPath } from '@/core'
import { sql } from './db'

export type DbBookmark = {
    id: string,
    user_id: string,
    booq_id: string,
    path: number[],
}

export async function getBookmarks({
    userId,
    booqId,
}: {
    userId: string,
    booqId: string,
}): Promise<DbBookmark[]> {
    const result = await sql`
      SELECT * FROM bookmarks
      WHERE user_id = ${userId} AND booq_id = ${booqId}
      ORDER BY path
    `
    return result as DbBookmark[]
}

export async function addBookmark({
    userId,
    booqId,
    path,
}: {
    userId: string,
    booqId: string,
    path: BooqPath,
}): Promise<void> {
    await sql`
      INSERT INTO bookmarks (user_id, booq_id, path)
      VALUES (${userId}, ${booqId}, ${path})
      ON CONFLICT DO NOTHING
    `
}

export async function deleteBookmark(id: string): Promise<void> {
    await sql`
      DELETE FROM bookmarks
      WHERE id = ${id}
    `
}