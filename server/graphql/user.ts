import { IResolvers } from '@graphql-tools/utils'
import { DbUser } from '../users'

export type UserParent = DbUser & { _id: string }
export const userResolver: IResolvers<UserParent> = {
    User: {
        id(parent) {
            return parent._id
        },
        joined(parent) {
            return parent.joined.toISOString()
        },
    },
}
