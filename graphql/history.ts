import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { booqForId, libraryCardForId } from '@/backend/library'
import { positionForPath, previewForPath } from '@/core'
import { DbReadingHistoryEvent } from '@/backend/history'

export type BooqHistoryParent = DbReadingHistoryEvent
export const booqHistoryResolver: IResolvers<BooqHistoryParent> = {
    BooqHistory: {
        async booq(parent): Promise<BooqParent | undefined> {
            return libraryCardForId(parent.booqId)
        },
        async preview(parent, { length }) {
            const booq = await booqForId(parent.booqId)
            if (!booq) {
                return undefined
            }
            const preview = previewForPath(booq.nodes, parent.path, length)
            return preview?.trim()?.substring(0, length)
        },
        async position(parent) {
            const booq = await booqForId(parent.booqId)
            if (!booq) {
                return undefined
            }
            const position = positionForPath(booq.nodes, parent.path)
            return position
        },
    },
}
