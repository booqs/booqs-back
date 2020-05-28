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
export type BooqElementNode = {
    kind: 'element',
    name: string,
    id?: string,
    style?: BooqNodeStyle,
    children?: BooqNode[],
    attrs?: BooqNodeAttrs,
    fileName?: string,
    ref?: BooqPath,
    pph?: boolean,
}
export type BooqTextNode = {
    kind: 'text',
    content: string,
};
export type BooqStubNode = {
    kind: 'stub',
    length: number,
};
export type BooqNode = BooqElementNode | BooqTextNode | BooqStubNode;

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

export function samePath(first: BooqPath, second: BooqPath) {
    return first.length === second.length
        && first.every((p, idx) => p === second[idx]);
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
    switch (node.kind) {
        case 'element':
            return nodesLength(node.children ?? []);
        case 'text':
            return node.content.length;
        case 'stub':
            return node.length;
        default:
            assertNever(node);
            return 0;
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
    if (last.kind === 'element' && last?.children) {
        const after = positionForPath(last.children, tail);
        return after + position;
    } else {
        return position;
    }
}

export function nodeText(node: BooqNode): string {
    switch (node.kind) {
        case 'element':
            return node.children?.map(nodeText).join('') ?? '';
        case 'text':
            return node.content;
        case 'stub':
            return '';
        default:
            assertNever(node);
            return '';
    }
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
        // tslint:disable-next-line: no-bitwise
        const r = Math.random() * 16 | 0;
        // tslint:disable-next-line: no-bitwise
        const v = ch === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function assertNever(x: never) {
    return x;
}
