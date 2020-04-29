export function config() {
    return {
        jwtSecret: process.env.AUTH_SECRET ?? 'fake secret',
    };
}
