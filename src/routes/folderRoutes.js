// routes/folderRoutes.js
import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

/**
 * Middleware to extract user from session (optional)
 * You must call supabase.auth.setAuth(token) before this if using server-side auth
 */

/**
 * Create Folder
 * POST /api/folders/create
 */
router.post("/folders/create", async (req, res) => {
  const { name, parent_folder_id = null } = req.body;

  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }

    const { data, error } = await supabase
      .from("folders")
      .insert([{ user_id: user.id, name, parent_folder_id }])
      .select();

    if (error) throw error;

    res.status(201).json({ folder: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get Root Folders
 * GET /api/folders/user
 */
router.get("/folders/user", async (req, res) => {
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .is("parent_folder_id", null);

    if (error) throw error;

    res.json({ folders: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get Folder Details (with subfolders and files)
 * GET /api/folders/:folder_id/details
 */
router.get("/folders/:folder_id/details", async (req, res) => {
  const { folder_id } = req.params;

  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }

    const { data: folder, error: folderErr } = await supabase
      .from("folders")
      .select("*")
      .eq("id", folder_id)
      .eq("user_id", user.id)
      .single();

    if (folderErr) throw folderErr;

    const { data: subfolders, error: subErr } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_folder_id", folder_id)
      .eq("user_id", user.id);

    if (subErr) throw subErr;

    const { data: files, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("folder_id", folder_id)
      .eq("user_id", user.id);

    if (fileErr) throw fileErr;

    res.json({ folder, subfolders, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default router;
