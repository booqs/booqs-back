import { BooqNode, findPathForId } from '../core'
import { resolveRefs } from './refs'
import { markParagraphs } from './pph'

export function preprocess(nodes: BooqNode[]): BooqNode[] {
    const resolved = resolveRefs(nodes)
    const marked = markParagraphs(resolved)
    return marked
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
        ? findPathForId(root, href.substring(1))
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