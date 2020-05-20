import {
    BooqNode, Booq, BooqPath, pathFromString, pathToString,
    BooqRange, nodesForRange, nextNode, rootIterator, findPath, iteratorsPath, pathLessThan,
} from '../../core';
import { LibraryCard } from '../sources';
import { booqForId } from '../books';

export async function buildNodesConnection({ card, after }: {
    card: LibraryCard,
    after?: string,
}): Promise<Connection | undefined> {
    const booq = await booqForId(card.id);
    if (!booq) {
        return undefined;
    }

    const afterPath = after ? decodeCursor(after) : undefined;
    const range = rangeAfterPath(booq, afterPath);

    return connectionForRange(booq, range);
}

function rangeAfterPath(booq: Booq, afterPath?: BooqPath): BooqRange {
    const root = rootIterator(booq.nodes);
    const afterNode = afterPath && findPath(root, afterPath);
    const startNode = afterNode && nextNode(afterNode);
    const start = startNode
        ? iteratorsPath(startNode)
        : [0];
    let end = undefined;
    for (const path of generateBreakPoints(booq)) {
        if (pathLessThan(start, path)) {
            end = path;
            break;
        }
    }

    return {
        start,
        end,
    };
}

function* generateBreakPoints(booq: Booq) {
    for (const item of booq.toc.items) {
        yield item.path;
    }
}

function connectionForRange(booq: Booq, range: BooqRange): Connection {
    const edges = Array.from(edgesForRange(booq, range));
    const lastPath = [booq.nodes.length];

    return {
        edges,
        pageInfo: {
            hasPreviousPage: range.start.length >= 0 && range.start[0] >= 0,
            hasNextPage: range.end ? true : false,
            startCursor: encodeCursor([0]),
            endCursor: encodeCursor(lastPath),
        },
    };
}

function* edgesForRange(booq: Booq, range: BooqRange) {
    const [head, ...tail] = nodesForRange(booq.nodes, range);
    if (head) {
        yield nodeToEdge(head, range.start);
    }
    const offset = (range.start[0] ?? 0) + 1;
    for (let idx = 0; idx < tail.length - 1; idx++) {
        const node = tail[idx];
        const path = [idx + offset];
        yield nodeToEdge(node, path);
    }
    if (tail.length) {
        const last = tail[tail.length - 1];
        if (range.end) {
            yield nodeToEdge(last, range.end);
        } else {
            yield nodeToEdge(last, [tail.length - 1 + offset]);
        }
    }
}

function nodeToEdge(node: BooqNode, path: BooqPath): Edge {
    return {
        node,
        cursor: encodeCursor(path),
    };
}

type Edge = {
    node: BooqNode,
    cursor: string,
};
type Connection = {
    edges: Edge[],
    pageInfo: {
        hasPreviousPage: boolean,
        hasNextPage: boolean,
        startCursor: string,
        endCursor: string,
    },
};

type CursorContent = BooqPath;
function decodeCursor(cursor: string): CursorContent {
    const path = pathFromString(cursor);
    return path ?? [0];
}

function encodeCursor(content: CursorContent): string {
    return pathToString(content);
}
