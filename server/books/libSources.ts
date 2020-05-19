import { makeId } from '../../core';
import { LibrarySource, LibraryCard } from '../sources';
import { userUploadsLib } from '../uploads';
import { pgLib } from '../gutenberg';

export const gutenberg: LibrarySource = {
    prefix: 'pg',
    search: pgLib.search,
    cards: pgLib.cards,
    fileForId: pgLib.fileForId,
};

export const userUploads: LibrarySource = {
    prefix: 'uu',
    search: userUploadsLib.search,
    cards: userUploadsLib.cards,
    fileForId: userUploadsLib.fileForId,
};

export const sources = [gutenberg, userUploads];

export function processCard({ prefix }: LibrarySource) {
    return (card: LibraryCard) => ({
        ...card,
        id: makeId(prefix, card.id),
    });
}
