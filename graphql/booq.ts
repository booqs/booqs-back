import { IResolvers } from '@graphql-tools/utils'
import { BookmarkParent } from './bookmark'
import { HighlightParent } from './highlight'
import { booqForId, LibraryCard } from '@/backend/library'
import { booqImageUrl } from '@/backend/images'
import { userBookmarks } from '@/backend/users'
import { highlightsForBooqId } from '@/backend/highlights'
import { buildFragment, filterUndefined, previewForPath, textForRange } from '@/core'

export type BooqParent = LibraryCard & {
    kind?: undefined,
}
export const booqResolver: IResolvers<BooqParent> = {
    Booq: {
        cover(parent, { size }) {
            return parent.cover
                ? booqImageUrl(parent.id, parent.cover, size)
                : undefined
        },
        tags(parent) {
            return buildTags(parent)
        },
        async bookmarks(parent, _, { user }): Promise<BookmarkParent[]> {
            return user
                ? userBookmarks(user, parent.id)
                : []
        },
        async highlights(parent): Promise<HighlightParent[]> {
            return highlightsForBooqId(parent.id)
        },
        async preview(parent, { path, end, length }) {
            const booq = await booqForId(parent.id)
            if (!booq) {
                return undefined
            }
            if (end) {
                const preview = textForRange(booq.nodes, { start: path ?? [], end })?.trim()
                return length
                    ? preview?.substring(0, length)
                    : preview
            } else {
                const preview = previewForPath(booq.nodes, path ?? [], length)
                return preview?.trim()?.substring(0, length)
            }
        },
        async nodes(parent) {
            const booq = await booqForId(parent.id)
            return booq
                ? booq.nodes
                : undefined
        },
        async fragment(parent, { path }) {
            const booq = await booqForId(parent.id)
            if (!booq) {
                return undefined
            }
            return buildFragment({
                booq,
                path,
            })
        },
        async tableOfContents(parent) {
            const booq = await booqForId(parent.id)
            return booq
                ? booq.toc.items
                : undefined
        },
    },
}

type Tag = {
    tag: string,
    value?: string,
}
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
                value: card.id.substring('pg/'.length),
            },
    ])
}
