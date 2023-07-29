import { StartStandaloneServerOptions } from '@apollo/server/standalone'
import { fromCookie } from '../auth'
import { DbUser } from '../users'
import { config } from '../config'
import { serialize } from 'cookie'

export type Context = {
    user?: DbUser & { _id?: string },
    setAuthToken(token: string | undefined): void,
};
type StandaloneServerContext = StartStandaloneServerOptions<{}>['context'];
export const context: StandaloneServerContext = async (context): Promise<Context> => {
    const parsed = parseCookies(context.req.headers.cookie ?? '')
    const cookie = parsed.token ?? ''
    const user = await fromCookie(cookie) ?? undefined

    return {
        user,
        setAuthToken(token) {
            if (token) {
                context.res.setHeader('Set-Cookie', serialize('token', token, {
                    httpOnly: true,
                    secure: config().https ? true : false,
                }))
                context.res.setHeader('Set-Cookie', serialize('signed', 'true', {
                    httpOnly: false,
                }))
            } else {
                context.res.setHeader('Set-Cookie', serialize('token', '', {
                    httpOnly: true,
                    maxAge: 0,
                }))
                context.res.setHeader('Set-Cookie', serialize('signed', '', {
                    httpOnly: true,
                    maxAge: 0,
                }))
            }
        },
    }
}

function parseCookies(cookie: string) {
    const pairs = cookie.split('; ')
    const result = pairs.reduce<{ [key: string]: string | undefined }>(
        (res, pair) => {
            const [name, value] = pair.split('=')
            res[name] = value
            return res
        },
        {},
    )
    return result
}

