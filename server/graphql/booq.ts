import { IResolvers } from 'apollo-server';
import { previewForPath, filterUndefined } from '../../core';
import { booqForId } from '../books';
import { userBookmarks, userHighlights } from '../users';
import { LibraryCard } from '../sources';
import { booqImageUrl } from '../images';
import { buildNodesConnection } from './nodesConnection';

export type BooqParent = LibraryCard;
export const booqResolver: IResolvers<BooqParent> = {
    Booq: {
        cover(parent, { size }) {
            return parent.cover
                ? booqImageUrl(parent.id, parent.cover, size)
                : undefined;
        },
        tags(parent) {
            return buildTags(parent);
        },
        async bookmarks(parent, _, { user }) {
            return user
                ? userBookmarks(user, parent.id)
                : [];
        },
        async highlights(parent, _, { user }) {
            return user
                ? userHighlights(user, parent.id)
                : [];
        },
        async preview(parent, { path, length }) {
            const booq = await booqForId(parent.id);
            if (!booq) {
                return undefined;
            }
            const preview = previewForPath(booq.nodes, path, length);
            return preview?.trim()?.substr(0, length);
        },
        nodesConnection(parent, { all, before, after }) {
            return buildNodesConnection({
                card: parent,
                all, before, after,
            });
        },
    },
};

type Tag = {
    tag: string,
    value?: string,
};
function buildTags(card: BooqParent): Tag[] {
    return filterUndefined([
        {
            tag: 'pages',
            value: Math.floor(card.length / 1500).toString(),
        },
        ...(card.subjects ?? []).map(s => ({
            tag: 'subject',
            value: s,
        })),
        card.language === undefined ? undefined :
            {
                tag: 'language',
                value: card.language,
            },
        !card.id.startsWith('pg/') ? undefined :
            {
                tag: 'pg-index',
                value: card.id.substr('pg/'.length),
            },
    ]);
}
