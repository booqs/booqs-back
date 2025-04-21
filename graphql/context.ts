import { generateToken, userIdFromToken } from '@/backend/token'

export type ResolverContext = {
    userId?: string,
    origin?: string,
    setAuthForUserId(userId: string): void,
    clearAuth(): void,
}
type CookieOptions = {
    httpOnly?: boolean,
    secure?: boolean,
    maxAge?: number,
}
type RequestContext = {
    origin?: string,
    getCookie(name: string): string | undefined,
    setCookie(name: string, value: string, options?: CookieOptions): void,
    clearCookie(name: string, options?: CookieOptions): void,
}
export async function context(ctx: RequestContext): Promise<ResolverContext> {
    const authToken = ctx.getCookie('token') ?? ''
    const userId = userIdFromToken(authToken)

    return {
        userId,
        origin: ctx.origin,
        setAuthForUserId(userId: string) {
            const token = generateToken(userId)
            ctx.setCookie('token', token, {
                httpOnly: true,
                secure: true,
                maxAge: 60 * 60 * 24 * 30,
            })
        },
        clearAuth() {
            ctx.clearCookie('token', {
                httpOnly: true,
            })
        },
    }
}

