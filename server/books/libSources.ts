import { LibrarySource } from '../sources';
import { userUploadsImagesRoot, userUploadsLib } from '../uploads';
import { pgImagesRoot, pgLib } from '../gutenberg';

export const gutenberg: LibrarySource = {
    prefix: 'pg',
    imagesRoot: pgImagesRoot,
    search: pgLib.search,
    cards: pgLib.cards,
    fileForId: pgLib.fileForId,
};

export const userUploads: LibrarySource = {
    prefix: 'uu',
    imagesRoot: userUploadsImagesRoot,
    search: userUploadsLib.search,
    cards: userUploadsLib.cards,
    fileForId: userUploadsLib.fileForId,
};

export const sources = [gutenberg, userUploads];