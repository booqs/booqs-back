import axios from 'axios';
import { UserInfo } from '../data';

export async function fetchFbUser(token: string): Promise<UserInfo | undefined> {
    const url = `https://graph.facebook.com/me?fields=name,picture
    &access_token=${token}`;

    try {
        const response = await axios.get(url);
        const { id, name, picture } = response.data;
        if (id && name) {
            return {
                id, name,
                profilePicture: picture?.data?.url,
            };
        } else {
            return undefined;
        }
    } catch (e) {
        console.error((`Failed to fetch fb user: ${e}`));
        return undefined;
    }
}
