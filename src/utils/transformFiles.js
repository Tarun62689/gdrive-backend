export const getFileName = (path) => path.split('/').pop();

export const getFileType = (mime_type) => {
  if (!mime_type) return 'file';
  if (mime_type.startsWith('image/')) return 'image';
  if (mime_type.startsWith('video/')) return 'video';
  if (mime_type === 'application/pdf') return 'pdf';
  return 'file';
};

export const getThumbnail = (file) => {
  if (file.mime_type?.startsWith('image/')) {
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${file.path}`;
  }
  return null;
};

export const transformFiles = (files) => files.map(file => ({
  id: file.id,
  name: file.name || getFileName(file.path),
  type: getFileType(file.mime_type),
  size: file.size,
  uploadedAt: file.uploaded_at,
  path: file.path,
  thumbnail: getThumbnail(file),
  folderId: file.folder_id,
  isTrashed: file.is_trashed
}));

export const transformFolders = (folders) => folders.map(f => ({
  id: f.id,
  name: f.name,
  parentId: f.parent_folder_id || null,
  type: 'folder',
  createdAt: f.created_at
}));

export const buildTree = (items, parentId = null) =>
  items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
