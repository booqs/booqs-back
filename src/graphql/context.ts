import { fromHeader } from '../auth';

type ExpressContext = {
    req: {
        headers: {
            authorization?: string,
        },
    },
};
export type Context = {
    user?: {
        _id: string,
        name: string,
        joined: Date,
        pictureUrl?: string,
    },
}
export async function context(context: ExpressContext): Promise<Context> {
    const header = context.req.headers.authorization ?? '';
    let user = await fromHeader(header);
    // TODO: remove
    if (!user) {
        user = {
            _id: '000000000000000000000000',
            name: 'Incognito',
            joined: new Date(Date.now()),
            pictureUrl: undefined,
        };
    }
    return { user };
}
