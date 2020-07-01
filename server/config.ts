export function config() {
    return {
        jwtSecret: process.env.BOOQS_AUTH_SECRET ?? 'fake secret',
        awsAccessKeyId: process.env.BOOQS_AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.BOOQS_AWS_SECRET_ACCESS_KEY,
        mongodbUri: process.env.BOOQS_BACKEND_MONGODB_URI,
        appleClientId: 'app.booqs.back',
        https: process.env.NODE_ENV !== 'development',
    };
}
