import { BooqMeta } from '../core'
import { EpubPackage } from './epub'

export async function getMetadata(epub: EpubPackage): Promise<BooqMeta> {
    return epub.metadata
}
