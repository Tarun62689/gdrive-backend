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

// Routes
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import uploadRoutes from './routes/upload.js'; 
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import folderRoutesVEO from './routes/folderRoutesVEO.js';
import searchRoutes from './routes/searchRoutes.js';
import userRoutes from './routes/userRoutes.js';

app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', uploadRoutes); 
app.use('/api', folderRoutes); 
app.use('/api/files', fileRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api', shareRoutes);
app.use('/api/folders', folderRoutesVEO); // VEO specific folder routes
app.use('/api', searchRoutes);
app.use('/user', userRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Google Drive Clone Backend API is running');
});

export default app;
