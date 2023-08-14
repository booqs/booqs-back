import { search } from './search'
import { cards, fileForId, forAuthor } from './lookup'
import { LibrarySource } from '../sources'

export * from './sync'

export const pgSource: LibrarySource = {
    search,
    cards,
    fileForId,
    forAuthor,
}
