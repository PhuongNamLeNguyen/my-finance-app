export async function resizeImage(file: File, maxWidth = 1024, maxHeight = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Set a timeout to prevent hanging forever
    const timeout = setTimeout(() => {
      reject(new Error("Image processing timed out"));
    }, 15000);

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        let width = img.width;
        let height = img.height;

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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress image to JPEG with 0.8 quality
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load image"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
