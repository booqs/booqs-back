import { BooqPath, BooqNode } from '../model';
import { findPath, rootIterator, iteratorsNode, nextNode, firstLeaf } from './iterator';

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
        if (preview.length >= length) {
            return preview;
        }
        iter = nextNode(iter);
        iter = iter && firstLeaf(iter);
    }
    return preview;
}