import { supabase } from '../services/supabaseClient.js';

const permissionLevels = { view: 1, edit: 2, owner: 3 };

const checkFolderPermission = (requiredPermission) => async (req, res, next) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id || req.body.folderId;

    // Check if folder exists and get owner
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('user_id')
      .eq('id', folderId)
      .single();

    if (folderError || !folder) return res.status(404).json({ error: 'Folder not found' });

    // Owner has all permissions
    if (folder.user_id === userId) {
      return next();
    }

    // Check share permissions for folder
    const { data: share, error: shareError } = await supabase
      .from('folder_shares')  // assuming you have folder_shares table similar to file_shares
      .select('permission')
      .eq('folder_id', folderId)
      .eq('shared_with', userId)
      .single();

    if (shareError || !share) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (permissionLevels[share.permission] < permissionLevels[requiredPermission]) {
      return res.status(403).json({ error: `You need '${requiredPermission}' permission` });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default checkFolderPermission;
