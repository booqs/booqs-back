import { BooqNode, BooqRange, BooqPath } from './common';
import {
    findPath, rootIterator, firstLeaf, iteratorsNode, nextNode,
} from './iterator';

export function nodesForRange(nodes: BooqNode[], { start, end }: BooqRange): BooqNode[] {
    const [startHead, ...startTail] = start;
    const [endHead, ...endTail] = end ?? [];
    const actualStart = startHead ?? 0;
    const actualEnd = Math.min(nodes.length, endHead ?? nodes.length);
    if (nodes.length <= actualStart) {
        return [];
    } else {
        const startNode = subnodeForRange(nodes[actualStart], {
            start: startTail,
            end: endHead === startHead
                ? endTail
                : undefined,
        });
        const insideNodes = nodes.slice(actualStart + 1, actualEnd);
        const endNode = actualStart === actualEnd ? undefined
            : endTail.length === 0 ? undefined
                : nodes.length <= actualEnd ? undefined
                    : subnodeForRange(nodes[actualEnd], {
                        start: [0],
                        end: endTail,
                    });
        const result = endNode
            ? [startNode, ...insideNodes, endNode]
            : [startNode, ...insideNodes];
        return result;
    }
}

function subnodeForRange(node: BooqNode, range: BooqRange): BooqNode {
    if (!node.children) {
        return node;
    } else {
        return {
            ...node,
            children: nodesForRange(node.children, range),
            offset: range.start[0] || undefined,
        };
    }
}

export function findPathForId(nodes: BooqNode[], targetId: string): BooqPath | undefined {
    for (let idx = 0; idx < nodes.length; idx++) {
        const { id, children } = nodes[idx];
        if (id === targetId) {
            return [idx];
        } else if (children) {
            const path = findPathForId(children, targetId);
            if (path) {
                return [idx, ...path];
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
        preview += node.content ?? '';
        if (preview.trim().length >= length) {
            return preview.trim();
        }
        iter = nextNode(iter);
        iter = iter && firstLeaf(iter);
    }
    return preview.trim();
}