import { supabase } from '../services/supabaseClient.js';
import { transformFiles as transformFilesUtil, transformFolders, buildTree } from '../utils/transformFiles.js';

// Transform files with signed URLs (works for images, PDFs, videos, etc.)
const transformFiles = async (files) => {
  return await Promise.all(
    files.map(async (f) => {
      const transformed = transformFilesUtil([f])[0];

      try {
        // Encode the path to handle spaces and special characters
        const pathEncoded = encodeURIComponent(f.path);

        // Generate signed URL valid for 1 hour
        const { data: signedUrlData, error } = await supabase
          .storage
          .from('user-files')
          .createSignedUrl(pathEncoded, 60 * 60); // 1 hour expiry

        if (error) console.error('Signed URL error:', error);

        return {
          ...transformed,
          url: signedUrlData?.signedUrl ? encodeURI(signedUrlData.signedUrl) : null
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

    // Fetch files from Supabase
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('is_trashed', false);

    if (fileError) throw fileError;

    // Fetch folders from Supabase
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
