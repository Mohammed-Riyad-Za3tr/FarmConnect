export interface UploadImageInput {
  sourceUrl: string;
  productId: string;
  producerId: string;
}

export interface UploadImageResult {
  url: string;
  storageKey: string | null;
}

export interface ImageStorageProvider {
  upload(input: UploadImageInput): Promise<UploadImageResult>;
}

/**
 * Local default provider.
 * Phase 5B requires an upload abstraction, so this provider acts as a drop-in
 * that simply returns the provided URL until real cloud storage is integrated.
 */
class PassthroughImageStorageProvider implements ImageStorageProvider {
  async upload(input: UploadImageInput): Promise<UploadImageResult> {
    return {
      url: input.sourceUrl,
      storageKey: null,
    };
  }
}

export const imageStorageProvider: ImageStorageProvider = new PassthroughImageStorageProvider();
