import { Diagnostic, diagnoser } from 'booqs-epub'
import { Booq, BooqMeta } from '../core'
import { processEpub } from './book'
import { openFirstEpubPackage } from './epub'
import { buildMeta } from './metadata'

export async function parseEpub({ fileData, title }: {
    fileData: Buffer,
    title?: string,
}): Promise<{
    value: Booq | undefined,
    diags: Diagnostic[],
}> {
    const diags = diagnoser(title ?? 'parseEpub')
    try {
        const file = await openFirstEpubPackage({ fileData, diagnoser: diags })
        if (!file) {
            return { value: undefined, diags: diags.all() }
        }
        const book = await processEpub(file, diags)
        return { value: book, diags: diags.all() }
    } catch (err) {
        diags?.push({
            message: 'Unhandled exception on parsing',
            data: err as object,
        })
        return { value: undefined, diags: diags.all() }
    }
}

export type ExtractedMetadata = {
    metadata: BooqMeta,
    cover?: string,
}
export async function extractMetadata({ fileData, extractCover }: {
    fileData: Buffer,
    extractCover?: boolean,
}): Promise<{
    value: ExtractedMetadata | undefined,
    diags: Diagnostic[],
}> {
    const diags = diagnoser('extract metadata')
    const epub = await openFirstEpubPackage({ fileData, diagnoser: diags })
    if (!epub) {
        return { value: undefined, diags: diags.all() }
    }
    const metadata = buildMeta(epub, diags)
    if (extractCover) {
        const coverHref = metadata.cover?.href
        if (typeof coverHref === 'string') {
            const coverBuffer = await epub.bufferResolver(coverHref)
            if (!coverBuffer) {
                diags.push({
                    message: `couldn't load cover image: ${coverHref}`,
                })
                return { value: { metadata }, diags: diags.all() }
            } else {
                const cover = Buffer.from(coverBuffer).toString('base64')
                return { value: { cover, metadata }, diags: diags.all() }
            }
        } else {
            return { value: { metadata }, diags: diags.all() }
        }
    } else {
        return { value: { metadata }, diags: diags.all() }
    }
}
