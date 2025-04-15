import { sign, verify } from 'jsonwebtoken'
import { config } from './config'
import { afterPrefix } from './utils'

const issuer = 'booqs'
export function generateToken(userId: string) {
    return sign({ userId }, config().jwtSecret, { issuer })
}

export function userIdFromHeader(header: string) {
    const token = afterPrefix(header, 'Bearer ')
    return token
        ? userIdFromToken(token) : undefined
}

export function userIdFromToken(token: string) {
    try {
        const { userId } = verify(token, config().jwtSecret, { issuer }) as any
        return userId as string
    } catch {
        return undefined
    }
}