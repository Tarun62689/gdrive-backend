import express from 'express';
import { authenticateUser } from '../middlewares/auth.js';
import { createShareLink, getSignedUrl, getFileByShareToken } from '../controllers/shareController.js';  

const router = express.Router();

router.post('/share', authenticateUser, createShareLink);
router.get('/file/:fileId/signed-url', authenticateUser, getSignedUrl);
router.get('/public/:shareToken', getFileByShareToken);  // public route, no auth

export default router;
