import { IStorageProvider, UploadOptions, UploadResult, GetUrlOptions, FileMetadata } from './types'
import { StorageFactory } from './factory'

/**
 * Storage service that provides a singleton instance of the configured storage provider
 */
class StorageService {
    private static instance: IStorageProvider | null = null
    private static currentUserId: string | null = null

    /**
     * Get the storage provider instance for a specific user
     * Falls back to environment-based provider if no user config exists
     */
    static async getProvider(userId?: string): Promise<IStorageProvider> {
        // If userId is provided and different from current, reset instance
        if (userId && userId !== this.currentUserId) {
            this.instance = null
            this.currentUserId = userId
        }

        if (!this.instance) {
            // Try to get user-specific configuration
            if (userId) {
                try {
                    // Dynamic import to avoid circular dependencies if storage-config uses storage service
                    // Assuming StorageConfigService exists, but for now we might skip if it doesn't 
                    // to avoid errors in this step. 
                    // const { StorageConfigService } = await import('../services/storage-config.service')
                    // const userConfig = await StorageConfigService.getConfig(userId)

                    const userConfig = null; // Placeholder until StorageConfigService is implemented

                    if (userConfig) {
                        this.instance = StorageFactory.createProvider(
                            // @ts-ignore
                            userConfig.provider,
                            // @ts-ignore
                            userConfig.config as any
                        )
                        return this.instance
                    }
                } catch (error) {
                    console.warn('Failed to load user storage config, falling back to environment:', error)
                }
            }

            // Fall back to environment-based provider
            this.instance = StorageFactory.createFromEnv()
        }

        return this.instance
    }

    /**
     * Reset the storage provider instance (useful for testing or provider switching)
     */
    static resetProvider(): void {
        this.instance = null
    }

    /**
     * Set a custom storage provider instance
     */
    static setProvider(provider: IStorageProvider): void {
        this.instance = provider
    }

    // Convenience methods that delegate to the provider

    static async upload(
        file: Buffer | Blob | File,
        path: string,
        options?: UploadOptions & { userId?: string }
    ): Promise<UploadResult> {
        const provider = await this.getProvider(options?.userId)
        return provider.upload(file, path, options)
    }

    static async download(path: string, userId?: string): Promise<Buffer> {
        const provider = await this.getProvider(userId)
        return provider.download(path)
    }

    static async delete(path: string, userId?: string): Promise<boolean> {
        const provider = await this.getProvider(userId)
        return provider.delete(path)
    }

    static async getUrl(path: string, options?: GetUrlOptions & { userId?: string }): Promise<string> {
        const provider = await this.getProvider(options?.userId)
        return provider.getUrl(path, options)
    }

    static async list(prefix: string, userId?: string): Promise<FileMetadata[]> {
        const provider = await this.getProvider(userId)
        return provider.list(prefix)
    }

    static async exists(path: string, userId?: string): Promise<boolean> {
        const provider = await this.getProvider(userId)
        return provider.exists(path)
    }

    static async copy(sourcePath: string, destinationPath: string, userId?: string): Promise<boolean> {
        const provider = await this.getProvider(userId)
        return provider.copy(sourcePath, destinationPath)
    }

    static async move(sourcePath: string, destinationPath: string, userId?: string): Promise<boolean> {
        const provider = await this.getProvider(userId)
        return provider.move(sourcePath, destinationPath)
    }
}

export default StorageService
