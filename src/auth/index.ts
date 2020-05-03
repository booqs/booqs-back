import { fetchFbUser } from './facebook';
import { forFacebook, forId } from '../data';
import { generateToken, userIdFromHeader } from './token';

export type AuthInput = {
    provider: 'facebook',
    token: string,
};
export async function getAuthToken(input: AuthInput) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token);
            const user = fb && await forFacebook(fb);
            const token = user && generateToken(user._id);
            return token;
        }
        default:
            return undefined;
    }
}

export async function fromHeader(header: string) {
    const userId = userIdFromHeader(header);
    return userId
        ? forId(userId)
        : undefined;
}
