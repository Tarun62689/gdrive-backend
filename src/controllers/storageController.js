import { supabase } from '../services/supabaseClient.js';

const getUserContents = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find My Drive folder (case-insensitive, parent_folder_id = null)
    const { data: myDrive, error: driveError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', 'My Drive')
      .is('parent_folder_id', null)
      .maybeSingle();

    if (driveError) {
      return res.status(500).json({ error: 'Database error fetching My Drive' });
    }
    if (!myDrive) {
      return res.status(404).json({ error: 'My Drive folder not found' });
    }

    // Fetch subfolders of My Drive
    const { data: subfolders, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_folder_id', myDrive.id)
      .eq('is_trashed', false);

    if (foldersError) {
      return res.status(500).json({ error: 'Database error fetching subfolders' });
    }

    // Fetch files in My Drive root
    const { data: rootFiles, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .eq('folder_id', myDrive.id)
      .eq('is_trashed', false);

    if (filesError) {
      return res.status(500).json({ error: 'Database error fetching files' });
    }

    // Fetch files for each subfolder
    const foldersWithFiles = await Promise.all(
      subfolders.map(async (folder) => {
        const { data: filesInFolder, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('folder_id', folder.id)
          .eq('is_trashed', false);

        if (error) return { ...folder, files: [] };

        return { ...folder, files: filesInFolder };
      })
    );

    res.status(200).json({
      myDrive,
      rootFiles,
      folders: foldersWithFiles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getUserContents };
