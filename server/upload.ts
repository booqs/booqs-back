import multer from 'multer'
import { Express } from 'express'
import { parseCookies } from './cookie'
import { userIdFromToken } from '@/backend/token'
import { userForId } from '@/backend/users'
import { uploadToLibrary } from '@/backend/library'
import { booqImageUrl } from '@/backend/images'
import { addToCollection } from '../backend/collections'

async function fromCookie(cookie: string) {
    const userId = userIdFromToken(cookie)
    return userId
        ? userForId(userId)
        : null
}

export const UPLOADS_COLLECTION = 'uploads'
export function addUploadHandler(app: Express, route: string) {
    const upload = multer({
        storage: multer.memoryStorage(),
        fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'application/epub+zip') {
                return cb(new Error('Only .epub files are allowed!'))
            }
            cb(null, true)
        },
    })

    app.post(route, upload.single('file'), async (req, res) => {
        const { token } = parseCookies(req.headers?.['cookie'] ?? '')
        const user = await fromCookie(token ?? '') ?? undefined
        if (!user) {
            return res.status(401).send('Unauthorized')
        }
        if (!req.file) {
            return res.status(400).send('No file uploaded')
        }
        let { id, title, cover } = await uploadToLibrary('uu', req.file.buffer, user.id) ?? {}
        if (id) {
            const added = addToCollection({
                userId: user.id,
                name: UPLOADS_COLLECTION,
                booqId: id,
            })
            if (!added) {
                console.error('Failed to add upload to collection')
            }
            if (cover) {
                cover = booqImageUrl(id, cover)
            }
            return res.status(200).send({
                id, title, cover,
            })
        } else {
            return res.status(500).send('Failed to upload file')
        }
    })
}