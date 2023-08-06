import { Booq, BooqMeta } from '../core'
import { Diagnostic } from './result'
import { processEpub } from './book'
import { openFirstEpubPackage } from './epub'
import { buildMeta } from './metadata'

export * from './result'

export async function parseEpub({ fileData, diagnoser }: {
    fileData: Buffer,
    diagnoser?: (diag: Diagnostic) => void,
}): Promise<Booq | undefined> {
    diagnoser = diagnoser ?? (() => undefined)
    try {
        const file = await openFirstEpubPackage({ fileData, diagnoser })
        if (!file) {
            return undefined
        }
        const { value: book, diags: bookDiags } = await processEpub(file)
        bookDiags.forEach(diagnoser)
        return book
    } catch (err) {
        diagnoser({
            message: 'Unhandled exception on parsing',
            data: err as object,
        })
        return undefined
    }
}

export type ExtractedMetadata = {
    metadata: BooqMeta,
    cover?: string,
};
export async function extractMetadata({ fileData, extractCover, diagnoser }: {
    fileData: Buffer,
    extractCover?: boolean,
    diagnoser?: (diag: Diagnostic) => void,
}): Promise<ExtractedMetadata | undefined> {
    diagnoser = diagnoser ?? (() => undefined)
    const epub = await openFirstEpubPackage({ fileData, diagnoser })
    if (!epub) {
        return undefined
    }
    let diags: Diagnostic[] = []
    const metadata = buildMeta(epub, diags)
    diags.forEach(diagnoser)
    if (extractCover) {
        const coverHref = metadata.cover?.href
        if (typeof coverHref === 'string') {
            const coverBuffer = await epub.bufferResolver(coverHref)
            if (!coverBuffer) {
                diagnoser({
                    message: `couldn't load cover image: ${coverHref}`,
                })
                return { metadata }
            } else {
                const cover = Buffer.from(coverBuffer).toString('base64')
                return { cover, metadata }
            }
        } else {
            return { metadata }
        }
    } else {
        return { metadata }
    }
}
