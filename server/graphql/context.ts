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
    domain?: string,
}
type RequestContext = {
    getCookie(name: string): string | undefined,
    setCookie(name: string, value: string, options?: CookieOptions): void,
    clearCookie(name: string, options?: CookieOptions): void,
};
export async function context(ctx: RequestContext): Promise<ResolverContext> {
    const cookie = ctx.getCookie('token') ?? ''
    const user = await fromCookie(cookie) ?? undefined
    console.log('user', user)
    console.log('cookie', cookie)

    return {
        user,
        setAuthToken(token) {
            if (token) {
                ctx.setCookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    maxAge: 3600 * 24 * 7,
                    domain: 'booqs.app',
                })
                ctx.setCookie('signed', 'true', {
                    httpOnly: false,
                    maxAge: 3600 * 24 * 7,
                    domain: 'booqs.app',
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

