import multer from 'multer'
import { Express } from 'express'
import { fromCookie } from './auth'
import { uploadToSource } from './books'
import { addToCollection } from './users/collections'
import { parseCookies } from './cookie'
import { booqImageUrl } from './images'

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
        let { id, title, cover } = await uploadToSource('uu', req.file.buffer, user._id) ?? {}
        if (id) {
            let added = addToCollection(user._id, UPLOADS_COLLECTION, id)
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