import { BooqNode, BooqRange, BooqPath } from './model';
import {
    findPath, rootIterator, firstLeaf, iteratorsNode, nextNode,
} from './iterator';
import { assertNever } from './misc';

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

export function textForRange(nodes: BooqNode[], { start, end }: BooqRange): string {
    // TODO: implement
    return '';
}
