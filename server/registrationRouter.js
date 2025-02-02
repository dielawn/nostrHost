import express from 'express';
import { verifySignature } from '../utils/nostrUtils.js';
import { ValidationError, DuplicateEmailError, InvalidSignatureError, RegistrationError } from '../utils/errors.js';
import { dbManager } from './server.js';

const router = express.Router();


router.post('/register', async (req, res, next) => {
    console.log('Registration request received');
    const { signedEvent, formData } = req.body;

    try {
        // Validate required fields
        if (!signedEvent || !formData) {
            throw new ValidationError('Missing required registration data');
        }

        if (!formData.email || !formData.publicKey || !formData.package) {
            throw new ValidationError('Missing required fields in form data');
        }

        // Initialize database if not already initialized
        await dbManager.init();

        // Check if email already exists
        const existingCustomers = await dbManager.db.list(dbManager.db.collections.customers);
        const emailExists = existingCustomers.some(customer => customer.email === formData.email);
        
        if (emailExists) {
            throw new DuplicateEmailError();
        }

        // Verify the Nostr signature
        const isValid = await verifySignature(signedEvent);
        if (!isValid) {
            throw new InvalidSignatureError('Invalid Nostr signature');
        }

        // Verify that the pubkey matches
        if (signedEvent.pubkey !== formData.publicKey) {
            throw new ValidationError('Public key mismatch');
        }

        // Create customer record
        const customer = await dbManager.createCustomer({
            email: formData.email,
            publicKey: formData.publicKey,
            planId: formData.package,
            status: 'ACTIVE'
        });

        return res.status(200).json({
            status: 'success',
            data: {
                message: 'Registration successful',
                customerId: customer.id
            }
        });

    } catch (error) {
        // If it's not one of our custom errors, wrap it in a RegistrationError
        if (!error.statusCode) {
            next(new RegistrationError(error.message));
            return;
        }
        next(error);
    }
});

export default router;