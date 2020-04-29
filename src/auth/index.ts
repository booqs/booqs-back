import { fetchFbUser } from './facebook';
import { forFacebook } from './accounts';
import { generateToken } from './token';

export type AuthInput = {
    provider: 'facebook',
    token: string,
};
export async function getAuthToken(input: AuthInput) {
    switch (input.provider) {
        case 'facebook': {
            const fb = await fetchFbUser(input.token);
            const account = fb && await forFacebook(fb);
            const token = account && generateToken(account._id);
            return token;
        }
        default:
            return undefined;
    }
}
