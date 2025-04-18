import { BooqRange } from '@/core'
import { sql } from './db'

export type DbHighlight = {
  highlight_id: string,
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
      SELECT * FROM highlights
      WHERE highlight_id = ${id}
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
  userId,
  booqId,
  range,
  color,
  note,
}: {
  userId: string,
  booqId: string,
  range: BooqRange,
  color: string,
  note?: string,
}): Promise<DbHighlight> {
  const [highlight] = await sql`
      INSERT INTO highlights (
        user_id, booq_id, start_path, end_path, color, note
      )
      VALUES (
        ${userId}, ${booqId}, ${range.start}, ${range.end}, ${color}, ${note ?? null}
      )
      RETURNING *
    `
  return highlight as DbHighlight
}

export async function removeHighlight({ id, userId }: {
  id: string,
  userId: string,
}): Promise<void> {
  await sql`
      DELETE FROM highlights
      WHERE highlight_id = ${id} AND user_id = ${userId}
    `
}

export async function updateHighlight({
  id, userId, color, note,
}: {
  id: string,
  userId: string,
  color?: string,
  note?: string,
}): Promise<void> {
  if (color === undefined && note === undefined) return

  await sql`
      UPDATE highlights
      SET
        updated_at = NOW()
        ${color !== undefined ? sql`, color = ${color}` : sql``}
        ${note !== undefined ? sql`, note = ${note}` : sql``}
      WHERE highlight_id = ${id} AND user_id = ${userId}
    `
}