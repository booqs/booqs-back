import { ReadStream } from 'fs'
import { Booq } from '../core'

export type LibraryCard = {
    id: string,
    length: number,
    title?: string,
    author?: string,
    language?: string,
    description?: string,
    subjects?: string[],
    cover?: string,
};
export type BookFile = {
    kind: 'epub',
    file: Buffer,
};
export type LibrarySource = {
    search(query: string, limit: number): Promise<LibraryCard[]>,
    cards(ids: string[]): Promise<LibraryCard[]>,
    fileForId(id: string): Promise<BookFile | undefined>,
    uploadEpub?(fileStream: ReadStream, userId: string): Promise<{
        card: LibraryCard,
        booq?: Booq,
    } | undefined>,
};
