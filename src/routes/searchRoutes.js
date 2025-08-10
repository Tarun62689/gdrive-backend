import express from 'express';
import { authenticateUser } from '../middlewares/auth.js';
import { searchFilesAndFolders } from '../controllers/searchController.js';

const router = express.Router();

router.get('/search', authenticateUser, searchFilesAndFolders);

export default router;
