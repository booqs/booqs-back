import { IResolvers } from '@graphql-tools/utils'
import { previewForPath, positionForPath } from '../../core'
import { DbBooqHistory } from '../users'
import { forId, booqForId } from '../books'
import { BooqParent } from './booq'

export type BooqHistoryParent = DbBooqHistory;
export const booqHistoryResolver: IResolvers<BooqHistoryParent> = {
    BooqHistory: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId)
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
