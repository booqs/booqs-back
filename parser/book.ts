import { BooqNode, Booq } from '../core'
import { EpubPackage } from './epub'
import { Result, Diagnostic } from './result'
import { parseSection } from './section'
import { buildImages } from './images'
import { buildToc } from './toc'
import { preprocess } from './preprocess'
import { buildMeta } from './metadata'

export async function processEpub(epub: EpubPackage): Promise<Result<Booq>> {
    const diags: Diagnostic[] = []
    const nodes: BooqNode[] = []
    for await (const section of epub.sections()) {
        const { value, diags: sectionDiags } = await parseSection(section, epub)
        diags.push(...sectionDiags)
        if (!value) {
            return { diags }
        }
        nodes.push(value)
    }

    let meta = buildMeta(epub, diags)
    const { value: images, diags: imagesDiags } = await buildImages(nodes, meta, epub)
    diags.push(...imagesDiags)

    const { value: toc, diags: tocDiags } = await buildToc(nodes, epub)
    diags.push(...tocDiags)

    const { value: prepocessed, diags: refsDiags } = preprocess(nodes)
    diags.push(...refsDiags)

    return {
        value: {
            nodes: prepocessed ?? [],
            meta,
            toc: toc ?? {
                title: undefined,
                items: [],
                length: 0,
            },
            images: images ?? {},
        },
        diags,
    }
}
