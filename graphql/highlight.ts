import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { DbHighlight } from '@/backend/highlights'
import { DbUser, userForId } from '@/backend/users'
import { booqForId, libraryCardForId } from '@/backend/library'
import { positionForPath, textForRange } from '@/core'

export type HighlightParent = DbHighlight
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async author(parent): Promise<DbUser | null> {
            return userForId(parent.userId)
        },
        async booq(parent): Promise<BooqParent | undefined> {
            return libraryCardForId(parent.booqId)
        },
        async text(parent) {
            const booq = await booqForId(parent.booqId)
            if (booq) {
                const text = textForRange(booq.nodes, {
                    start: parent.start,
                    end: parent.end,
                })
                return text ?? '<no-text>'
            }
            return '<no-booq>'
        },
        async position(parent) {
            const booq = await booqForId(parent.booqId)
            if (!booq) {
                return undefined
            }
            const position = positionForPath(booq.nodes, parent.start)
            return position
        },
    },
}
