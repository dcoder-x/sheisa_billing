
export interface FileMetadata {
    name: string
    size: number
    contentType: string
    updated: Date
    path: string
}

export interface UploadOptions {
    contentType?: string
    metadata?: Record<string, any>
    isPublic?: boolean
}

export enum StorageProvider {
    LOCAL = 'local',
    S3 = 's3',
    GCS = 'gcs',
    VERCEL_BLOB = 'vercel-blob',
}

export class StorageError extends Error {
    constructor(
        message: string,
        public code: string,
        public provider: StorageProvider
    ) {
        super(message);
        this.name = 'StorageError';
    }
}

export interface UploadResult {
    url: string
    path: string
    provider: StorageProvider
    size: number
    contentType: string
}

export interface GetUrlOptions {
    expiresIn?: number // Seconds
    download?: boolean
    fileName?: string
}

export interface IStorageProvider {
    /**
     * Upload a file to storage
     */
    upload(
        file: Buffer | Blob | File | string, // Content or path
        path: string,
        options?: UploadOptions
    ): Promise<UploadResult>

    /**
     * Download a file from storage
     */
    download(path: string): Promise<Buffer>

    /**
     * Delete a file from storage
     */
    delete(path: string): Promise<boolean>

    /**
     * Get a URL for a file (public or signed)
     */
    getUrl(path: string, options?: GetUrlOptions): Promise<string>

    /**
     * Check if a file exists
     */
    exists(path: string): Promise<boolean>

    /**
     * List files with a prefix
     */
    list(prefix: string): Promise<FileMetadata[]>

    /**
     * Copy a file
     */
    copy(sourcePath: string, destinationPath: string): Promise<boolean>

    /**
     * Move a file
     */
    move(sourcePath: string, destinationPath: string): Promise<boolean>
}

export class StoragePaths {
    static templateDocument(userId: string, templateId: string, documentId: string, filename: string) {
        return `users/${userId}/templates/${templateId}/documents/${documentId}/${filename}`;
    }

    static templateSource(userId: string, templateId: string, filename: string) {
        return `users/${userId}/templates/${templateId}/source/${filename}`;
    }
}
