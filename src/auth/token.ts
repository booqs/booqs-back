import { sign, verify } from 'jsonwebtoken';
import { config } from '../config';
import { afterPrefix } from '../utils';

const issuer = 'booqs';
const secret = config().jwtSecret;
export function generateToken(userId: string) {
    return sign(userId, secret, { issuer });
}

export function userIdFromHeader(header: string) {
    const token = afterPrefix(header, 'Bearer ');
    return token
        ? userIdFromToken(token) : undefined;
}

export function userIdFromToken(token: string) {
    const userId = verify(token, secret, { issuer });
    return typeof userId === 'string'
        ? userId : undefined;
}