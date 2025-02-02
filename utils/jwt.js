// jwt.js (server-side)
import jwt from 'jsonwebtoken';
import { verifySignature } from './verifyNostrSig.js';
import 'dotenv'
import { 
    TokenError, 
    InvalidSignatureError,
    ValidationError 
} from './utils/errors.js';

const JWT_SECRET = process.env.VITE_JWT_SECRET;

async function createJWToken(publicKey) {
    try {
        return jwt.sign(
            {
                sub: publicKey,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            },
            JWT_SECRET
        );
    } catch (error) {
        throw new TokenError('Failed to create token');
    }
}

async function getJWToken(req, res, next) {
    try {
        const { publicKey, signature, challenge } = req.body;

        if (!publicKey || !signature || !challenge) {
            throw new ValidationError('Missing required fields');
        }

        // verify the signature
        const isValid = await verifySignature(publicKey, signature, challenge);

        if (!isValid) {
            throw new InvalidSignatureError('Invalid Nostr signature');
        }

        // create JWT
        const token = await createJWToken(publicKey);
        
        return res.json({ 
            status: 'success',
            data: {
                token,
                publicKey
            }
        });
    } catch (error) {
        next(error);
    }
}

function verifyJWToken(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new TokenError('No token provided');
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            throw new TokenError('Invalid or expired token');
        }
    } catch (error) {
        next(error);
    }
}

export {
    getJWToken,
    createJWToken,
    verifyJWToken
};