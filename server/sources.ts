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
