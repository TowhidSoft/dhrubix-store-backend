import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { access_Key, refresh_Key } from '../../config/config';

export const GenerateTokens = (id: string, email: string, role: string) => {
    const payload = { id, email, role };

    const accessToken = jwt.sign(payload, access_Key!, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, refresh_Key!, { expiresIn: '30d' });

    return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: Secret) => {
    try {
        return jwt.verify(token, secret) as JwtPayload;
    } catch {
        return null;
    }
};
export const VerifyRefreshToken = (token: string) => {
    try {
        return jwt.verify(token, refresh_Key!) as JwtPayload;
    } catch {
        return null;
    }
};

