import { BooqNode, BooqPath } from './model'

export type BooqNodeIterator = {
    parent: BooqNodeIterator | undefined,
    nodes: BooqNode[],
    index: number,
}

export function iteratorsNode(iter: BooqNodeIterator): BooqNode {
    return iter.nodes[iter.index]
}

export function iteratorsPath(iter: BooqNodeIterator): BooqPath {
    if (iter.parent) {
        return [...iteratorsPath(iter.parent), iter.index]
    } else {
        return [iter.index]
    }
}

export function rootIterator(nodes: BooqNode[]) {
    return {
        nodes,
        index: 0,
        parent: undefined,
    }
}

export function firstLeaf(iter: BooqNodeIterator): BooqNodeIterator {
    const node = iteratorsNode(iter)
    if (node.kind === 'element' && node.children?.length) {
        return firstLeaf({
            parent: iter,
            nodes: node.children,
            index: 0,
        })
    } else {
        return iter
    }
}

export function lastLeaf(iter: BooqNodeIterator): BooqNodeIterator {
    const node = iteratorsNode(iter)
    if (node.kind === 'element' && node.children?.length) {
        return lastLeaf({
            parent: iter,
            nodes: node.children,
            index: node.children.length - 1,
        })
    } else {
        return iter
    }
}

export function findPath(iter: BooqNodeIterator, path: BooqPath): BooqNodeIterator | undefined {
    const [head, ...tail] = path
    if (head === undefined || head >= iter.nodes.length) {
        return undefined
    }
    const curr = { ...iter, index: head }
    if (!tail?.length) {
        return curr
    } else {
        const node = iteratorsNode(curr)
        // If path is within text node, return current iterator
        if (node.kind === 'text' && tail.length === 1) {
            return curr
        }
        if (node.kind !== 'element' || !node?.children?.length) {
            return undefined
        }
        const childrenIter = {
            parent: curr,
            index: 0,
            nodes: node.children,
        }
        return findPath(childrenIter, tail)
    }
}

export function nextSibling(iter: BooqNodeIterator) {
    return iter.index < iter.nodes.length - 1
        ? { ...iter, index: iter.index + 1 }
        : undefined
}

export function prevSibling(iter: BooqNodeIterator) {
    return iter.index > 0
        ? { ...iter, index: iter.index - 1 }
        : undefined
}

export function nextNode(iter: BooqNodeIterator): BooqNodeIterator | undefined {
    const sibling = nextSibling(iter)
    if (sibling) {
        return sibling
    } else if (iter.parent) {
        return nextNode(iter.parent)
    } else {
        return undefined
    }
}

export function prevNode(iter: BooqNodeIterator): BooqNodeIterator | undefined {
    const sibling = prevSibling(iter)
    if (sibling) {
        return sibling
    } else if (iter.parent) {
        return prevNode(iter.parent)
    } else {
        return undefined
    }
}

export function nextLeaf(iter: BooqNodeIterator): BooqNodeIterator | undefined {
    const node = nextNode(iter)
    return node && firstLeaf(node)
}

export function prevLeaf(iter: BooqNodeIterator): BooqNodeIterator | undefined {
    const node = prevNode(iter)
    return node && lastLeaf(node)
}
