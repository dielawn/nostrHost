import express from 'express';
import { dbManager } from './server.js';
import { verifySignature } from '../utils/nostrUtils.js';

const router = express.Router();

// Checks database for existing user
router.post('/verify', async (req, res) => {
    const { publicKey } = req.body;
    try {
        await dbManager.init();
        const customer = await dbManager.getCustomerByPublicKey(publicKey);
        
        if (customer) {
            return res.status(200).json({
                authenticated: true,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    status: customer.status,
                    planId: customer.planId
                }
            });
        }
        
        return res.status(401).json({
            authenticated: false,
            error: 'Public key not found'
        });
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            authenticated: false,
            error: 'Authentication failed'
        });
    }
});

// Store challenges temporarily (in production, use Redis or similar)
const challenges = new Map();

// Generate challenge endpoint
router.post('/challenge', async (req, res) => {
    const { publicKey } = req.body;
    const challenge = crypto.randomBytes(32).toString('hex');
    
    // Store the challenge with a timestamp (expire after 5 minutes)
    challenges.set(publicKey, {
        challenge,
        timestamp: Date.now()
    });
    
    res.json({ challenge });
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { publicKey, signature, challenge } = req.body;
    
    // Verify the challenge is valid and not expired
    const storedChallenge = challenges.get(publicKey);
    if (!storedChallenge || 
        storedChallenge.challenge !== challenge ||
        Date.now() - storedChallenge.timestamp > 300000) { // 5 minutes expiry
        return res.status(401).json({ error: 'Invalid or expired challenge' });
    }
    
    try {
        // Verify the signature matches the event and public key
        const verified = await verifySignature(signature);
        if (!verified) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { publicKey },
            process.env.VITE_JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Remove used challenge
        challenges.delete(publicKey);
        
        res.json({ token });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router