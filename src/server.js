// File: server.js
import express from 'express';
import 'dotenv/config';
import {
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
} from './app.js';

const PORT = process.env.PORT || 5000;

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Root route for health check
// --------------------
app.get('/', (req, res) => {
  res.send('✅ GDrive backend is running!');
});

// --------------------
// API Routes
// --------------------
app.use('/api/auth', authRoutes);           // login/signup/logout
app.use('/api/protected', protectedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/folders-veo', folderRoutesVEO);
app.use('/api/search', searchRoutes);
app.use('/api/user', userRoutes);

// --------------------
// 404 Handler
// --------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --------------------
// Global Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT} or on Render`);
});
