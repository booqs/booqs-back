import { IResolvers } from '@graphql-tools/utils'
import { uniqueId } from '../../core'
import { users } from '../users'
import { highlights } from '../highlights'
import { ResolverContext } from './context'
import {
    getAuthResultForSocialAuth,
    getAuthResultForUserId,
    initiatePasskeyLogin, initiatePasskeyRegistration,
    verifyPasskeyLogin, verifyPasskeyRegistration,
} from '../auth'

export const mutationResolver: IResolvers<any, ResolverContext> = {
    Mutation: {
        async auth(_, { token, provider, name }, { setAuthToken }) {
            if (!token || !provider) {
                return undefined
            }
            const result = await getAuthResultForSocialAuth({
                provider, token, name,
            })
            if (result) {
                setAuthToken(result.token)
                return {
                    token: result.token,
                    user: result.user,
                }
            } else {
                return undefined
            }
        },
        signout(_, __, { setAuthToken }) {
            setAuthToken(undefined)
            return true
        },
        async deleteAccount(_, __, { user, setAuthToken }) {
            if (user?._id) {
                setAuthToken(undefined)
                let result = await users.deleteForId(user._id)
                return result
            } else {
                return false
            }
        },
        async addBookmark(_, { bookmark }, { user }) {
            if (user?._id) {
                return users.addBookmark(
                    user._id,
                    {
                        id: bookmark.id ?? uniqueId(),
                        booqId: bookmark.booqId,
                        path: bookmark.path,
                    })
            } else {
                return false
            }
        },
        async removeBookmark(_, { id }, { user }) {
            if (user?._id) {
                return users.deleteBookmark(
                    user._id,
                    { id },
                )
            } else {
                return false
            }
        },
        async addHighlight(_, { highlight }, { user }) {
            if (user?._id) {
                return highlights.add({
                    userId: user._id,
                    id: highlight.id,
                    booqId: highlight.booqId,
                    start: highlight.start,
                    end: highlight.end,
                    group: highlight.group,
                })
            } else {
                return false
            }
        },
        async removeHighlight(_, { id }, { user }) {
            if (user?._id) {
                return highlights.remove({
                    userId: user._id,
                    id: id,
                })
            } else {
                return false
            }
        },
        async updateHighlight(_, { id, group }, { user }) {
            if (user?._id) {
                return highlights.update({
                    userId: user._id,
                    id: id,
                    group,
                })
            } else {
                return false
            }
        },
        async addBooqHistory(_, { event }, { user }) {
            if (user?._id) {
                return users.addBooqHistory(
                    user._id,
                    {
                        booqId: event.booqId,
                        path: event.path,
                        source: event.source,
                        date: new Date(Date.now()),
                    })
            } else {
                return false
            }
        },
        async removeBooqHistory(_, { booqId }, { user }) {
            if (user?._id) {
                return users.deleteBooqHistory(
                    user._id,
                    { booqId },
                )
            } else {
                return false
            }
        },
        async addToCollection(_, { booqId, name }, { user }) {
            if (user?._id) {
                return users.addToCollection(
                    user._id,
                    name,
                    booqId,
                )
            } else {
                return false
            }
        },
        async removeFromCollection(_, { booqId, name }, { user }) {
            if (user?._id) {
                return users.removeFromCollection(
                    user._id,
                    name,
                    booqId,
                )
            } else {
                return false
            }
        },
        async initPasskeyRegistration(_, __, { requestOrigin }) {
            const result = await initiatePasskeyRegistration({ requestOrigin })
            if (result.success) {
                return result.options
            } else {
                return undefined
            }
        },
        async verifyPasskeyRegistration(_, { userId, response }, { requestOrigin }) {
            if (!userId || !response) {
                return undefined
            }
            const result = await verifyPasskeyRegistration({
                userId,
                response,
                requestOrigin,
            })
            if (result.success) {
                return result.credential
            } else {
                return undefined
            }
        },
        async initPasskeyLogin(_, { credentialId }, { requestOrigin }) {
            const result = await initiatePasskeyLogin({
                credentialId, requestOrigin,
            })
            if (result.success) {
                return result.options
            } else {
                return undefined
            }
        },
        async verifyPasskeyLogin(_, { response }, { requestOrigin, setAuthToken }) {
            if (response) {
                const result = await verifyPasskeyLogin({
                    response, requestOrigin,
                })
                if (result.success) {
                    // TODO: set auth token
                    const authResult = await getAuthResultForUserId(result.userId)
                    if (authResult) {
                        setAuthToken(authResult.token)
                        return {
                            token: authResult.token,
                            user: authResult.user,
                        }
                    }
                }
            }

            return undefined
        },
    },
}
