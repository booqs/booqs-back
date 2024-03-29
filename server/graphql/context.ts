import { fromCookie } from '../auth'
import { DbUser } from '../users'

export type ResolverContext = {
    user?: DbUser & { _id?: string },
    setAuthToken(token: string | undefined): void,
};
type CookieOptions = {
    httpOnly?: boolean,
    secure?: boolean,
    maxAge?: number,
}
type RequestContext = {
    getCookie(name: string): string | undefined,
    setCookie(name: string, value: string, options?: CookieOptions): void,
    clearCookie(name: string, options?: CookieOptions): void,
};
export async function context(ctx: RequestContext): Promise<ResolverContext> {
    const cookie = ctx.getCookie('token') ?? ''
    const user = await fromCookie(cookie) ?? undefined

    return {
        user,
        setAuthToken(token) {
            if (token) {
                ctx.setCookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    maxAge: 60 * 60 * 24 * 30,
                })
                ctx.setCookie('signed', 'true', {
                    httpOnly: false,
                    maxAge: 60 * 60 * 24 * 30,
                })
            } else {
                ctx.clearCookie('token', {
                    httpOnly: true,
                })
                ctx.clearCookie('signed', {
                    httpOnly: false,
                })
            }
        },
    }
}

