import { DbUser, users } from '../users'
import { fetchFbUser } from './facebook'
import { generateToken, userIdFromHeader, userIdFromToken } from './token'
import { verifyAppleIdToken } from './apple'

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

async function getUserForSocialAuth(input: SocialAuthData) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token)
            if (fb) {
                const { user } = await users.getOrCreateForFacebookUser(fb)
                return user
            }
            return undefined
        }
        case 'apple': {
            const userInfo = await verifyAppleIdToken(input.token)
            if (userInfo) {
                const { user } = await users.getOrCreateForAppleUser({
                    id: userInfo.userId,
                    name: input.name ?? userInfo.email,
                    email: userInfo.email,
                })
                return user
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
