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
            return userForId(parent.user_id)
        },
        async booq(parent): Promise<BooqParent | undefined> {
            return libraryCardForId(parent.booq_id)
        },
        async text(parent) {
            const booq = await booqForId(parent.booq_id)
            if (booq) {
                const text = textForRange(booq.nodes, {
                    start: parent.start_path,
                    end: parent.end_path,
                })
                return text ?? '<no-text>'
            }
            return '<no-booq>'
        },
        async position(parent) {
            const booq = await booqForId(parent.booq_id)
            if (!booq) {
                return undefined
            }
            const position = positionForPath(booq.nodes, parent.start_path)
            return position
        },
        start(parent) {
            return parent.start_path
        },
        end(parent) {
            return parent.end_path
        },
    },
}
