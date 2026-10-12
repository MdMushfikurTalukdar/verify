// Map certificate ID → Google Drive File ID
// Add new entries here whenever you upload a new image
export const imageMap = {
  '226046418': 'PASTE_GOOGLE_DRIVE_FILE_ID_HERE',
  // '226046419': 'ANOTHER_FILE_ID',
};

// Build a direct image URL from a Drive File ID
export const getDriveImageUrl = (fileId) => {
  if (!fileId) return null;
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};