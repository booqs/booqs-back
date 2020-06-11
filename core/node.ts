import { BooqNode, BooqRange, BooqPath } from './model';
import { nodeLength } from './position';

export function nodeForPath(nodes: BooqNode[], path: BooqPath): BooqNode | undefined {
    const [head, ...tail] = path;
    if (!head || head >= nodes.length) {
        return undefined;
    }
    const node = nodes[head];
    if (tail.length === 0) {
        return node;
    } else if (node.kind === 'element') {
        return nodeForPath(node.children ?? [], tail);
    } else {
        return undefined;
    }
}

export function nodesForRange(nodes: BooqNode[], range: BooqRange): BooqNode[] {
    const [startHead, ...startTail] = range.start;
    const [endHead, ...endTail] = range.end ?? [];
    const actualStart = startHead ?? 0;
    const actualEnd = endHead ?? nodes.length;
    const result: BooqNode[] = [];
    for (let idx = 0; idx < nodes.length; idx++) {
        const node = nodes[idx];
        if (idx < actualStart) {
            result.push({
                kind: 'stub',
                length: nodeLength(node),
            });
        } else if (idx === actualStart) {
            if (node.kind === 'element' && node.children) {
                result.push({
                    ...node,
                    children: nodesForRange(node.children, {
                        start: startTail,
                        end: actualEnd === idx && endTail.length > 0
                            ? endTail
                            : undefined,
                    }),
                });
            } else {
                result.push(node);
            }
        } else if (idx < actualEnd) {
            result.push(node);
        } else if (idx === actualEnd && endTail.length) {
            if (node.kind === 'element' && node.children) {
                result.push({
                    ...node,
                    children: nodesForRange(node.children, {
                        start: [0],
                        end: endTail,
                    }),
                });
            } else {
                result.push(node);
            }
        } else {
            result.push({
                kind: 'stub',
                length: nodeLength(node),
            });
        }
    }
    return result;
}

export function findPathForId(nodes: BooqNode[], targetId: string): BooqPath | undefined {
    for (let idx = 0; idx < nodes.length; idx++) {
        const node = nodes[idx];
        if (node.kind === 'element') {
            const { id, children } = node;
            if (id === targetId) {
                return [idx];
            } else if (children) {
                const path = findPathForId(children, targetId);
                if (path) {
                    return [idx, ...path];
                }
            }
        }
    }
    return undefined;
}