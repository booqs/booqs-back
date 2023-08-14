import { LibrarySource } from '../sources'
import { join } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'

const epubsRoot = join('epubs')
export const localBooqs: LibrarySource = {
    async search() { return [] },
    async forAuthor() { return [] },
    async cards(ids: string[]) {
        return ids.map(id => ({ id, length: 0 }))
    },
    async fileForId(id: string) {
        const path = join(epubsRoot, `${id}.epub`)
        try {
            const file = await promisify(readFile)(path)
            return {
                kind: 'epub',
                file,
            }
        } catch (err) {
            console.log(`Couldn't open ${path}: ${err}`)
            return undefined
        }
    },
}