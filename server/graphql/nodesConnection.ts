import { BooqNode } from '../../core';
import { LibraryCard } from '../sources';
import { booqForId } from '../books';

export async function buildNodesConnection({ card, first, after }: {
    card: LibraryCard,
    first?: number,
    after?: string,
}) {
    const booq = await booqForId(card.id);
    if (!booq) {
        return undefined;
    }
    const start = after
        ? decodeCursor(after) + 1
        : 0;
    const end = Math.min(
        booq.nodes.length,
        start + (first ?? 1),
    );
    const edges: Edge[] = [];
    for (let index = start; index < end; index++) {
        edges.push({
            node: booq.nodes[index],
            cursor: encodeCursor(index),
        });
    }

    return {
        edges,
        pageInfo: {
            hasPreviousPage: start > 0,
            hasNextPage: end < booq.nodes.length,
            startCursor: encodeCursor(0),
            endCursor: encodeCursor(booq.nodes.length - 1),
        },
    };
}

type Edge = {
    node: BooqNode,
    cursor: string,
};

type CursorContent = number;
function decodeCursor(cursor: string): CursorContent {
    const parsed = parseInt(cursor, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function encodeCursor(content: CursorContent): string {
    return content.toString();
}