import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { PersistentDatabaseManager } from '../database/database.js';

// ROUTES
import registrationRouter from './registrationRouter.js';
import authRouter from './authRouter.js';
import adminRouter from './adminRouter.js';


const dbManager = new PersistentDatabaseManager();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configure CORS with specific origin
app.use(cors({
  origin: process.env.VITE_FRONT_END_URL || 'http://localhost:5173', // Exact origin, not wildcard
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Use routers
app.use('/', registrationRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);

const PORT = process.env.VITE_SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export {
    dbManager
}