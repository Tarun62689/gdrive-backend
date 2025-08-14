import express from 'express';
import multer from 'multer';
import { 
  uploadFile, 
  renameItem, 
  moveToTrash, 
  deleteItem, 
  getUserData 
} from '../controllers/fileController.js';
import { authenticateUser } from '../middlewares/auth.js'; 
import checkFilePermission from '../middlewares/permissionCheck.js';
import checkFolderPermission from '../middlewares/folderPermissionCheck.js';

// OPTIONAL: import folder-specific handlers if you have them
// import { renameFolder, moveFolderToTrash, deleteFolder } from '../controllers/folderController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --------------------
// File Routes
// --------------------

// Upload file
router.post('/upload', authenticateUser, upload.single('file'), uploadFile);

// Rename file
router.put('/rename/:id', authenticateUser, checkFilePermission('edit'), renameItem);

// Move file to trash
router.put('/trash/:id', authenticateUser, checkFilePermission('edit'), moveToTrash);

// Delete file permanently
router.delete('/delete/:id', authenticateUser, checkFilePermission('owner'), deleteItem);

// --------------------
// Folder Routes (if using same controller methods)
// --------------------
// These use `renameItem` etc. but with `type: 'folder'` in body
// Or replace with folder-specific controller if available

router.put('/folder/rename/:id', authenticateUser, checkFolderPermission('edit'), (req, res, next) => {
  req.body.type = 'folder';
  renameItem(req, res, next);
});

router.put('/folder/trash/:id', authenticateUser, checkFolderPermission('edit'), (req, res, next) => {
  req.body.type = 'folder';
  moveToTrash(req, res, next);
});

router.delete('/folder/delete/:id', authenticateUser, checkFolderPermission('owner'), (req, res, next) => {
  req.body.type = 'folder';
  deleteItem(req, res, next);
});

// --------------------
// Get All User Data
// --------------------


export default router;
