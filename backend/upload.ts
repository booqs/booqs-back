import { addUpload } from './collections'
import { booqImageUrl } from './images'
import { uploadToLibrary } from './library'

export async function uploadEpubBook(fileBuffer: Buffer, userId: string) {
    let { id, title, cover } = await uploadToLibrary('uu', fileBuffer, userId) ?? { title: null, cover: null }
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