import { BooqNode } from '../core';

export function markParagraphs(nodes: BooqNode[]): BooqNode[] {
    return nodes.map(markParagraphNode);
}

function markParagraphNode(node: BooqNode): BooqNode {
    if (node.kind !== 'element') {
        return node;
    } else if (isParagraph(node)) {
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
    if (node.kind !== 'element') {
        return false;
    }
    switch (node.name) {
        case 'div': case 'p':
            return !hasChildParagraphs(node);
        default:
            return false;
    }
}

function hasChildParagraphs(node: BooqNode): boolean {
    return node.kind === 'element' && node.children !== undefined && node.children.some(
        ch => isParagraph(ch) || hasChildParagraphs(ch),
    );
}