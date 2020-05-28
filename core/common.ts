export type BooqId = {
    id: string,
    source: string,
};

export type BooqPath = number[];
export type BooqRange = {
    start: BooqPath,
    end?: BooqPath,
};

export type BooqNodeAttrs = {
    [name in string]?: string;
};
export type BooqNodeStyle = {
    [name in string]?: string;
};
export type BooqNode = {
    name?: string,
    id?: string,
    style?: BooqNodeStyle,
    children?: BooqNode[],
    attrs?: BooqNodeAttrs,
    content?: string,
    offset?: number,
    fileName?: string,
    ref?: BooqPath,
}

export type TableOfContentsItem = {
    title: string | undefined,
    level: number,
    path: BooqPath,
    position: number,
};
export type TableOfContents = {
    title: string | undefined,
    items: TableOfContentsItem[],
    length: number,
};

export type BooqMeta = {
    [name in string]?: string | string[];
};
export type BooqImages = {
    [src: string]: string,
};
export type Booq = {
    nodes: BooqNode[],
    meta: BooqMeta,
    toc: TableOfContents,
    images: BooqImages,
}

const separator = '-';
export function pathToString(path: BooqPath): string {
    return path.join(separator);
}

export function pathFromString(pathString: string): BooqPath | undefined {
    const path = pathString
        .split(separator)
        .map(c => parseInt(c, 10));
    return path.some(isNaN)
        ? undefined
        : path;
}

export function pathLessThan(first: BooqPath, second: BooqPath): boolean {
    const [firstHead, ...firstTail] = first;
    const [secondHead, ...secondTail] = second;
    if (secondHead === undefined) {
        return false;
    } else if (firstHead === undefined) {
        return true;
    } else if (firstHead === secondHead) {
        return pathLessThan(firstTail, secondTail);
    } else {
        return firstHead < secondHead;
    }
}

export function pathInRange(path: BooqPath, range: BooqRange): boolean {
    return pathLessThan(path, range.start)
        ? false
        : (
            range.end
                ? pathLessThan(path, range.end)
                : true
        );
}

export function nodeLength(node: BooqNode): number {
    if (node.children?.length) {
        return nodesLength(node.children);
    } else if (node.content) {
        return node.content.length;
    } else {
        return 1;
    }
}

export function nodesLength(nodes: BooqNode[]) {
    return nodes.reduce((len, n) => len + nodeLength(n), 0);
}

export function positionForPath(nodes: BooqNode[], path: BooqPath): number {
    const [head, ...tail] = path;
    if (head === undefined) {
        return 0;
    }
    let position = 0;
    for (let idx = 0; idx < Math.min(nodes.length, head); idx++) {
        position += nodeLength(nodes[idx]);
    }
    const last = nodes[head];
    if (last?.children) {
        const after = positionForPath(last.children, tail);
        return after + position;
    } else {
        return position;
    }
}

export function nodeText(node: BooqNode): string {
    if (node.children?.length) {
        return node.children
            .map(nodeText)
            .join('');
    } else {
        return node.content ?? '';
    }
}
