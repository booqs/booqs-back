import { users } from '../users';
import { fetchFbUser } from './facebook';
import { generateToken, userIdFromHeader, userIdFromToken } from './token';

export type AuthInput = {
    provider: 'facebook',
    token: string,
};
export async function authWithToken(input: AuthInput) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token);
            const user = fb && await users.forFacebook(fb);
            if (user) {
                const token = generateToken(user._id);
                return {
                    token,
                    user,
                };
            } else {
                return undefined;
            }
        }
        default:
            return undefined;
    }
}

export async function fromHeader(header: string) {
    const userId = userIdFromHeader(header);
    return userId
        ? users.forId(userId)
        : undefined;
}

export async function fromCookie(cookie: string) {
    const userId = userIdFromToken(cookie);
    return userId
        ? users.forId(userId)
        : undefined;
}
