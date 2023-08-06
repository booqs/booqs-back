import { BooqNode, Booq } from '../core'
import { EpubPackage } from './epub'
import { parseSection } from './section'
import { buildImages } from './images'
import { buildToc } from './toc'
import { preprocess } from './preprocess'
import { buildMeta } from './metadata'
import { Diagnoser } from 'booqs-epub'

export async function processEpub(epub: EpubPackage, diags: Diagnoser): Promise<Booq | undefined> {
    const nodes: BooqNode[] = []
    for await (const section of epub.sections()) {
        const value = await parseSection(section, epub, diags)
        if (!value) {
            return undefined
        }
        nodes.push(value)
    }

    let meta = buildMeta(epub, diags)
    const images = await buildImages(nodes, meta, epub, diags)
    const toc = await buildToc(nodes, epub, diags)

    const prepocessed = preprocess(nodes)

    return {
        nodes: prepocessed,
        meta,
        toc: toc ?? {
            title: undefined,
            items: [],
            length: 0,
        },
        images: images ?? {},
    }
}
