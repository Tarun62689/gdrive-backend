// routes/userRoutes.js
import express from 'express';
import { authenticateUser } from '../middlewares/auth.js';
import { getUserData } from '../controllers/userController.js';

const router = express.Router();

router.get('/data', authenticateUser, getUserData);

export default router;
