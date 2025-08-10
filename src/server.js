import app from './app.js';
import 'dotenv/config';
import uploadRoutes from './routes/upload.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

// Routes
app.use('/api', uploadRoutes);
app.use('/api', folderRoutes);
app.use('/api/files', fileRoutes);

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
  });
}

export default app;
