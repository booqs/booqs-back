import { verify, decode } from 'jsonwebtoken';
import * as createJwksClient from 'jwks-rsa';
import { config } from '../config';

export async function verifyAppleIdToken(token: string) {
    try {
        const jwt = decode(token, {
            complete: true,
            json: true,
        });
        if (jwt === null) {
            return undefined;
        }
        const { header: { kid } } = jwt;
        if (kid === undefined) {
            return undefined;
        }
        const jwk = await getApplePublicKey(kid);
        const { email, sub } = verify(token, jwk, {
            issuer: 'https://appleid.apple.com',
            audience: config().appleClientId,
        }) as any;
        return {
            email,
            userId: sub,
        };
    } catch (e) {
        console.error((`Exception while verifying apple id token: ${e}`));
        return undefined;
    }
}

const jwksClient = createJwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
});
async function getApplePublicKey(kid: string) {
    return new Promise<any>((resolve, reject) => {
        jwksClient.getSigningKey(kid, (err, key) => {
            if (err) {
                reject(err);
            } else {
                resolve(key.getPublicKey());
            }
        });
    });
}

