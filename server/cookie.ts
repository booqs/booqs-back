export function parseCookies(cookie: string) {
    const pairs = cookie.split('; ')
    const result = pairs.reduce<{ [key: string]: string | undefined }>(
        (res, pair) => {
            const [name, value] = pair.split('=')
            res[name] = value
            return res
        },
        {},
    )
    return result
}