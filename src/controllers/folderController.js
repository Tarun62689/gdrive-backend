import { supabase } from '../services/supabaseClient.js';

// Rename folder
const renameFolder = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  try {
    const { data, error } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'Folder renamed successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Move folder to trash (soft delete)
const moveFolderToTrash = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('folders')
      .update({ is_trashed: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'Folder moved to trash', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Permanently delete folder
const deleteFolder = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Folder deleted permanently' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { renameFolder, moveFolderToTrash, deleteFolder };
