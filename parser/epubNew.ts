import { openEpub as open } from 'booqs-epub'
import { Result } from './result'
import { EpubFile, EpubSection } from './epubFile'
import { createZipFileProvider } from './zip'

export async function openEpub({ fileData }: {
    fileData: Buffer,
}): Promise<Result<EpubFile>> {
    const epub = open(createZipFileProvider(fileData))
    // function resolveHref(href: string) {
    //     href = href.startsWith('../')
    //         ? href.substring('../'.length)
    //         : href
    //     const items = listItems(epub)
    //     const idItem = items
    //         .find(item => item.href && item.href.endsWith(href))
    //     return idItem?.id
    // }
    // TODO: rethink
    function getFileName(href: string) {
        // NOTE: couldn't find better solution
        const comps = href.split('/')
        const fileName = comps[comps.length - 1]
        return fileName
    }
    for await (const pkg of epub.packages()) {
        const toc = await pkg.toc()
        try {

            const book: EpubFile = {
                rawMetadata: {},
                metadata: pkg.metadata(),
                imageResolver: async href => {
                    const item = await pkg.loadHref(href)
                    if (!item || !item.content) {
                        return undefined
                    }
                    return item.content as Buffer
                },
                itemResolver: async href => {
                    const item = await pkg.loadHref(href)
                    if (!item || !item.content) {
                        return undefined
                    }
                    return item.content as Buffer
                },
                sections: async function* () {
                    for (const el of pkg.spine()) {
                        const id = el.manifestItem['@id']
                        const href = el.manifestItem['@href']
                        if (!id || !href) {
                            continue
                        }
                        const loaded = await el.load()
                        if (!loaded || typeof loaded.content !== 'string') {
                            continue
                        }
                        const section: EpubSection = {
                            id,
                            fileName: getFileName(href),
                            content: loaded.content,
                        }
                        yield section
                    }
                },
                toc: function* () {
                    if (!toc) {
                        return
                    }
                    for (const el of toc.items) {
                        yield {
                            level: el.level,
                            title: el.label,
                            href: el.href && getFileName(el.href),
                        }
                    }
                },
            }

            return { value: book, diags: [] }
        } catch (e) {
            return {
                diags: [{
                    diag: 'exception on epub open',
                    data: e as object,
                }],
            }
        }
    }
    return {
        diags: [{
            diag: 'no packages found',
        }],
    }
}