import { IResolvers } from '@graphql-tools/utils'
import { textForRange, positionForPath } from '../../core'
import { DbHighlight } from '../highlights'
import { forId, booqForId } from '../books'
import { BooqParent } from './booq'
import { DbUser, users } from '../users'

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async author(parent): Promise<DbUser | null> {
            return users.forId(parent.userId)
        },
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId)
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
