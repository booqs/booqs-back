import { join } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'
import { Library, LibraryCard } from './library'

const epubsRoot = join('public', 'epubs')
export const localLibrary: Library = {
    async search() { return [] },
    async forAuthor() { return [] },
    async cards(ids: string[]) {
        return ids.map(function (id): LibraryCard {
            return {
                id,
                authors: [],
                length: 0,
                title: null,
                language: null,
                description: null,
                subjects: [],
                cover: null,
            }
        })
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
            console.error(`Couldn't open ${path}: ${err}`)
            return undefined
        }
    },
}