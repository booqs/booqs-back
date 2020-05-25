import { BooqNode, BooqPath, Booq } from './common';

export function nodeText(node: BooqNode): string {
    if (node.children?.length) {
        return node.children
            .map(nodeText)
            .join('');
    } else {
        return node.content ?? '';
    }
}

export type BooqNodeIteratorValue = {
    node: BooqNode,
    path: BooqPath,
    position: number,
};
export function* iterateNodes(nodes: BooqNode[], path: BooqPath = [0], position = 0): Generator<BooqNodeIteratorValue, number> {
    const head = path.slice(0, path.length - 1);
    let idx = path[path.length - 1];
    for (const node of nodes) {
        const nextPath = [...head, idx];
        yield {
            node,
            position,
            path: nextPath,
        };
        if (node.children) {
            const children = iterateNodes(node.children, [...nextPath, 0], position);
            let child = children.next();
            while (!child.done) {
                yield child.value;
                child = children.next();
            }
            position += child.value;
        } else {
            position += node.content?.length ?? 1;
        }
        idx++;
    }
    return position;
}

export function booqLength(booq: Booq): number {
    return nodesLength(booq.nodes);
}

export function nodeLength(node: BooqNode): number {
    if (node.children?.length) {
        return nodesLength(node.children);
    } else if (node.content) {
        return node.content.length;
    } else {
        return 1;
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
    if (last?.children) {
        const after = positionForPath(last.children, tail);
        return after + position;
    } else {
        return position;
    }
}
