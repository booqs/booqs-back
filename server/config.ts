export type Config = ReturnType<typeof config>
export function config() {
    const mode = process.env.NODE_ENV ?? 'production'
    return {
        jwtSecret: process.env.BOOQS_AUTH_SECRET ?? 'fake secret',
        mongodbUri: process.env.MONGODB_URI,
        appleClientId: 'app.booqs.back',
        mode,
        https: mode !== 'development',
        domain: process.env.APP_DOMAIN ?? 'localhost',
        appName: process.env.BOOQS_NAME ?? 'Booqs',
    }
}
