import { groupBy, flatten } from 'lodash'
import { parseId, filterUndefined } from '../../core'
import { LibraryCard } from '../sources'
import { sources, processCard } from './libSources'

export async function forId(id: string) {
    const [result] = await forIds([id])
    return result
}

export async function forIds(ids: string[]): Promise<Array<LibraryCard | undefined>> {
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
    const results = flatten(
        filterUndefined(await Promise.all(groupedResults)),
    )
    return ids.map(
        id => results.find(r => r.id === id),
    )
}

export async function featuredIds(limit: number) {
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
