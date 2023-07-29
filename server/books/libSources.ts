import { makeId } from '../../core'
import { LibrarySource, LibraryCard } from '../sources'
import { uuSource } from '../uploads'
import { pgSource } from '../gutenberg'
import { localBooqs } from './local'

export const sources: {
    [prefix in string]?: LibrarySource;
} = {
    pg: pgSource,
    uu: uuSource,
    lo: localBooqs,
}

export function processCard(prefix: string) {
    return (card: LibraryCard) => ({
        ...card,
        id: makeId(prefix, card.id),
    })
}
