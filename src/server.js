import { app,
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
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

// ✅ Centralize all route mounting
app.use('/api/auth', authRoutes);       // login/signup/logout
app.use('/api/protected', protectedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/folders-veo', folderRoutesVEO);
app.use('/api/search', searchRoutes);
app.use('/api/user', userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
