// routes/upload.js
import express from 'express';
import multer from 'multer';
import { supabase } from '../services/supabaseClient.js';


const router = express.Router();

// Use multer with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // optional: 10MB limit
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const { userId } = req.body;
  const file = req.file;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request body' });
  }

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}_${file.originalname}`;

  // Upload to Supabase Storage
  const { data, error: uploadError } = await supabase.storage
    .from('user-files')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    return res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });
  }

  // Insert metadata into 'files' table
  const { error: dbError } = await supabase
    .from('files')
    .insert([{
      user_id: userId,
      path: fileName,
      size: file.size,
      mime_type: file.mimetype,
    }]);

  if (dbError) {
    return res.status(500).json({ error: `Database insert failed: ${dbError.message}` });
  }

  const publicUrl = `https://ripiijqxhhbklktjifgl.supabase.co/storage/v1/object/public/user-files/${fileName}`;

  res.status(200).json({
    message: 'File uploaded successfully',
    path: fileName,
    url: publicUrl,
  });
});

export default router;
