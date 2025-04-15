import { filterUndefined, makeId, parseId } from '@/core'
import { groupBy } from 'lodash'
import { Booq } from '../core'
import { pgSource } from './pg'
import { logTime } from './utils'
import { parseEpub } from '@/parser'
import { uploadBooqImages } from './images'
import { uuSource } from './uu'
import { loSource } from './lo'

export type LibraryCard = {
    id: string,
    length: number,
    title?: string,
    author?: string,
    language?: string,
    description?: string,
    subjects?: string[],
    cover?: string,
}
export type BookFile = {
    kind: 'epub',
    file: Buffer,
}
export type SearchScope = 'title' | 'author' | 'subject'
export type SearchResult = {
    kind: 'author',
    author: {
        name: string,
    },
} | {
    kind: 'book',
    card: LibraryCard,
}
export type LibrarySource = {
    search(query: string, limit: number, scope: SearchScope[]): Promise<SearchResult[]>,
    cards(ids: string[]): Promise<LibraryCard[]>,
    forAuthor(author: string, limit?: number, offset?: number): Promise<LibraryCard[]>,
    fileForId(id: string): Promise<BookFile | undefined>,
    uploadEpub?(fileBuffer: Buffer, userId: string): Promise<{
        card: LibraryCard,
        booq?: Booq,
    } | undefined>,
    deleteAllBooksForUserId?(userId: string): Promise<boolean>,
}

const sources: {
    [prefix in string]?: LibrarySource;
} = {
    pg: pgSource,
    uu: uuSource,
    lo: loSource,
}

export function processCard(prefix: string) {
    return (card: LibraryCard) => ({
        ...card,
        id: makeId(prefix, card.id),
    })
}

export async function libraryCardForId(id: string) {
    const [result] = await libraryCardsForIds([id])
    return result
}

export async function libraryCardsForIds(ids: string[]): Promise<Array<LibraryCard | undefined>> {
    const parsed = filterUndefined(
        ids.map(idString => {
            const [source, id] = parseId(idString)
            return source && id
                ? { source, id }
                : undefined
        }),
    )
    const grouped = groupBy(
        parsed,
        id => id.source,
    )
    const groupedResults = Object.entries(grouped).map(async ([sourcePrefix, pids]) => {
        const source = sources[sourcePrefix]
        if (source) {
            const forSource = await source.cards(pids.map(p => p.id))
            return forSource.map(processCard(sourcePrefix))
        } else {
            return undefined
        }
    })
    const results = filterUndefined(await Promise.all(groupedResults))
        .flat()
    return ids.map(
        id => results.find(r => r.id === id),
    )
}

const cache: {
    [booqId: string]: Promise<Booq | undefined>,
} = {}

export async function booqForId(booqId: string) {
    const cached = cache[booqId]
    if (cached) {
        return cached
    } else {
        const promise = parseBooqForId(booqId)
        cache[booqId] = promise
        return promise
    }
}

export async function booqsForAuthor(author: string, limit?: number, offset?: number) {
    const supported: Array<keyof typeof sources> = ['pg']
    const results = await Promise.all(
        supported.map(
            source => sources[source]!.forAuthor(author, limit, offset)
                .then(cards => cards.map(processCard(source))),
        ),
    )
    return results.flat()
}

export async function uploadToSource(sourcePrefix: string, fileBuffer: Buffer, userId: string) {
    const uploadEpub = sources[sourcePrefix]?.uploadEpub
    if (uploadEpub) {
        const result = await uploadEpub(fileBuffer, userId)
        if (result) {
            if (result.booq) {
                const imageResults = await uploadBooqImages(`${sourcePrefix}/${result.card.id}`, result.booq)
                for (const imageResult of imageResults) {
                    if (!imageResult.success) {
                        console.warn(`Failed to upload image ${imageResult.id} for ${sourcePrefix}/${result.card.id}`)
                    }
                }
            }
            return processCard(sourcePrefix)(result.card)
        }
    }
    return undefined
}

async function parseBooqForId(booqId: string) {
    const file = await fileForId(booqId)
    if (!file) {
        return undefined
    }
    const { value: booq, diags } = await logTime(() => parseEpub({
        fileData: file.file,
        title: booqId,
    }), 'Parser')
    diags.forEach(console.info)
    return booq
}

async function fileForId(booqId: string) {
    const [prefix, id] = parseId(booqId)
    const source = sources[prefix]
    return source && id
        ? source.fileForId(id)
        : undefined
}

export async function searchBooqs(query: string, limit: number, scope: SearchScope[]): Promise<SearchResult[]> {
    if (!query) {
        return []
    }
    const cards = Object.entries(sources).map(
        async ([prefix, source]) => {
            if (source) {
                const results = await source.search(query, limit, scope)
                return results.map(processSearchResult(prefix))
            } else {
                return []
            }
        },
    )

    const all = await Promise.all(cards)
    return all.flat()
}

function processSearchResult(prefix: string) {
    const cardProcessor = processCard(prefix)
    return function (result: SearchResult): SearchResult {
        if (result.kind === 'book') {
            return {
                ...result,
                card: cardProcessor(result.card),
            }
        } else {
            return result
        }
    }
}

export async function featuredBooqIds(_limit?: number) {
    return [
        'pg/55201',
        'pg/1635',
        'pg/3207',
        'pg/2680',
        'pg/11',
        'pg/1661',
        'pg/98',
        'pg/174',
        'pg/844',
        'pg/203',
        'pg/28054',
        'pg/5740',
        'pg/135',
        'pg/1727',
        'pg/4363',
    ]
}