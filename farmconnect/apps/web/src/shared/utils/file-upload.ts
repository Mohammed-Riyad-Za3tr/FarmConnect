export const DEFAULT_MAX_UPLOAD_BYTES = 1_500_000;

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isWithinSizeLimit(file: File, maxBytes = DEFAULT_MAX_UPLOAD_BYTES): boolean {
  return file.size <= maxBytes;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read file data'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Could not read file data'));
    reader.readAsDataURL(file);
  });
}
