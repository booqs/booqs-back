import { IResolvers } from 'apollo-server';
import { LibraryCard, booqForId } from '../books';
import { userBookmarks, userHighlights } from '../data';
import { BooqNode, previewForPath } from 'booqs-core';

export type BooqParent = LibraryCard;
export const booqResolver: IResolvers<BooqParent> = {
    Booq: {
        async bookmarks(parent, _, { user }) {
            return user
                ? userBookmarks(user, parent.id)
                : [];
        },
        async highlights(parent, _, { user }) {
            return user
                ? userHighlights(user, parent.id)
                : [];
        },
        async preview(parent, { path, length }) {
            const booq = await booqForId(parent.id);
            if (!booq) {
                return undefined;
            }
            const preview = previewForPath(booq.nodes, path, length);
            return preview?.trim()?.substr(0, length);
        },
        nodesConnection(parent, { first, after }) {
            return buildNodesConnection({
                card: parent,
                first, after,
            });
        },
    },
};

async function buildNodesConnection({ card, first, after }: {
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
