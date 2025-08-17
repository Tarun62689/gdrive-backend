// utils/transformFiles.js
export const getFileName = (path) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

export const getFileType = (mime_type) => {
  if (!mime_type) return 'file';
  if (mime_type.startsWith('image/')) return 'image';
  if (mime_type.startsWith('video/')) return 'video';
  if (mime_type === 'application/pdf') return 'pdf';
  return 'file';
};

export const getThumbnail = (file) => {
  if (file.mime_type.startsWith('image/')) {
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${file.path}`;
  }
  return null;
};

export const transformFiles = (files) => {
  return files.map(file => ({
    id: file.id,
    name: file.name || getFileName(file.path),
    type: getFileType(file.mime_type),
    size: file.size,
    uploadedAt: file.uploaded_at,
    path: file.path,
    thumbnail: getThumbnail(file),
    folderId: file.folder_id,
    isTrashed: file.is_trashed,
  }));
};
