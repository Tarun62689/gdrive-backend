// File: src/controllers/fileController.js
import { supabase } from '../services/supabaseClient.js';

const permissionLevels = { view: 1, edit: 2, owner: 3 };

// --------------------
// Helper: Paginate
// --------------------
const paginate = (page, limit) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const offset = (p - 1) * l;
  return { p, l, offset };
};

// --------------------
// Helper: Transform files
// --------------------
const transformFiles = (files) =>
  files.map(f => {
    const name = f.name || f.path.split('/').pop();
    let type = 'file';
    if (f.mime_type?.startsWith('image/')) type = 'image';
    else if (f.mime_type?.startsWith('video/')) type = 'video';
    else if (f.mime_type === 'application/pdf') type = 'pdf';

    const { data: publicUrl } = supabase.storage.from('user-files').getPublicUrl(f.path);

    return {
      id: f.id,
      name,
      type,
      size: f.size,
      uploadedAt: f.uploaded_at,
      folderId: f.folder_id,
      url: publicUrl.publicUrl,
      isTrashed: f.is_trashed
    };
  });

// --------------------
// Helper: Transform folders
// --------------------
const transformFolders = (folders) =>
  folders.map(f => ({
    id: f.id,
    name: f.name,
    parentId: f.parent_folder_id || null,
    type: 'folder',
    createdAt: f.created_at,
  }));

// --------------------
// Helper: Build folder tree
// --------------------
const buildTree = (items, parentId = null) =>
  items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));

// --------------------
// Upload File
// --------------------
const uploadFile = async (req, res) => {
  try {
    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user?.id;
    if (!buffer) return res.status(400).json({ error: 'No file uploaded' });

    // Default folder: My Drive
    let folderId = req.body.folder_id || null;
    if (!folderId) {
      const { data: myDrive, error: driveError } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', 'My Drive')
        .is('parent_folder_id', null)
        .maybeSingle();
      if (driveError) return res.status(400).json({ error: 'Database error' });

      if (!myDrive) {
        const { data: newDrive, error: createError } = await supabase
          .from('folders')
          .insert([{ user_id: userId, name: 'My Drive', parent_folder_id: null }])
          .select()
          .single();
        if (createError) return res.status(500).json({ error: 'Failed to create My Drive' });
        folderId = newDrive.id;
      } else folderId = myDrive.id;
    }

    // Upload to storage
    const storagePath = `${userId}/${Date.now()}-${originalname}`;
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .upload(storagePath, buffer, { contentType: mimetype });
    if (storageError) throw storageError;

    // Generate public URL
    const { data: publicUrl } = supabase.storage.from('user-files').getPublicUrl(storagePath);

    // Save to DB
    const { data, error } = await supabase
      .from('files')
      .insert([{
        path: storagePath,
        name: originalname,
        size,
        mime_type: mimetype,
        user_id: userId,
        folder_id: folderId,
        is_trashed: false,
        uploaded_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;

    res.status(200).json({ message: 'File uploaded', file: { ...data, url: publicUrl.publicUrl } });
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
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + l - 1);
    if (error) throw error;

    const filesWithUrls = transformFiles(files);

    res.status(200).json({ page: p, limit: l, results: filesWithUrls });
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
// Delete Item Permanently
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
// Get User Data (Google Drive Style)
// --------------------
const getUserData = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Fetch folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);
    if (folderError) throw folderError;

    // Fetch files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);
    if (fileError) throw fileError;

    // Transform data
    const filesWithUrls = transformFiles(files);
    const transformedFolders = transformFolders(folders);
    const folderTree = buildTree(transformedFolders);

    res.status(200).json({
      files: filesWithUrls,
      folders: folderTree
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
