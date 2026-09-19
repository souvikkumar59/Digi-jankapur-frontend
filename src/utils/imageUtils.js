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

/**
 * Checks if an avatar string is a valid image (data URL, or valid HTTP image)
 */
export const resolveAvatarUrl = (user, fallbackName = 'Classmate') => {
  const pic = user?.profilePicture;
  if (pic) {
    if (pic.startsWith('data:image/')) return pic;
    if (
      pic.startsWith('http') &&
      !pic.includes('cloudinary.com') &&
      !pic.includes('.html') &&
      !pic.includes('daily-current-affairs')
    ) {
      return pic;
    }
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || fallbackName)}&background=6366f1&color=fff&bold=true`;
};
