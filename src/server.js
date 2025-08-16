import app from './app.js';
import 'dotenv/config';

import uploadRoutes from './routes/upload.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js'; // ⬅️ import your auth routes

const PORT = process.env.PORT || 5000;

// Routes
app.use('/api', uploadRoutes);
app.use('/api', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes); // ⬅️ mount under /api/auth

// Start the server (works for Render)
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
