import app from './app.js';
import 'dotenv/config';
import uploadRoutes from './routes/upload.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import serverless from 'serverless-http';

const PORT = process.env.PORT || 5000;
const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

// Routes
app.use('/api', uploadRoutes);
app.use('/api', folderRoutes);
app.use('/api/files', fileRoutes);

// Local dev mode only
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Server running locally at ${baseUrl}`);
  });
}

// ✅ Export for Vercel serverless
export default serverless(app);
