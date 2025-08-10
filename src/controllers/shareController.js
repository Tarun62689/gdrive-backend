import { supabase } from '../services/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

// Create a shareable link
const createShareLink = async (req, res) => {
  try {
    const { fileId, sharedWithUserId, permission } = req.body;
    const sharedBy = req.user.id;

    if (!['view', 'edit', 'owner'].includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission type' });
    }

    // Generate a unique token for sharing
    const shareToken = uuidv4();

    const { data, error } = await supabase
      .from('file_shares')
      .insert({
        file_id: fileId,
        shared_by: sharedBy,
        shared_with: sharedWithUserId || null,
        share_token: shareToken,
        permission,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Share link created', share: data, shareUrl: `/share/${shareToken}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get signed URL for a shared file
const getSignedUrl = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Check permission: either owner or shared with this user
    const { data: shares, error: sharesError } = await supabase
      .from('file_shares')
      .select('*')
      .or(`file_id.eq.${fileId},shared_with.eq.${userId}`)
      .single();

    if (sharesError || !shares) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get file path
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('path')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    // Generate signed URL valid for 5 minutes
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(file.path, 300);

    if (urlError) throw urlError;

    res.json({ signedUrl: signedUrl.signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get file info & signed URL by share token (public access)
const getFileByShareToken = async (req, res) => {
  try {
    const { shareToken } = req.params;

    // Find the share record by token
    const { data: share, error: shareError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (shareError || !share) {
      return res.status(404).json({ error: 'Invalid or expired share link' });
    }

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('path')
      .eq('id', share.file_id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate signed URL valid for 5 minutes
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(file.path, 300);

    if (urlError) throw urlError;

    res.json({ signedUrl: signedUrl.signedUrl, permission: share.permission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { createShareLink, getSignedUrl,getFileByShareToken };
