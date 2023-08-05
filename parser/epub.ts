import { Diagnostic, openEpub as open } from 'booqs-epub'
import { createZipFileProvider } from './zip'

export type EpubSection = {
    fileName: string,
    id: string,
    content: string,
};
export type EpubMetadata = {
    [key: string]: string[],
};
export type EpubTocItem = {
    level: number,
    label: string,
    href: string,
};
export type EpubPackage = {
    metadata: EpubMetadata,
    bufferResolver(href: string): Promise<Buffer | undefined>,
    textResolver(href: string): Promise<string | undefined>,
    sections(): AsyncGenerator<EpubSection>,
    toc(): Generator<EpubTocItem>,
};

export async function openFirstEpubPackage({ fileData, diagnoser }: {
    fileData: Buffer,
    diagnoser?: (diag: Diagnostic) => void,
}): Promise<EpubPackage | undefined> {
    const epub = open(createZipFileProvider(fileData))
    for await (const pkg of epub.packages()) {
        const toc = await pkg.toc()
        try {

            const book: EpubPackage = {
                metadata: pkg.metadata(),
                bufferResolver: async href => {
                    const item = await pkg.loadHref(href)
                    if (!item || !item.content) {
                        return undefined
                    } else if (typeof item.content === 'string') {
                        return undefined
                    } else {
                        return item.content as Buffer
                    }
                },
                textResolver: async href => {
                    const item = await pkg.loadHref(href)
                    if (!item || !item.content) {
                        return undefined
                    } else if (typeof item.content === 'string') {
                        return item.content
                    } else {
                        return undefined
                    }
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
                            fileName: href,
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
                            label: el.label,
                            href: el.href,
                        }
                    }
                },
            }

            return book
        } catch (e) {
            if (diagnoser) {
                diagnoser({
                    message: 'exception on epub open',
                    data: e as object,
                })
            }
        }
    }
    if (diagnoser) {
        diagnoser({
            message: 'no packages found',
        })
    }
    return undefined
}
