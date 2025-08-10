import express from 'express';
import { authenticateUser } from '../middlewares/auth.js';
import checkFolderPermission from '../middlewares/folderPermissionCheck.js';
import { renameFolder, moveFolderToTrash, deleteFolder } from '../controllers/folderController.js';

const router = express.Router();

// Rename folder
router.put('/rename/:id', authenticateUser, checkFolderPermission('edit'), renameFolder);

// Move folder to trash
router.put('/trash/:id', authenticateUser, checkFolderPermission('edit'), moveFolderToTrash);

// Delete folder permanently
router.delete('/delete/:id', authenticateUser, checkFolderPermission('owner'), deleteFolder);

export default router;
