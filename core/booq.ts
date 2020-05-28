import { BooqNode, BooqRange, BooqPath, nodeLength } from './common';
import {
    findPath, rootIterator, firstLeaf, iteratorsNode, nextNode,
} from './iterator';

export function nodesForRange(nodes: BooqNode[], range: BooqRange): BooqNode[] {
    const [startHead, ...startTail] = range.start;
    const [endHead, ...endTail] = range.end ?? [nodes.length];
    if (!startHead) {
        return nodes;
    }
    const result: BooqNode[] = [];
    for (let idx = 0; idx < nodes.length; idx++) {
        const node = nodes[idx];
        if (idx < startHead) {
            result.push({
                kind: 'stub',
                length: nodeLength(node),
            });
        } else if (idx === startHead) {
            if (node.kind === 'element' && node.children) {
                result.push({
                    ...node,
                    children: nodesForRange(node.children, {
                        start: startTail,
                        end: startHead === endHead && endTail.length > 0
                            ? endTail
                            : undefined,
                    }),
                });
            } else {
                result.push(node);
            }
        } else if (idx < endHead) {
            result.push(node);
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

export function previewForPath(nodes: BooqNode[], path: BooqPath, length: number) {
    let iter = findPath(rootIterator(nodes), path);
    if (!iter) {
        return undefined;
    }
    iter = firstLeaf(iter);
    let preview = '';
    while (iter) {
        const node = iteratorsNode(iter);
        preview += node.kind === 'text'
            ? node.content
            : '';
        if (preview.trim().length >= length) {
            return preview.trim();
        }
        iter = nextNode(iter);
        iter = iter && firstLeaf(iter);
    }
    return preview.trim();
}