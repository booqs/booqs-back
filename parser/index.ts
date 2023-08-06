import { Diagnoser, diagnoser } from 'booqs-epub'
import { Booq, BooqMeta } from '../core'
import { processEpub } from './book'
import { openFirstEpubPackage } from './epub'
import { buildMeta } from './metadata'

export async function parseEpub({ fileData, diagnoser: diags }: {
    fileData: Buffer,
    diagnoser?: Diagnoser,
}): Promise<Booq | undefined> {
    try {
        const file = await openFirstEpubPackage({ fileData, diagnoser: diags })
        if (!file) {
            return undefined
        }
        const book = await processEpub(file, diags ?? diagnoser('process epub'))
        return book
    } catch (err) {
        diags?.push({
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
    diagnoser?: Diagnoser,
}): Promise<ExtractedMetadata | undefined> {
    const epub = await openFirstEpubPackage({ fileData, diagnoser })
    if (!epub) {
        return undefined
    }
    const metadata = buildMeta(epub, diagnoser)
    if (extractCover) {
        const coverHref = metadata.cover?.href
        if (typeof coverHref === 'string') {
            const coverBuffer = await epub.bufferResolver(coverHref)
            if (!coverBuffer) {
                diagnoser?.push({
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
