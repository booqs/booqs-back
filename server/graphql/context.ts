import { fromCookie } from '../auth';
import { DbUser } from '../users';

type CookieOptions = {
    httpOnly?: boolean,
    domain?: string,
    secure?: boolean,
    maxAge?: number,
};
type ExpressContext = {
    req: {
        headers: {
            authorization?: string,
            cookie?: string,
        },
    },
    res: {
        cookie(name: string, val: string, options?: CookieOptions): void,
        clearCookie(name: string, options?: any): void,
    },
};
export type Context = {
    user?: DbUser & { _id: string },
    setAuthToken(token: string | undefined): void,
};
export async function context(context: ExpressContext): Promise<Context> {
    const parsed = parseCookies(context.req.headers.cookie ?? '');
    const cookie = parsed.token ?? '';
    const user = await fromCookie(cookie) ?? undefined;
    console.log(context.req.headers);
    console.log(cookie ? 'cookie set' : 'cookie is not set');
    console.log(user);

    return {
        user,
        setAuthToken(token) {
            if (token) {
                context.res.cookie('token', token, {
                    httpOnly: true,
                    // TODO: set 'domain' property
                });
                context.res.cookie('signed', 'true', {});
            } else {
                context.res.clearCookie('token');
                context.res.clearCookie('signed');
            }
        },
    };
}

function parseCookies(cookie: string) {
    const pairs = cookie.split('; ');
    const result = pairs.reduce<{ [key: string]: string | undefined }>(
        (res, pair) => {
            const [name, value] = pair.split('=');
            res[name] = value;
            return res;
        },
        {},
    );
    return result;
}

