import { BooqRange } from '@/core'
import { sql } from './db'

export type DbHighlight = {
  id: string,
  user_id: string,
  booq_id: string,
  start_path: number[],
  end_path: number[],
  color: string,
  note: string | null,
  created_at: string,
  updated_at: string,
}

export async function highlightForId(id: string): Promise<DbHighlight | null> {
  const [highlight] = await sql`
      SELECT * FROM hi
      WHERE id = ${id}
    `
  return highlight ? (highlight as DbHighlight) : null
}

export async function highlightsFor({
  booqId,
  userId,
  offset,
  limit,
}: {
  booqId?: string,
  userId?: string,
  offset?: number,
  limit?: number,
}): Promise<DbHighlight[]> {
  const result = await sql`
      SELECT * FROM highlights
      WHERE TRUE
      ${booqId !== undefined ? sql`AND booq_id = ${booqId}` : sql``}
      ${userId !== undefined ? sql`AND user_id = ${userId}` : sql``}
      ORDER BY created_at
      ${offset !== undefined ? sql`OFFSET ${offset}` : sql``}
      ${limit !== undefined ? sql`LIMIT ${limit}` : sql``}
    `
  return result as DbHighlight[]
}

export async function addHighlight({
  id,
  userId,
  booqId,
  range,
  color,
  note,
}: {
  id: string,
  userId: string,
  booqId: string,
  range: BooqRange,
  color: string,
  note?: string,
}): Promise<DbHighlight> {
  const [highlight] = await sql`
      INSERT INTO highlights (
        id, user_id, booq_id, start_path, end_path, color, note
      )
      VALUES (
        ${id}, ${userId}, ${booqId}, ${range.start}, ${range.end}, ${color}, ${note ?? null}
      )
      RETURNING *
    `
  return highlight as DbHighlight
}

export async function removeHighlight({ id, userId }: {
  id: string,
  userId: string,
}): Promise<boolean> {
  const rows = await sql`
      DELETE FROM highlights
      WHERE id = ${id} AND user_id = ${userId}
    `
  return rows.length > 0
}

export async function updateHighlight({
  id, userId, color, note,
}: {
  id: string,
  userId: string,
  color?: string,
  note?: string,
}): Promise<DbHighlight | null> {
  if (color === undefined && note === undefined) return null

  const [row] = await sql`
      UPDATE highlights
      SET
        updated_at = NOW()
        ${color !== undefined ? sql`, color = ${color}` : sql``}
        ${note !== undefined ? sql`, note = ${note}` : sql``}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `
  return (row as DbHighlight) ?? null
}