import { Diagnoser, PackageDocument, Unvalidated, openEpub as open } from 'booqs-epub'
import { createZipFileProvider } from './zip'

export type EpubSection = {
    fileName: string,
    id: string,
    content: string,
};
export type EpubMetadata = {
    fields: Record<string, Array<Record<string, string | undefined>> | undefined>,
    items: Array<{
        name: string,
        href: string,
        id: string,
    }>,
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
    diagnoser?: Diagnoser,
}): Promise<EpubPackage | undefined> {
    const epub = open(createZipFileProvider(fileData), diagnoser)
    for await (const pkg of epub.packages()) {
        const toc = await pkg.toc()
        try {

            const book: EpubPackage = {
                metadata: getMetadata(pkg.document, diagnoser),
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
            diagnoser?.push({
                message: 'exception on epub open',
                data: e as object,
            })
        }
    }
    diagnoser?.push({
        message: 'no packages found',
    })
    return undefined
}

function getMetadata(document: Unvalidated<PackageDocument>, diagnoser?: Diagnoser): EpubMetadata {
    let metadata = document.package?.[0]?.metadata?.[0]
    let manifest = document.package?.[0]?.manifest?.[0]?.item
    if (!metadata || !manifest) {
        diagnoser?.push({
            message: 'bad package: no metadata or manifest',
        })
        return {
            fields: {},
            items: [],
        }
    }
    let { meta, ...rest } = metadata
    let fields: EpubMetadata['fields'] = rest
    let items: EpubMetadata['items'] = []
    for (let m of meta ?? []) {
        let record = m as Record<string, string>
        let name = record['@name']
        if (name) {
            let contentId = record['@content']
            if (!contentId) {
                diagnoser?.push({
                    message: 'bad package: meta without content',
                })
                continue
            }
            let manifestItem = manifest.find(i => i['@id'] === contentId)
            if (!manifestItem) {
                fields[name] = [{ '#text': contentId }]
                continue
            }
            let { '@id': id, '@href': href } = manifestItem
            if (!id || !href) {
                diagnoser?.push({
                    message: 'bad package: meta with bad content',
                })
                continue
            }
            items.push({
                name,
                href,
                id,
            })
        }
    }
    return {
        fields,
        items,
    }
}
