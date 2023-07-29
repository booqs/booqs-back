import { BooqNode, findPathForId } from '../core'
import { Result } from './result'
import { resolveRefs } from './refs'
import { markParagraphs } from './pph'

export function preprocess(nodes: BooqNode[]): Result<BooqNode[]> {
    const resolved = resolveRefs(nodes)
    const marked = markParagraphs(resolved)
    return {
        value: marked,
        diags: [],
    }
}

function resolveNodesRefs(root: BooqNode[], nodes: BooqNode[]): BooqNode[] {
    return nodes.map(
        node => resolveNodeRefs(root, node),
    )
}

function resolveNodeRefs(root: BooqNode[], node: BooqNode): BooqNode {
    if (node.kind !== 'element') {
        return node
    }
    const { href, ...rest } = node.attrs ?? {}
    const ref = href
        ? findPathForId(root, href.substr(1))
        : undefined
    const attrs = ref
        ? (Object.keys(rest).length > 0 ? rest : undefined)
        : node.attrs
    const children = node.children?.length
        ? resolveNodesRefs(root, node.children)
        : undefined
    return {
        ...node,
        attrs,
        children,
        ref,
    }
}