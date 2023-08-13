import { users } from '../users'
import { fetchFbUser } from './facebook'
import { generateToken, userIdFromHeader, userIdFromToken } from './token'
import { verifyAppleIdToken } from './apple'

export type AuthInput = {
    provider: string,
    token: string,
    name?: string,
};
export async function authWithToken(input: AuthInput) {
    const user = await getUser(input)
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

async function getUser(input: AuthInput) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token)
            return fb && users.forFacebook(fb)
        }
        case 'apple': {
            const userInfo = await verifyAppleIdToken(input.token)
            if (userInfo) {
                return users.forApple({
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
        : undefined
}
