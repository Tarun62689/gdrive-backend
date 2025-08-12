import { supabase } from '../services/supabaseClient.js';

const permissionLevels = { view: 1, edit: 2, owner: 3 };

// --------------------
// Helper: Paginated Query
// --------------------
const paginate = (page, limit) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const offset = (p - 1) * l;
  return { p, l, offset };
};

// --------------------
// Upload File
// --------------------
const uploadFile = async (req, res) => {
  try {
    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user?.id;
    if (!buffer) return res.status(400).json({ error: 'No file uploaded' });

    // Find folder_id (default to My Drive)
    let folderId = req.body.folder_id || null;
    if (!folderId) {
      const { data: myDrive, error: driveError } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', 'My Drive')
        .is('parent_folder_id', null)
        .maybeSingle();

      if (driveError) {
        return res.status(400).json({ error: 'Database error searching My Drive' });
      }

      if (!myDrive) {
        const { data: newDrive, error: createError } = await supabase
          .from('folders')
          .insert([{ user_id: userId, name: 'My Drive', parent_folder_id: null }])
          .select()
          .single();

        if (createError) {
          return res.status(500).json({ error: 'Failed to create My Drive folder' });
        }
        folderId = newDrive.id;
      } else {
        folderId = myDrive.id;
      }
    }

    // Permission Check
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('user_id')
      .eq('id', folderId)
      .single();

    if (folderError || !folder) return res.status(404).json({ error: 'Folder not found' });

    if (folder.user_id !== userId) {
      const { data: share, error: shareError } = await supabase
        .from('folder_shares')
        .select('permission')
        .eq('folder_id', folderId)
        .eq('shared_with', userId)
        .single();

      if (shareError || !share || permissionLevels[share.permission] < permissionLevels.edit) {
        return res.status(403).json({ error: 'No permission to upload here' });
      }
    }

    // Upload to storage
    const storagePath = `${userId}/${Date.now()}-${originalname}`;
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .upload(storagePath, buffer, { contentType: mimetype });

    if (storageError) throw storageError;

    // Save to DB
    const { data, error } = await supabase
      .from('files')
      .insert([
        {
          path: storagePath,
          name: originalname,
          size,
          mime_type: mimetype,
          format: mimetype,
          user_id: userId,
          folder_id: folderId,
          is_trashed: false,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'File uploaded successfully', file: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------
// List Files (Paginated)
// --------------------
const listFiles = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page, limit } = req.query;
    const { p, l, offset } = paginate(page, limit);

    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, size, uploaded_at')
      .eq('user_id', userId)
      .is('is_trashed', false)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + l - 1);

    if (error) throw error;

    const { count } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('is_trashed', false);

    res.status(200).json({ page: p, limit: l, total: count, results: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------
// Rename Item
// --------------------
const renameItem = async (req, res) => {
  const { id } = req.params;
  const { newName, type } = req.body;
  try {
    const table = type === 'file' ? 'files' : 'folders';
    const { data, error } = await supabase
      .from(table)
      .update({ name: newName })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ message: 'Renamed successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------
// Move to Trash
// --------------------
const moveToTrash = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const table = type === 'file' ? 'files' : 'folders';
    const { data, error } = await supabase
      .from(table)
      .update({ is_trashed: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ message: 'Moved to Trash', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------
// Delete Item
// --------------------
const deleteItem = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const table = type === 'file' ? 'files' : 'folders';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: `${type} deleted permanently` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------
// Get All User Data
// --------------------
const getUserData = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (folderError) throw folderError;

    // Files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (fileError) throw fileError;

    // Shared Folders
    const { data: sharedFolders, error: sharedFolderError } = await supabase
      .from('folder_shares')
      .select('*, folders(*)')
      .eq('shared_with', userId);

    if (sharedFolderError) throw sharedFolderError;

    // Shared Files
    const { data: sharedFiles, error: sharedFileError } = await supabase
      .from('file_shares')
      .select('*, files(*)')
      .eq('shared_with', userId);

    if (sharedFileError) throw sharedFileError;

    res.status(200).json({
      userId,
      folders,
      files,
      sharedFolders,
      sharedFiles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  uploadFile,
  listFiles,
  renameItem,
  moveToTrash,
  deleteItem,
  getUserData
};
