import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(json());
app.use(cookieParser());

// Routes (only imports here, mount them in server.js)
import uploadRoutes from './routes/upload.js'; 
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import folderRoutesVEO from './routes/folderRoutesVEO.js';
import searchRoutes from './routes/searchRoutes.js';
import userRoutes from './routes/userRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import authRoutes from './routes/authRoutes.js';

export {
  app,
  uploadRoutes,
  folderRoutes,
  fileRoutes,
  storageRoutes,
  shareRoutes,
  folderRoutesVEO,
  searchRoutes,
  userRoutes,
  protectedRoutes,
  authRoutes
};
