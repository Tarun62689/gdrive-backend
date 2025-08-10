import express from 'express';
import { getUserContents } from '../controllers/storageController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// GET all files and folders for logged-in user
router.get('/check-my-drive', authenticateUser, getUserContents);

export default router;
