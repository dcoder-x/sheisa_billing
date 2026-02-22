import { put, del, list, head } from '@vercel/blob'
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
  GetUrlOptions,
  FileMetadata,
  StorageError,
  StorageProvider,
} from '../types'

export class VercelBlobProvider implements IStorageProvider {
  private token: string

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || ''

    if (!this.token) {
      throw new StorageError(
        'Vercel Blob token not configured',
        'MISSING_CREDENTIALS',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async upload(
    file: Buffer | Blob | File,
    path: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const blob = await put(path, file, {
        access: options?.isPublic ? 'public' : 'public',
        token: this.token,
        contentType: options?.contentType,
        addRandomSuffix: false,
      })

      // Get file size
      let size = 0
      if (file instanceof Buffer) {
        size = file.length
      } else if (file instanceof Blob || file instanceof File) {
        size = file.size
      }

      return {
        url: blob.url,
        path: blob.pathname,
        size,
        contentType: blob.contentType || options?.contentType || 'application/octet-stream',
        provider: StorageProvider.VERCEL_BLOB,
      }
    } catch (error: any) {
      throw new StorageError(
        `Failed to upload file: ${error.message}`,
        'UPLOAD_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async download(path: string): Promise<Buffer> {
    try {
      const url = await this.getUrl(path)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error: any) {
      throw new StorageError(
        `Failed to download file: ${error.message}`,
        'DOWNLOAD_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async delete(path: string): Promise<boolean> {
    try {
      await del(path, {
        token: this.token
      })
      return true
    } catch (error: any) {
      throw new StorageError(
        `Failed to delete file: ${error.message}`,
        'DELETE_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async getUrl(path: string, options?: GetUrlOptions): Promise<string> {
    try {
      // For Vercel Blob, construct the URL directly
      // The blob URL is typically: https://[random].public.blob.vercel-storage.com/[path]
      const blob = await head(path, { token: this.token })
      return blob.url
    } catch (error: any) {
      throw new StorageError(
        `Failed to get URL: ${error.message}`,
        'GET_URL_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async list(prefix: string): Promise<FileMetadata[]> {
    try {
      const { blobs } = await list({
        prefix,
        token: this.token,
      })

      return blobs.map((blob: any) => ({
        name: blob.pathname.split('/').pop() || blob.pathname,
        path: blob.pathname,
        size: blob.size,
        contentType: blob.contentType || 'application/octet-stream',
        updated: new Date(blob.uploadedAt),
      }))
    } catch (error: any) {
      throw new StorageError(
        `Failed to list files: ${error.message}`,
        'LIST_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await head(path, {
        token: this.token
      })
      return true
    } catch (error) {
      return false
    }
  }

  async copy(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      // Vercel Blob doesn't have native copy, so download and re-upload
      const file = await this.download(sourcePath)
      const sourceBlob = await head(sourcePath, { token: this.token })

      await this.upload(file, destinationPath, {
        contentType: sourceBlob.contentType,
      })

      return true
    } catch (error: any) {
      throw new StorageError(
        `Failed to copy file: ${error.message}`,
        'COPY_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }

  async move(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      await this.copy(sourcePath, destinationPath)
      await this.delete(sourcePath)
      return true
    } catch (error: any) {
      throw new StorageError(
        `Failed to move file: ${error.message}`,
        'MOVE_FAILED',
        StorageProvider.VERCEL_BLOB
      )
    }
  }
}
