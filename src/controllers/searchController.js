import { supabase } from '../services/supabaseClient.js';

const searchFilesAndFolders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const offset = (page - 1) * limit;

    // Search files by name_tsv with pagination
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .textSearch('name_tsv', query, { config: 'english' })
      .range(offset, offset + limit - 1)
      .order('uploaded_at', { ascending: false });

    if (filesError) throw filesError;

    // Search folders by name_tsv with pagination
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .textSearch('name_tsv', query, { config: 'english' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (foldersError) throw foldersError;

    res.status(200).json({
      files: {
        results: files,
        total: files.length,
        page: Number(page),
        limit: Number(limit),
      },
      folders: {
        results: folders,
        total: folders.length,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { searchFilesAndFolders };
