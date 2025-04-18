import { DbUser, users } from '../users'
import { fetchFbUser } from './facebook'
import { generateToken, userIdFromHeader, userIdFromToken } from './token'
import { verifyAppleIdToken } from './apple'

export {
    initiatePasskeyRegistration, verifyPasskeyRegistration,
    initiatePasskeyLogin, verifyPasskeyLogin,
} from './passkey'
export { generateToken } from './token'

export type SocialAuthData = {
    provider: string,
    token: string,
    name?: string,
}
export type AuthResult = {
    token: string,
    user: DbUser,
}
export async function getAuthResultForSocialAuth(input: SocialAuthData) {
    const user = await getUserForSocialAuth(input)
    if (user) {
        const token = generateToken(user._id)
        return {
            token,
            user,
        }
    } else {
        return undefined
    }
}

export async function getAuthResultForUserId(userId: string) {
    const user = await users.forId(userId)
    if (user) {
        const token = generateToken(user._id)
        return {
            token,
            user,
        }
    }
    return undefined
}

async function getUserForSocialAuth(input: SocialAuthData) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token)
            if (fb) {
                return await users.updateOrCreateForFacebookUser(fb)
            }
            return undefined
        }
        case 'apple': {
            const userInfo = await verifyAppleIdToken(input.token)
            if (userInfo) {
                return users.updateOrCreateForAppleUser({
                    id: userInfo.userId,
                    name: input.name ?? userInfo.email,
                    email: userInfo.email,
                })
            }
            return undefined
        }
        default:
            return undefined
    }
}

export async function fromHeader(header: string) {
    const userId = userIdFromHeader(header)
    return userId
        ? users.forId(userId)
        : undefined
}

export async function fromCookie(cookie: string) {
    const userId = userIdFromToken(cookie)
    return userId
        ? users.forId(userId)
        : null
}
