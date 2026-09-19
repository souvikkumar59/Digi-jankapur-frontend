/**
 * Resizes and compresses an image file to a lightweight data URL
 * Suitable for avatars (max 400x400, JPEG 85% quality)
 */
export const compressImageFile = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (PNG, JPG, WEBP).'));
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = readerEvent.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file from device.'));
    reader.readAsDataURL(file);
  });
};

export const resolveAvatarUrl = (userOrPic, fallbackName = 'Classmate') => {
  if (!userOrPic) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=f59e0b&color=1c1917&bold=true&rounded=true`;
  }

  // If userOrPic is a raw image string (data URI, HTTP URL, or local path)
  if (typeof userOrPic === 'string') {
    const trimmed = userOrPic.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
  }

  // If userOrPic is a user object with profilePicture
  const pic = userOrPic?.profilePicture;
  if (pic && typeof pic === 'string') {
    const trimmed = pic.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
  }

  const name = (typeof userOrPic === 'object' && userOrPic?.name) ? userOrPic.name : fallbackName;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f59e0b&color=1c1917&bold=true&rounded=true`;
};
