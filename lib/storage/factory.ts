import { IStorageProvider } from './types'
import { LocalStorageProvider } from './providers/local-storage.provider'
import { VercelBlobProvider } from './providers/vercel-blob'

export type StorageProviderType = 'local' | 's3' | 'gcs' | 'vercel-blob'

export class StorageFactory {
    static createProvider(type: StorageProviderType, config: any = {}): IStorageProvider {
        switch (type) {
            case 'local':
                return new LocalStorageProvider(config)
            case 'vercel-blob':
                return new VercelBlobProvider(config.token)
            case 's3':
                // Return new S3StorageProvider(config) when implemented
                throw new Error('S3 provider not implemented yet')
            case 'gcs':
                // Return new GCSStorageProvider(config) when implemented
                throw new Error('GCS provider not implemented yet')
            default:
                throw new Error(`Unsupported storage provider: ${type}`)
        }
    }

    static createFromEnv(): IStorageProvider {
        // Default to local for now, could read generic SC_PROVIDER env var
        const provider = (process.env.STORAGE_PROVIDER as StorageProviderType) || 'local'

        const config: any = {
            baseDir: process.env.STORAGE_LOCAL_ROOT,
            publicUrlBase: process.env.STORAGE_LOCAL_URL_BASE
        }

        if (provider === 'vercel-blob') {
            config.token = process.env.BLOB_READ_WRITE_TOKEN
        }

        return this.createProvider(provider, config)
    }
}
