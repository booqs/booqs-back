import {
    BooqNode, TableOfContentsItem, TableOfContents, findPathForId, nodesLength, positionForPath,
} from '../core';
import { EpubFile } from './epubFile';
import { Diagnostic, Result } from './result';
import { transformHref } from './parserUtils';

export async function buildToc(nodes: BooqNode[], file: EpubFile): Promise<Result<TableOfContents>> {
    const diags: Diagnostic[] = [];
    const items: TableOfContentsItem[] = [];
    for (const epubTocItem of file.toc()) {
        if (epubTocItem.href) {
            const targetId = transformHref(epubTocItem.href).substr(1);
            const path = findPathForId(nodes, targetId);
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

