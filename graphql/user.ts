import { DbUser } from '@/backend/users'
import { IResolvers } from '@graphql-tools/utils'

export type UserParent = DbUser
export const userResolver: IResolvers<UserParent> = {
    User: {
        joined(parent) {
            return parent.joined_at
        },
        pictureUrl(parent) {
            return parent.profile_picture_url
        },
    },
}
