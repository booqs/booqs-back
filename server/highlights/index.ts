import { forBooqId, add, remove, update } from './operations'
import { DbHighlight } from './schema'

export { DbHighlight }
export const highlights = {
    forBooqId, add, update, remove,
}
