// controllers/userController.js
import { supabase } from '../services/supabaseClient.js';

export const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId);

    if (fileError) throw fileError;

    // Get folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId);

    if (folderError) throw folderError;

    res.status(200).json({ files, folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
