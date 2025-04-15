export type Config = ReturnType<typeof config>
// TODO: ensure consistent access to config/process.env
// TODO: mode should be its own variable
export function config() {
    const mode = process.env.NODE_ENV ?? 'production'
    const protocol = mode === 'development' ? 'http' : 'https'
    const url = process.env.NEXT_PUBLIC_URL ?? 'https://booqs.app'
    const domain = url.substring(url.indexOf('://') + '://'.length)
    const origins = {
        production: `https://${domain}`,
        localhost: 'http://localhost:3000',
        secureLocalhost: 'https://localhost:3000',
        undefined: undefined,
    }
    return {
        jwtSecret: process.env.BOOQS_AUTH_SECRET ?? 'fake secret',
        mongodbUri: process.env.MONGODB_URI,
        appleClientId: 'app.booqs.back',
        mode,
        protocol,
        origins,
        domain,
        appName: process.env.BOOQS_NAME ?? 'Booqs',
    }
}
