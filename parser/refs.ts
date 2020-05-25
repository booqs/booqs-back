import { BooqNode, findPathForId } from '../core';
import { Result } from './result';

export function resolveRefs(nodes: BooqNode[]): Result<BooqNode[]> {
    return {
        value: resolveNodesRefs(nodes, nodes),
        diags: [],
    };
}

function resolveNodesRefs(root: BooqNode[], nodes: BooqNode[]): BooqNode[] {
    return nodes.map(
        node => resolveNodeRefs(root, node),
    );
}

function resolveNodeRefs(root: BooqNode[], node: BooqNode): BooqNode {
    const { href, ...rest } = node.attrs ?? {};
    const ref = href
        ? findPathForId(root, href.substr(1))
        : undefined;
    const attrs = ref
        ? (Object.keys(rest).length > 0 ? rest : undefined)
        : node.attrs;
    const children = node.children?.length
        ? resolveNodesRefs(root, node.children)
        : undefined;
    return {
        ...node,
        attrs,
        children,
        ref,
    };
}