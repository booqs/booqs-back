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
        },
        cookies?: {
            token?: string,
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
    const cookie = context.req.cookies?.token ?? '';
    const user = await fromCookie(cookie) ?? undefined;

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

