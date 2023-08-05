import { forBooqId, add, remove, update } from './operations'
import type { DbHighlight } from './schema'

export type { DbHighlight }
export const highlights = {
    forBooqId, add, update, remove,
}
