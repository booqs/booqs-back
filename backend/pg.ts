import type { Library, LibraryCard, SearchResult } from './library'
import { downloadAsset } from './s3'
import { sql } from './db'

export const pgLibrary: Library = {
  search,
  cards,
  fileForId,
  forAuthor,
}

export const pgEpubsBucket = 'pg-epubs'

export type DbPgCard = {
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
  created_at: string,
}


export async function cards(ids: string[]): Promise<LibraryCard[]> {
  if (ids.length === 0) return []

  const result = await sql`
      SELECT * FROM pg_cards
      WHERE id = ANY(${ids})
    `

  const cards = result as DbPgCard[]
  const mapped = cards.map(convertToLibraryCard)
  return mapped
}

async function fileForId(id: string) {
  const [row] = await sql`
    SELECT asset_id FROM pg_cards
    WHERE id = ${id}
  `
  if (!row.asset_id) {
    return undefined
  } else {
    const asset = await downloadAsset(pgEpubsBucket, row.asset_id)
    return Buffer.isBuffer(asset)
      ? { kind: 'epub', file: asset } as const
      : undefined
  }
}

export async function forAuthor(name: string, limit?: number, offset?: number): Promise<LibraryCard[]> {
  const result = await sql`
      SELECT * FROM pg_cards
      WHERE ${'%' + name + '%'} ILIKE ANY(authors)
      ORDER BY created_at DESC
      ${offset !== undefined ? sql`OFFSET ${offset}` : sql``}
      ${limit !== undefined ? sql`LIMIT ${limit}` : sql``}
    `
  const cards = result as DbPgCard[]
  return cards.map(convertToLibraryCard)
}

function convertToLibraryCard({
  id, title, authors, language, length,
  cover, description, subjects,
}: DbPgCard): LibraryCard {
  return {
    id, title,
    language,
    authors,
    length: length ?? 0,
    cover,
    description,
    subjects: subjects ?? [],
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
      FROM pg_cards
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
  const cards = rows as DbPgCard[]
  const libCards = cards.map(convertToLibraryCard)
  const results = libCards.map(card => ({
    kind: 'book' as const,
    card,
  }))
  return results
}

export async function existingAssetIds(): Promise<string[]> {
  const result = await sql`
      SELECT asset_id FROM pg_cards
    `
  return result.map(row => row.asset_id)
}

export async function insertCard(card: Omit<DbPgCard, 'searchable_tsv' | 'created_at'>): Promise<DbPgCard | null> {
  const [inserted] = await sql`
      INSERT INTO pg_cards (
        id,
        asset_id,
        length,
        title,
        authors,
        language,
        description,
        subjects,
        cover,
        metadata
      )
      VALUES (
        ${card.id},
        ${card.asset_id},
        ${card.length ?? null},
        ${card.title},
        ${card.authors},
        ${card.language ?? null},
        ${card.description ?? null},
        ${card.subjects ?? null},
        ${card.cover ?? null},
        ${card.metadata ?? {}}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `
  return inserted ? (inserted as DbPgCard) : null
}