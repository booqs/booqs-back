import { EPub } from 'epub2'
import { Diagnostic, Result } from '../parser/result'
import { EpubPackage, EpubMetadata, EpubSection } from '../parser/epub'
import { processEpub } from '../parser/book'
import { Booq } from '../core'

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
        // console.log(pretty(file.metadata))
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

async function openEpub({ fileData }: {
    fileData: Buffer,
}): Promise<Result<EpubPackage>> {
    let epub: FixedEpub
    function resolveHref(href: string) {
        href = href.startsWith('../')
            ? href.substring('../'.length)
            : href
        const items = listItems(epub)
        const idItem = items
            .find(item => item.href && item.href.endsWith(href))
        return idItem?.id
    }
    function getFileName(href: string) {
        // NOTE: couldn't find better solution
        const comps = href.split('/')
        const fileName = comps[comps.length - 1]
        return fileName
    }

    try {
        epub = await FixedEpub.createFromData(fileData) as FixedEpub

        const book: EpubPackage = {
            metadata: extractMetadata(epub),
            bufferResolver: async href => {
                const itemId = resolveHref(href)
                if (!itemId) {
                    return undefined
                }
                const [buffer] = await epub.getImageAsync(itemId)
                return buffer
            },
            textResolver: async href => {
                const itemId = resolveHref(href)
                if (!itemId) {
                    return undefined
                }
                const [buffer] = await epub.getFileAsync(itemId)
                return buffer
                    ? Buffer.from(buffer).toString('utf8')
                    : undefined
            },
            sections: async function* () {
                for (const el of epub.flow) {
                    if (el.id && el.href) {
                        const chapter = await epub.chapterForId(el.id)
                        const section: EpubSection = {
                            id: el.id,
                            fileName: getFileName(el.href),
                            content: chapter,
                        }
                        yield section
                    }
                }
            },
            toc: function* () {
                for (const el of epub.toc) {
                    if (el.href === undefined || el.title === undefined || el.level === undefined) {
                        continue
                    }
                    yield {
                        level: el.level,
                        label: el.title,
                        href: el.href && getFileName(el.href),
                    }
                }
            },
        }

        return { value: book, diags: [] }
    } catch (e) {
        return {
            diags: [{
                message: 'exception on epub open',
                data: e as object,
            }],
        }
    }
}

class FixedEpub extends EPub {
    static libPromise = Promise;

    static createFromData(fileData: Buffer): Promise<FixedEpub> {
        // Note: very hacky, but under the hood 'epub2' just send
        // file name to AdmZip constructor, which accepts Buffer as arg.
        // We should use own simple epub parser instead of 'epub2' though.
        return FixedEpub.createAsync(fileData as any)
    }

    // This is workaround for epub2 bug. Remove it once fixed
    walkNavMap(branch: any, path: any, idList: any, level: number, pe?: any, parentNcx?: any, ncxIdx?: any) {
        if (Array.isArray(branch)) {
            branch.forEach(b => {
                if (b.navLabel && b.navLabel.text === '') {
                    b.navLabel.text = ' '
                }
            })
        }
        return super.walkNavMap(branch, path, idList, level, pe, parentNcx, ncxIdx)
    }

    chapterForId(id: string): Promise<string> {
        return this.getChapterRawAsync(id)
    }
}

function extractMetadata(epub: EPub): EpubMetadata {
    const metadata = { ...epub.metadata } as any
    let result: EpubMetadata = {
        fields: {},
        items: [],
    }
    const coverId = metadata.cover
    if (coverId) {
        const items = listItems(epub)
        const coverItem = items
            .find(item => item.id === coverId)
        if (coverItem && coverItem.id && coverItem.href) {
            result.items.push({
                name: 'cover',
                id: coverItem.id,
                href: coverItem.href,
            })
        }
    }
    const raw = getRawData(epub.metadata)
    for (let [key, value] of Object.entries(raw)) {
        if (key.startsWith('dc:')) {
            key = key.substring('dc:'.length)
        }
        if (Array.isArray(value)) {
            result.fields[key] = value.map(processValue)
        } else {
            result.fields[key] = [processValue(value)]
        }
    }

    return result
}

function processValue(value: unknown) {
    if (typeof value === 'string') {
        return {
            '#text': value,
        }
    } else if (typeof value === 'object') {
        let any = value as Record<string, any | undefined>
        return {
            '#text': any['#'],
            '@opf:event': any['@']?.['opf:event'],
        }
    } else {
        return {}
    }
}

function getRawData(object: any): any {
    const symbol = EPub.SYMBOL_RAW_DATA
    return object[symbol]
}

function listItems(epub: EPub) {
    return Object.values(epub.manifest)
}