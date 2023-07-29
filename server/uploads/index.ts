import { search } from './search'
import { cards, fileForId } from './lookup'
import { uploadEpub } from './upload'
import { LibrarySource } from '../sources'

export const uuSource: LibrarySource = {
    search, cards, fileForId,
    uploadEpub,
}

