import { promises as fs } from 'fs'
import { join, dirname, relative, resolve } from 'path'
import { IStorageProvider, UploadOptions, UploadResult, GetUrlOptions, FileMetadata, StorageProvider } from '../types'

export class LocalStorageProvider implements IStorageProvider {
    private baseDir: string
    private publicUrlBase: string

    constructor(config: { baseDir?: string; publicUrlBase?: string } = {}) {
        // Default to public/uploads
        this.baseDir = config.baseDir || join(process.cwd(), 'public', 'uploads')
        this.publicUrlBase = config.publicUrlBase || '/uploads'
    }

    private getFullPath(path: string): string {
        // Prevent directory traversal
        const safePath = path.replace(/\.\./g, '')
        return join(this.baseDir, safePath)
    }

    private getPublicUrl(path: string): string {
        const safePath = path.replace(/\.\./g, '')
        if (safePath.startsWith(this.publicUrlBase)) {
            return safePath.replace(/\\/g, '/').replace(/\/\//g, '/');
        }
        // Ensure format is /uploads/path/to/file.ext
        return `${this.publicUrlBase}/${safePath}`.replace(/\\/g, '/').replace(/\/\//g, '/')
    }

    async upload(
        file: Buffer | Blob | File | string,
        path: string,
        options?: UploadOptions
    ): Promise<UploadResult> {
        const fullPath = this.getFullPath(path)

        // Ensure directory exists
        await fs.mkdir(dirname(fullPath), { recursive: true })

        let buffer: Buffer

        if (Buffer.isBuffer(file)) {
            buffer = file
        } else if ((typeof Blob !== 'undefined' && file instanceof Blob) || (typeof File !== 'undefined' && file instanceof File)) {
            const arrayBuffer = await (file as Blob).arrayBuffer()
            buffer = Buffer.from(arrayBuffer)
        } else if (typeof file === 'string') {
            // Assume file path
            buffer = await fs.readFile(file)
        } else {
            throw new Error('Unsupported file type')
        }

        await fs.writeFile(fullPath, buffer)

        return {
            url: this.getPublicUrl(path),
            path,
            provider: StorageProvider.LOCAL,
            size: buffer.length,
            contentType: options?.contentType || 'application/octet-stream'
        }
    }

    async download(path: string): Promise<Buffer> {
        const fullPath = this.getFullPath(path)
        try {
            return await fs.readFile(fullPath)
        } catch (error) {
            // @ts-ignore
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${path}`)
            }
            throw error
        }
    }

    async delete(path: string): Promise<boolean> {
        const fullPath = this.getFullPath(path)
        try {
            await fs.unlink(fullPath)
            return true
        } catch (error) {
            // @ts-ignore
            if (error.code === 'ENOENT') {
                return false
            }
            throw error
        }
    }

    async getUrl(path: string, options?: GetUrlOptions): Promise<string> {
        if (path.startsWith('http')) return path;
        return this.getPublicUrl(path)
    }

    async exists(path: string): Promise<boolean> {
        const fullPath = this.getFullPath(path)
        try {
            await fs.access(fullPath)
            return true
        } catch {
            return false
        }
    }

    async list(prefix: string): Promise<FileMetadata[]> {
        const fullPath = this.getFullPath(prefix)
        const results: FileMetadata[] = []

        try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isFile()) {
                    const stats = await fs.stat(join(fullPath, entry.name))
                    results.push({
                        name: entry.name,
                        size: stats.size,
                        contentType: 'application/octet-stream', // Simple fallback
                        updated: stats.mtime,
                        path: join(prefix, entry.name).replace(/\\/g, '/')
                    })
                }
            }
        } catch (error) {
            // Start directory might not exist
        }

        return results
    }

    async copy(sourcePath: string, destinationPath: string): Promise<boolean> {
        const src = this.getFullPath(sourcePath)
        const dest = this.getFullPath(destinationPath)

        try {
            await fs.mkdir(dirname(dest), { recursive: true })
            await fs.copyFile(src, dest)
            return true
        } catch (error) {
            return false
        }
    }

    async move(sourcePath: string, destinationPath: string): Promise<boolean> {
        const src = this.getFullPath(sourcePath)
        const dest = this.getFullPath(destinationPath)

        try {
            await fs.mkdir(dirname(dest), { recursive: true })
            await fs.rename(src, dest)
            return true
        } catch (error) {
            return false
        }
    }
}
