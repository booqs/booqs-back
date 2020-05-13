import { fromHeader } from '../auth';
import { DbUser } from '../data';

type ExpressContext = {
    req: {
        headers: {
            authorization?: string,
        },
    },
};
export type Context = {
    user?: DbUser & { _id: string },
}
export async function context(context: ExpressContext): Promise<Context> {
    const header = context.req.headers.authorization ?? '';
    const user = await fromHeader(header) ?? undefined;

    return { user };
}
