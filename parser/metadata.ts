import { BooqMeta } from '../core'
import { EpubFile } from './epub'

export async function getMetadata(epub: EpubFile): Promise<BooqMeta> {
    return epub.metadata
}
