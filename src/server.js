import app from './app.js';
import 'dotenv/config';

import uploadRoutes from './routes/upload.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';

const PORT = process.env.PORT || 5000;

// Routes
app.use('/api', uploadRoutes);
app.use('/api', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/user', userRoutes);

// Start the server (works for Render)
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
