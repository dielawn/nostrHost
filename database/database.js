// database.js
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const Status = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED'
};

// Base model class with common functionality
class BaseModel {
    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    update() {
        this.updatedAt = new Date();
    }
}

class FileDatabase {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.collections = {
            customers: 'customers',
            cPanelAccounts: 'cpanel-accounts',
            plans: 'plans',
            payments: 'payments'
        };
    }

    async init() {
        try {
            await fs.mkdir(this.dbPath, { recursive: true });
            for (const collection of Object.values(this.collections)) {
                const collectionPath = path.join(this.dbPath, collection);
                await fs.mkdir(collectionPath, { recursive: true });
            }
        } catch (error) {
            throw new Error(`Failed to initialize database: ${error.message}`);
        }
    }

    async save(collection, id, data) {
        const filePath = this._getFilePath(collection, id);
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            throw new Error(`Failed to save data: ${error.message}`);
        }
    }

    async load(collection, id) {
        const filePath = this._getFilePath(collection, id);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }

    async delete(collection, id) {
        const filePath = this._getFilePath(collection, id);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw new Error(`Failed to delete data: ${error.message}`);
            }
        }
    }

    async list(collection) {
        const collectionPath = path.join(this.dbPath, collection);
        try {
            const files = await fs.readdir(collectionPath);
            const items = await Promise.all(
                files.map(async (file) => {
                    const data = await this.load(collection, path.parse(file).name);
                    return data;
                })
            );
            return items.filter(item => item !== null);
        } catch (error) {
            throw new Error(`Failed to list collection: ${error.message}`);
        }
    }

    _getFilePath(collection, id) {
        return path.join(this.dbPath, collection, `${id}.json`);
    }
}

class PersistentDatabaseManager {
    constructor(dbPath) {
        this.db = new FileDatabase(dbPath);
    }

    async init() {
        await this.db.init();
    }

    async createCustomer(customerData) {
        const customers = await this.db.list(this.db.collections.customers);
        
        if (customerData.email) {
            const emailExists = customers.some(c => c.email === customerData.email);
            if (emailExists) {
                throw new Error('Email already exists');
            }
        }

        const publicKeyExists = customers.some(c => c.publicKey === customerData.publicKey);
        if (publicKeyExists) {
            throw new Error('Public key already exists');
        }

        const customer = {
            ...new BaseModel(),
            id: crypto.randomUUID(),
            ...customerData
        };

        await this.db.save(this.db.collections.customers, customer.id, customer);
        return customer;
    }

    async getCustomerByPublicKey(publicKey) {
        try {
            const customers = await this.db.list(this.db.collections.customers);
            return customers.find(customer => customer.publicKey === publicKey) || null;
        } catch (error) {
            console.error('Error finding customer by public key:', error);
            return null;
        }
    }

    async getCustomer(id) {
        const customer = await this.db.load(this.db.collections.customers, id);
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }

    async updateCustomer(id, updateData) {
        const customer = await this.getCustomer(id);
        const updatedCustomer = {
            ...customer,
            ...updateData,
            updatedAt: new Date()
        };
        await this.db.save(this.db.collections.customers, id, updatedCustomer);
        return updatedCustomer;
    }

    async createCPanelAccount(accountData) {
        const accounts = await this.db.list(this.db.collections.cPanelAccounts);
        
        const usernameExists = accounts.some(a => a.username === accountData.username);
        if (usernameExists) {
            throw new Error('Username already exists');
        }

        await this.getCustomer(accountData.customerId);

        const account = {
            ...new BaseModel(),
            id: crypto.randomUUID(),
            status: Status.ACTIVE,
            ...accountData
        };

        await this.db.save(this.db.collections.cPanelAccounts, account.id, account);
        return account;
    }

    async getCPanelAccount(id) {
        const account = await this.db.load(this.db.collections.cPanelAccounts, id);
        if (!account) {
            throw new Error('CPanelAccount not found');
        }
        return account;
    }

    async getCustomerCPanelAccounts(customerId) {
        const accounts = await this.db.list(this.db.collections.cPanelAccounts);
        return accounts.filter(account => account.customerId === customerId);
    }

    async getAllCustomerData() {
        const customers = await this.db.list(this.db.collections.customers)
        return customers
    }

    async updateCPanelAccount(id, updateData) {
        const account = await this.getCPanelAccount(id);
        const updatedAccount = {
            ...account,
            ...updateData,
            updatedAt: new Date()
        };
        await this.db.save(this.db.collections.cPanelAccounts, id, updatedAccount);
        return updatedAccount;
    }
}

// Example usage function
async function example() {
    const dbManager = new PersistentDatabaseManager('./db');
    
    try {
        await dbManager.init();

        const customer = await dbManager.createCustomer({
            email: 'user@example.com',
            publicKey: 'key123',
            planId: 'plan1'
        });
        console.log('Created customer:', customer);

        const cPanelAccount = await dbManager.createCPanelAccount({
            username: 'user1',
            domain: 'example.com',
            customerId: customer.id,
            resourceUsage: {
                diskUsage: 1000,
                bandwidth: 5000
            }
        });
        console.log('Created cPanel account:', cPanelAccount);

        const accounts = await dbManager.getCustomerCPanelAccounts(customer.id);
        console.log('Customer cPanel accounts:', accounts);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the example
// example();

// Export for use in other files
export { PersistentDatabaseManager, Status };