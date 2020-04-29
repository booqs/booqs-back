import express from 'express';
import { userIdFromHeader } from './token';
import { forId } from './accounts';

type Context = {
    req: express.Request,
};
export async function fromContext(context: Context) {
    const header = context.req.headers.authorization ?? '';
    const userId = userIdFromHeader(header);
    const user = userId
        ? await forId(userId)
        : undefined;
    return { user };
}
