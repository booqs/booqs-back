export function config() {
    return {
        jwtSecret: process.env.BOOQS_AUTH_SECRET ?? 'fake secret',
        mongodbUri: process.env.BOOQS_BACKEND_MONGODB_URI,
        appleClientId: 'app.booqs.back',
        https: process.env.NODE_ENV !== 'development',
    }
}
