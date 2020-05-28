import { BooqNode, BooqPath } from './common';

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
