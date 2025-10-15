
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result includes the "data:mime/type;base64," prefix, which we remove.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read blob as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = (err) => reject(err);
            if (e.target?.result && typeof e.target.result === 'string') {
                img.src = e.target.result;
            } else {
                reject(new Error("Could not read image file to determine dimensions."));
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};
