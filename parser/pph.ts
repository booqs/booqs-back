import { BooqNode } from '../core';

export function markParagraphs(nodes: BooqNode[]): BooqNode[] {
    return nodes.map(markParagraphNode);
}

function markParagraphNode(node: BooqNode): BooqNode {
    if (isParagraph(node)) {
        return {
            ...node,
            pph: true,
        };
    } else if (node.children?.length) {
        return {
            ...node,
            children: markParagraphs(node.children),
        };
    } else {
        return node;
    }
}

function isParagraph(node: BooqNode) {
    switch (node.name) {
        case 'div': case 'p':
            return !node.children?.some(isParagraph);
        case 'span':
            return !node.children?.some(isNonEmptyText);
        default:
            return false;
    }
}

function isNonEmptyText(node: BooqNode): boolean {
    return node.name === undefined && node.content
        ? (node.content.match(/^\s*$/) ? false : true)
        : false;
}