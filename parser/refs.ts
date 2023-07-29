import { BooqNode, findPathForId } from '../core'

export function resolveRefs(nodes: BooqNode[]): BooqNode[] {
    return resolveNodesRefs(nodes, nodes)
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
    const ref = href?.startsWith('#') ? findPathForId(root, href.substring(1))
        : href !== undefined ? findPathForId(root, href)
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