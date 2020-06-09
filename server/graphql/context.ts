import { fromCookie } from '../auth';
import { DbUser } from '../users';

type CookieOptions = {
    httpOnly?: boolean,
    domain?: string,
    secure?: boolean,
};
type ExpressContext = {
    req: {
        headers: {
            authorization?: string,
        },
        cookies: {
            token?: string,
        },
    },
    res: {
        cookie(name: string, val: string, options?: CookieOptions): void,
    },
};
export type Context = {
    user?: DbUser & { _id: string },
    setAuthToken(token: string): void,
};
export async function context(context: ExpressContext): Promise<Context> {
    const header = context.req.cookies.token ?? '';
    const user = await fromCookie(header) ?? undefined;

    return {
        user,
        setAuthToken(token) {
            context.res.cookie('token', token, {
                httpOnly: true,
                // TODO: set 'domain' property
            });
            context.res.cookie('signed', 'true', {});
        },
    };
}

