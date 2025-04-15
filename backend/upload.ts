import { booqImageUrl } from './images'
import { uploadToSource } from './library'
import { addUpload } from './users'

export async function uploadEpubBook(fileBuffer: Buffer, userId: string) {
    let { id, title, cover } = await uploadToSource('uu', fileBuffer, userId) ?? {}
    if (id) {
        const added = addUpload(userId, id)
        if (!added) {
            console.error('Failed to add upload to collection')
        }
        if (cover) {
            cover = booqImageUrl(id, cover)
        }
        return {
            success: true,
            id, title, cover,
        } as const
    } else {
        return {
            success: false,
            error: 'Failed to upload book',
        }
    }
}