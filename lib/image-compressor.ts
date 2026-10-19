/**
 * Client-side Image Compression Utility
 * Resizes large smartphone/camera photos (up to 25MB, HEIC, PNG, JPG) to web-optimized JPEGs (< 500KB)
 * prior to uploading to Cloudinary / serverless APIs.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = "image/jpeg",
  } = options;

  // If running on server or in non-browser environment, return original
  if (typeof window === "undefined" || !window.document) {
    return file;
  }

  // If already very small (< 250KB) and is standard web image, skip compression
  if (file.size < 250 * 1024 && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return file;
  }

  return new Promise((resolve) => {
    // Timeout fallback: if image processing hangs, return original file
    const timeoutId = setTimeout(() => {
      console.warn("Image compression timed out. Falling back to original file:", file.name);
      resolve(file);
    }, 8000);

    const finish = (result: File) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(url);

          let { width, height } = img;

          // Calculate aspect ratio fit within maxWidth x maxHeight
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.warn("Could not get 2D canvas context. Returning original file.");
            return finish(file);
          }

          // Fill white background in case of transparent PNGs
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Draw and scale image smoothly
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn("Canvas toBlob failed. Returning original file.");
                return finish(file);
              }

              // Create clean web-safe filename
              const baseName = file.name.replace(/\.[^/.]+$/, "") || "photo";
              const newFileName = `${baseName}.jpg`;

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              console.log(
                `Compressed "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB -> ${(compressedFile.size / 1024).toFixed(1)} KB)`
              );

              finish(compressedFile);
            },
            mimeType,
            quality
          );
        } catch (err) {
          console.error("Canvas draw/export error:", err);
          finish(file);
        }
      };

      img.onerror = (err) => {
        console.warn("Image load failed in browser. Returning original file:", err);
        URL.revokeObjectURL(url);
        finish(file);
      };

      img.src = url;
    } catch (err) {
      console.error("Image compression error:", err);
      finish(file);
    }
  });
}
