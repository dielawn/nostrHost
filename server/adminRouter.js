import express from 'express';
import { dbManager } from './server.js';

const router = express.Router();

// Get all customers
router.get('/customers', async (req, res) => {
    try {
        const customers = await dbManager.getAllCustomerData();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete customer
router.delete('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbManager.delete('customers', id);
        res.json({ message: 'Successfully deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer
router.put('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        await dbManager.updateCustomer(id, updatedData);
        res.json({ message: 'Successfully updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;