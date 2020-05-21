import {
    BooqNode, TableOfContentsItem, TableOfContents, BooqPath, nodesLength, positionForPath,
} from '../core';
import { EpubFile } from './epubFile';
import { Diagnostic, Result } from './result';

export async function buildToc(nodes: BooqNode[], file: EpubFile): Promise<Result<TableOfContents>> {
    const diags: Diagnostic[] = [];
    const items: TableOfContentsItem[] = [];
    for (const epubTocItem of file.toc()) {
        if (epubTocItem.href) {
            const path = findPathForHref(nodes, epubTocItem.href);
            if (path) {
                items.push({
                    title: epubTocItem.title,
                    level: epubTocItem.level ?? 0,
                    position: positionForPath(nodes, path),
                    path,
                });
            } else {
                diags.push({
                    diag: 'Unresolved toc item',
                    data: epubTocItem,
                });
            }
        }
    }
    const title = typeof file.metadata.title === 'string'
        ? file.metadata.title
        : undefined;

    return {
        value: {
            title,
            items,
            length: nodesLength(nodes), // TODO: implement
        },
        diags,
    };
}

function findPathForHref(nodes: BooqNode[], href: string): BooqPath | undefined {
    const [fileName, id] = href.split('#');
    const idx = nodes.findIndex(n => n.fileName === fileName);
    if (idx >= 0) {
        if (id) {
            const path = findPathForId(nodes[idx].children ?? [], id);
            return path && [idx, ...path];
        } else {
            return [idx];
        }
    } else {
        return undefined;
    }
}

function findPathForId(nodes: BooqNode[], targetId: string): BooqPath | undefined {
    for (let idx = 0; idx < nodes.length; idx++) {
        const { id, children } = nodes[idx];
        if (id === targetId) {
            return [idx];
        } else if (children) {
            const path = findPathForHref(children, targetId);
            if (path) {
                return [idx, ...path];
            }
        }
    }
    return undefined;
}