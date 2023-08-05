import { Booq, BooqMeta } from '../core'
import { Diagnostic } from './result'
import { processEpub } from './book'
import { getMetadata } from './metadata'
import { openEpub } from './epub'

export * from './result'

export async function parseEpub({ fileData, diagnoser }: {
    fileData: Buffer,
    diagnoser?: (diag: Diagnostic) => void,
}): Promise<Booq | undefined> {
    diagnoser = diagnoser ?? (() => undefined)
    try {
        const { value: file, diags: fileDiags } = await openEpub({ fileData })
        fileDiags.forEach(diagnoser)
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
    const { value: epub, diags: fileDiags } = await openEpub({ fileData })
    fileDiags.forEach(diagnoser)
    if (!epub) {
        return undefined
    }
    const metadata = await getMetadata(epub)
    if (extractCover) {
        const coverHref = metadata.cover
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
