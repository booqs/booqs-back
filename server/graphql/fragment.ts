import {
    BooqNode, Booq, BooqPath, nodesForRange, pathLessThan,
} from '../../core';
import { LibraryCard } from '../sources';
import { booqForId } from '../books';

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
            position: 0,
        },
        position: 0,
        nodes: booq.nodes,
    };
}

function fragmentForPath(booq: Booq, path: BooqPath): BooqFragment {
    let previous: BooqAnchor | undefined;
    let next: BooqAnchor | undefined;
    let current: BooqAnchor = {
        path: [0],
        title: booq.toc.title,
        position: 0,
    };

    for (const anchor of generateAnchors(booq, fragmentLength)) {
        if (!pathLessThan(path, anchor.path)) {
            previous = current;
            current = anchor;
        } else {
            next = anchor;
            break;
        }
    }
    const nodes = nodesForRange(booq.nodes, {
        start: current.path,
        end: next?.path,
    });

    return {
        previous, current, next,
        position: current.position,
        nodes,
    };
}

const fragmentLength = 4500;
function* generateAnchors(booq: Booq, length: number) {
    let position = 0;
    for (const item of booq.toc.items) {
        if (item.position - position > length) {
            yield {
                position: item.position,
                title: item.title,
                path: item.path,
            };
            position = item.position;
        }
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
    position: number,
};
