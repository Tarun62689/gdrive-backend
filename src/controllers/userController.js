// controllers/userController.js
import { supabase } from '../services/supabaseClient.js';

// Helper: transform files
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

// Helper: transform folders
const transformFolders = (folders) =>
  folders.map(f => ({
    id: f.id,
    name: f.name,
    parentId: f.parent_folder_id || null,
    type: 'folder',
    createdAt: f.created_at
  }));

// Helper: build nested folder tree
const buildTree = (items, parentId = null) =>
  items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));

export const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (fileError) throw fileError;

    // Get folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (folderError) throw folderError;

    // Transform files & folders
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
