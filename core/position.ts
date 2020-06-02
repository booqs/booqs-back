import { BooqNode, BooqPath } from './model';
import { assertNever } from './misc';

export function nodeLength(node: BooqNode): number {
    switch (node.kind) {
        case 'element':
            return nodesLength(node.children ?? []);
        case 'text':
            return node.content.length;
        case 'stub':
            return node.length;
        default:
            assertNever(node);
            return 0;
    }
}

export function nodesLength(nodes: BooqNode[]) {
    return nodes.reduce((len, n) => len + nodeLength(n), 0);
}

export function positionForPath(nodes: BooqNode[], path: BooqPath): number {
    const [head, ...tail] = path;
    if (head === undefined) {
        return 0;
    }
    let position = 0;
    for (let idx = 0; idx < Math.min(nodes.length, head); idx++) {
        position += nodeLength(nodes[idx]);
    }
    const last = nodes[head];
    if (last.kind === 'element' && last?.children) {
        const after = positionForPath(last.children, tail);
        return after + position;
    } else {
        return position;
    }
}