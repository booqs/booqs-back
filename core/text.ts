import { BooqNode, BooqRange, BooqPath } from './model'
import {
    findPath, rootIterator, firstLeaf, iteratorsNode, nextLeaf, prevLeaf, BooqNodeIterator,
} from './iterator'
import { assertNever } from './misc'

export function nodeText(node: BooqNode): string {
    switch (node.kind) {
        case 'element':
            return node.children?.map(nodeText).join('') ?? ''
        case 'text':
            return node.content
        case 'stub':
            return ''
        default:
            assertNever(node)
            return ''
    }
}

export function nodesText(nodes: BooqNode[]): string {
    return nodes.map(nodeText).join('')
}

export function previewForPath(nodes: BooqNode[], path: BooqPath, length: number) {
    let iter = findPath(rootIterator(nodes), path)
    if (!iter) {
        return undefined
    }
    iter = firstLeaf(iter)
    let preview = ''
    while (iter) {
        const node = iteratorsNode(iter)
        preview += node.kind === 'text'
            ? node.content
            : ''
        if (preview.trim().length >= length) {
            return preview.trim()
        }
        iter = nextLeaf(iter)
    }
    return preview.trim()
}

export function contextForRange(nodes: BooqNode[], { start }: BooqRange, length: number) {
    // TODO: implement version that takes end into account
    return contextForPath(nodes, start, length)
}

export function contextForPath(nodes: BooqNode[], path: BooqPath, length: number) {
    const iter = findPath(rootIterator(nodes), path)
    if (!iter) {
        return undefined
    }
    let result = ''
    let forwardIter: BooqNodeIterator | undefined = firstLeaf(iter)
    let backwardIter: BooqNodeIterator | undefined = prevLeaf(iter)
    while (forwardIter || backwardIter) {
        if (forwardIter) {
            result += nodeText(iteratorsNode(forwardIter))
            if (result.length >= length) {
                return result.substring(0, length)
            }
            forwardIter = nextLeaf(forwardIter)
        }
        if (backwardIter) {
            result = nodeText(iteratorsNode(backwardIter)) + result
            if (result.length >= length) {
                return result.substring(result.length - length)
            }
            backwardIter = prevLeaf(backwardIter)
        }
    }
    return result
}


export function textForRange(nodes: BooqNode[], { start, end }: BooqRange): string | undefined {
    const [startHead, ...startTail] = start
    const [endHead, ...endTail] = end
    if (startHead === undefined || endHead === undefined || startHead >= nodes.length || endHead < startHead) {
        return undefined
    }

    let result = ''
    const startNode = nodes[startHead]
    if (startNode.kind === 'element') {
        const startText = textForRange(startNode.children ?? [], {
            start: startTail,
            end: startHead === endHead
                ? endTail
                : [startNode.children?.length ?? 1],
        })
        if (startText) {
            result += startText
        } else {
            return undefined
        }
    } else if (startNode.kind === 'text') {
        if (startTail.length <= 1) {
            result += startNode.content.substring(
                startTail[0] ?? 0,
                startHead === endHead && endTail.length > 0
                    ? endTail[0]
                    : startNode.content.length,
            )
        } else {
            return undefined
        }
    } else {
        return undefined
    }
    for (let idx = startHead + 1; idx < endHead; idx++) {
        result += nodeText(nodes[idx])
    }
    const endNode = nodes[endHead]
    if (startHead !== endHead && endNode) {
        if (endNode.kind === 'element') {
            const endText = textForRange(endNode.children ?? [], {
                start: [0],
                end: endTail,
            })
            if (endText) {
                result += endText
            }
        } else if (endNode.kind === 'text') {
            if (endTail.length === 1) {
                result += endNode.content.substring(0, endTail[0])
            }
        }
    }

    return result
}
