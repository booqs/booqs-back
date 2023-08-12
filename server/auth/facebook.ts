export type FbUser = {
    id: string,
    name: string,
    email?: string,
    pictureUrl?: string,
}
export async function fetchFbUser(token: string): Promise<FbUser | undefined> {
    const url = `https://graph.facebook.com/me?fields=name,picture,email
    &access_token=${token}`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            console.error(`Failed to fetch fb user: ${response.statusText}`)
            return undefined
        }
        const json = await response.json()
        const { id, name, picture, email } = json ?? {}
        if (id && name) {
            return {
                id, name,
                email,
                pictureUrl: picture?.data?.url,
            }
        } else {
            return undefined
        }
    } catch (e) {
        console.error((`Failed to fetch fb user: ${e}`))
        return undefined
    }
}
