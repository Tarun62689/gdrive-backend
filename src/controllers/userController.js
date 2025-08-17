// controllers/userController.js
import { supabase } from '../services/supabaseClient.js';
import { transformFiles as transformFilesUtil, transformFolders, buildTree } from '../utils/transformFiles.js';

// Transform files and generate signed URLs for all files
const transformFiles = async (files) => {
  return await Promise.all(
    files.map(async (f) => {
      const transformed = transformFilesUtil([f])[0];

      try {
        // Generate signed URL for every file (valid 1 hour)
        const { data: signedUrlData, error } = await supabase
          .storage
          .from('user-files')
          .createSignedUrl(f.path, 60 * 60);

        if (error) console.error('Signed URL error:', error);

        return {
          ...transformed,
          url: signedUrlData?.signedUrl || null
        };
      } catch (err) {
        console.error('Error generating signed URL:', err);
        return transformed;
      }
    })
  );
};

export const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all files
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (fileError) throw fileError;

    // Fetch all folders
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (folderError) throw folderError;

    // Transform files & folders
    const filesWithUrls = await transformFiles(files);
    const transformedFolders = transformFolders(folders);
    const folderTree = buildTree(transformedFolders);

    res.status(200).json({
      files: filesWithUrls,
      folders: folderTree
    });
  } catch (error) {
    console.error('getUserData error:', error);
    res.status(500).json({ error: error.message });
  }
};
