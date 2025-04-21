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
    id,
    userId,
    booqId,
    path,
}: {
    id: string,
    userId: string,
    booqId: string,
    path: BooqPath,
}): Promise<DbBookmark> {
    const [row] = await sql`
      INSERT INTO bookmarks (id, user_id, booq_id, path)
      VALUES (${id}, ${userId}, ${booqId}, ${path})
      ON CONFLICT DO NOTHING
    `
    return row as DbBookmark
}

export async function deleteBookmark(id: string): Promise<boolean> {
    const rows = await sql`
      DELETE FROM bookmarks
      WHERE id = ${id}
    `
    return rows.length > 0
}