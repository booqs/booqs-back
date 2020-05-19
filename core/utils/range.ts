import { BooqNode, BooqRange } from '../model';

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