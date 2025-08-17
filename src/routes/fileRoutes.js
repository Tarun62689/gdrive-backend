// File: src/routes/fileRoutes.js
import express from 'express';
import multer from 'multer';
import { 
  uploadFile, 
  renameItem, 
  moveToTrash, 
  deleteItem 
} from '../controllers/fileController.js';
import { authenticateUser } from '../middlewares/auth.js'; 
import checkFilePermission from '../middlewares/permissionCheck.js';
import checkFolderPermission from '../middlewares/folderPermissionCheck.js';
import { supabase } from '../services/supabaseClient.js';

// Utils for transforming files
const getFileName = (path) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const getFileType = (mime_type) => {
  if (!mime_type) return 'file';
  if (mime_type.startsWith('image/')) return 'image';
  if (mime_type.startsWith('video/')) return 'video';
  if (mime_type === 'application/pdf') return 'pdf';
  return 'file';
};

const getThumbnail = (file) => {
  if (file.mime_type?.startsWith('image/')) {
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${file.path}`;
  }
  return null;
};

const transformFiles = (files) => {
  return files.map(file => ({
    id: file.id,
    name: file.name || getFileName(file.path),
    type: getFileType(file.mime_type),
    size: file.size,
    uploadedAt: file.uploaded_at,
    path: file.path,
    thumbnail: getThumbnail(file),
    folderId: file.folder_id,
    isTrashed: file.is_trashed,
  }));
};

// --------------------
// Express router setup
// --------------------
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
// Folder Routes
// --------------------

// Rename folder
router.put('/folder/rename/:id', authenticateUser, checkFolderPermission('edit'), (req, res, next) => {
  req.body.type = 'folder';
  renameItem(req, res, next);
});

// Move folder to trash
router.put('/folder/trash/:id', authenticateUser, checkFolderPermission('edit'), (req, res, next) => {
  req.body.type = 'folder';
  moveToTrash(req, res, next);
});

// Delete folder permanently
router.delete('/folder/delete/:id', authenticateUser, checkFolderPermission('owner'), (req, res, next) => {
  req.body.type = 'folder';
  deleteItem(req, res, next);
});

// --------------------
// Fetch user files and folders (Google Drive style)
// --------------------
router.get('/user-data', authenticateUser, async (req, res) => {
  try {
    // Fetch files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_trashed', false);
    if (fileError) throw fileError;

    // Fetch folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', req.userId);
    if (folderError) throw folderError;

    // Transform files
    const transformedFiles = transformFiles(files);

    // Transform folders
    const transformedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parentId: folder.parent_id || null, // nested folders
      createdAt: folder.created_at,
    }));

    // Optional: create nested tree structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const folderTree = buildTree(transformedFolders);

    // Send JSON
    res.json({
      files: transformedFiles,
      folders: folderTree
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
