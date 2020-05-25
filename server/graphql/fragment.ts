import {
    BooqNode, Booq, BooqPath, nodesForRange, pathLessThan,
} from '../../core';
import { LibraryCard } from '../sources';
import { booqForId } from '../books';
import { positionForPath } from '../../core/utils/node';

export async function buildFragment({ card, path }: {
    card: LibraryCard,
    path?: BooqPath,
}): Promise<BooqFragment | undefined> {
    const booq = await booqForId(card.id);
    if (!booq) {
        return undefined;
    }

    return path
        ? fragmentForPath(booq, path)
        : fullBooqFragment(booq);
}

function fullBooqFragment(booq: Booq): BooqFragment {
    return {
        previous: undefined,
        next: undefined,
        current: {
            path: [0],
            title: undefined,
        },
        position: 0,
        nodes: booq.nodes,
    };
}

function fragmentForPath(booq: Booq, path: BooqPath): BooqFragment {
    let previous: BooqAnchor | undefined;
    let next: BooqAnchor | undefined;
    let current: BooqAnchor = {
        path: [],
        title: undefined,
    };

    for (const anchor of generateBreakPoints(booq)) {
        if (!pathLessThan(path, anchor.path)) {
            previous = current;
            current = anchor;
        } else {
            next = anchor;
            break;
        }
    }
    const position = positionForPath(booq.nodes, current.path);
    const nodes = nodesForRange(booq.nodes, {
        start: current.path,
        end: next?.path,
    });

    return {
        previous, current, next,
        position,
        nodes,
    };
}

function* generateBreakPoints(booq: Booq) {
    for (const item of booq.toc.items) {
        yield {
            title: item.title,
            path: item.path,
        };
    }
}

type BooqFragment = {
    previous?: BooqAnchor,
    current: BooqAnchor,
    next?: BooqAnchor,
    position: number,
    nodes: BooqNode[],
};
type BooqAnchor = {
    path: BooqPath,
    title: string | undefined,
};
