import { pgLib } from '../gutenberg';

export type LibraryCard = {
    id: string,
    title?: string,
    author?: string,
    language?: string,
    description?: string,
    subjects?: string[],
    cover?: string,
    coverSizes?: {
        [n: number]: string,
    },
};
export type BookFile = {
    kind: 'epub',
    file: Buffer,
};
export type LibrarySource = {
    prefix: string,
    search(query: string, limit: number): Promise<LibraryCard[]>,
    cards(ids: string[]): Promise<LibraryCard[]>,
    fileForId(id: string): Promise<BookFile | undefined>,
};

const gutenberg: LibrarySource = {
    prefix: 'pg',
    search: pgLib.search,
    cards: pgLib.cards,
    fileForId: pgLib.fileForId,
};

export const sources = [gutenberg];
