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
export type LibrarySource = {
    prefix: string,
    search(query: string, limit: number): Promise<LibraryCard[]>,
    forIds(ids: string[]): Promise<LibraryCard[]>,
};

const gutenberg: LibrarySource = {
    prefix: 'pg',
    search: pgLib.search,
    forIds: pgLib.forIds,
};

export const sources = [gutenberg];
