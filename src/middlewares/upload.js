// middlewares/upload.js
import multer from 'multer';

// Store in memory or to disk temporarily
const storage = multer.memoryStorage(); // or use diskStorage if needed

export const upload = multer({ storage });
