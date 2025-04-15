import { EpubPackage } from './epub'
import { BooqMeta } from '../core'
import { Diagnoser } from 'booqs-epub'

export function buildMeta(epub: EpubPackage, diags?: Diagnoser): BooqMeta {
    const pkgMeta = epub.metadata
    const result: BooqMeta = {
        title: undefined,
        authors: [],
        languages: [],
        contributors: [],
        descriptions: [],
        subjects: [],
        rights: undefined,
        tags: [],
    }
    const cover = pkgMeta.items.find(i => i.name === 'cover')
    if (cover) {
        result.cover = {
            href: cover.href,
        }
    }
    const titles: string[] = []
    for (let [key, value] of Object.entries(pkgMeta.fields)) {
        if (key.startsWith('@')) {
            continue
        }
        if (!value) {
            continue
        }
        if (!Array.isArray(value)) {
            diags?.push({
                message: `Unexpected metadata for key: ${key}, value: ${value}`,
                severity: 'warning',
            })
            continue
        }
        if (key.startsWith('dc:')) {
            key = key.substring('dc:'.length)
        }
        const texts = value
            .map(v => v['#text'])
            .filter((v): v is string => v !== undefined)
        switch (key) {
            case 'title':
                titles.push(...texts)
                break
            case 'creator':
                result.authors.push(...texts)
                break
            case 'contributor':
                result.contributors.push(...texts)
                break
            case 'language':
                result.languages.push(...texts)
                break
            case 'description':
                result.descriptions.push(...texts)
                break
            case 'subject':
                result.subjects.push(...texts.map(v => v.split(' -- ')).flat())
                break
            case 'rights':
                if (result.rights || texts.length > 1) {
                    diags?.push({
                        message: 'Multiple rights tags found',
                        severity: 'warning',
                    })
                }
                result.rights = result.rights
                    ? result.rights + ' ' + texts.join(' ')
                    : texts.join(' ')
                break
            case 'date': {
                const vals = value
                    .map(v => {
                        const event = v['@opf:event']
                        if (event) {
                            return {
                                name: event,
                                value: v['#text'] ?? '',
                            }
                        } else {
                            return {
                                name: 'date',
                                value: v['#text'] ?? '',
                            }
                        }
                    })
                result.tags.push(...vals)
            }
                break
            default:
                result.tags.push({
                    name: key,
                    value: texts.join(' '),
                })

        }
    }
    if (titles.length === 0) {
        diags?.push({
            message: 'No title found',
            severity: 'error',
        })
    }
    result.title = titles.join(', ')
    return result
}