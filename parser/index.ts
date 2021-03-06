import { Booq, BooqMeta } from '../core';
import { Diagnoser } from './result';
import { openEpub } from './epubFile';
import { processEpub } from './book';
import { getMetadata } from './metadata';

export * from './result';

export async function parseEpub({ fileData, diagnoser }: {
    fileData: Buffer,
    diagnoser?: Diagnoser,
}): Promise<Booq | undefined> {
    diagnoser = diagnoser ?? (() => undefined);
    try {
        const { value: file, diags: fileDiags } = await openEpub({ fileData });
        fileDiags.forEach(diagnoser);
        if (!file) {
            return undefined;
        }
        const { value: book, diags: bookDiags } = await processEpub(file);
        bookDiags.forEach(diagnoser);
        return book;
    } catch (err) {
        diagnoser({
            diag: 'Unhandled exception on parsing',
            data: err,
        });
        return undefined;
    }
}

export type ExtractedMetadata = {
    metadata: BooqMeta,
    cover?: string,
};
export async function extractMetadata({ fileData, extractCover, diagnoser }: {
    fileData: Buffer,
    extractCover?: boolean,
    diagnoser?: Diagnoser,
}): Promise<ExtractedMetadata | undefined> {
    diagnoser = diagnoser ?? (() => undefined);
    const { value: epub, diags: fileDiags } = await openEpub({ fileData });
    fileDiags.forEach(diagnoser);
    if (!epub) {
        return undefined;
    }
    const metadata = await getMetadata(epub);
    if (extractCover) {
        const coverHref = metadata.cover;
        if (typeof coverHref === 'string') {
            const coverBuffer = await epub.imageResolver(coverHref);
            if (!coverBuffer) {
                diagnoser({
                    diag: `couldn't load cover image: ${coverHref}`,
                });
                return { metadata };
            } else {
                const cover = Buffer.from(coverBuffer).toString('base64');
                return { cover, metadata };
            }
        } else {
            return { metadata };
        }
    } else {
        return { metadata };
    }
}
