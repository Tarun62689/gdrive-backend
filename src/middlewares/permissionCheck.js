import { supabase } from '../services/supabaseClient.js';

const permissionLevels = { view: 1, edit: 2, owner: 3 };

const checkFilePermission = (requiredPermission) => async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id || req.body.fileId;

    // Check if file exists and get owner
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('user_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) return res.status(404).json({ error: 'File not found' });

    // Owner has all permissions
    if (file.user_id === userId) {
      return next();
    }

    // Check share permissions
    const { data: share, error: shareError } = await supabase
      .from('file_shares')
      .select('permission')
      .eq('file_id', fileId)
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

export default checkFilePermission;
