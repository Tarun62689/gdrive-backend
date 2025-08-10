import express from 'express';
import multer from 'multer';
import { uploadFile, renameItem, moveToTrash, deleteItem } from '../controllers/fileController.js';
import { authenticateUser } from '../middlewares/auth.js'; 
import checkFilePermission from '../middlewares/permissionCheck.js';
import checkFolderPermission from '../middlewares/folderPermissionCheck.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload File - files only
router.post('/upload', authenticateUser, upload.single('file'), uploadFile);

// Rename file (with permission check)
router.put('/rename/:id', authenticateUser, checkFilePermission('edit'), renameItem);

// Move file to trash (with permission check)
router.put('/trash/:id', authenticateUser, checkFilePermission('edit'), moveToTrash);

// Delete file permanently (with owner permission)
router.delete('/delete/:id', authenticateUser, checkFilePermission('owner'), deleteItem);

// Folder related routes should ideally be in a separate router (folderRoutes.js)
// But if you want to keep here, make sure handlers exist and paths do not clash:

// Rename folder
// You need to import these handlers or create them
// import { renameFolder, moveFolderToTrash, deleteFolder } from '../controllers/folderController.js';
// For now, I will comment these out, add once you have those functions implemented

// router.put('/folder/rename/:id', authenticateUser, checkFolderPermission('edit'), renameFolder);
// router.put('/folder/trash/:id', authenticateUser, checkFolderPermission('edit'), moveFolderToTrash);
// router.delete('/folder/delete/:id', authenticateUser, checkFolderPermission('owner'), deleteFolder);

export default router;
