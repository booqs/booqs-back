import axios from 'axios';
import type { UserInfo } from '../users';

export async function fetchFbUser(token: string): Promise<UserInfo | undefined> {
    const url = `https://graph.facebook.com/me?fields=name,picture,email
    &access_token=${token}`;

    try {
        const response = await axios.get(url);
        const { id, name, picture, email } = response.data;
        if (id && name) {
            return {
                id, name,
                email,
                pictureUrl: picture?.data?.url,
            };
        } else {
            return undefined;
        }
    } catch (e) {
        console.error((`Failed to fetch fb user: ${e}`));
        return undefined;
    }
}
