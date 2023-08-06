import mongoose from 'mongoose'
import { uuCards, userUploadedEpubsBucket } from './schema'
import { downloadAsset } from '../s3'
import { LibraryCard } from '../sources'

export async function cards(ids: string[]): Promise<LibraryCard[]> {
    return (await uuCards)
        .find(
            { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
            {
                index: true,
                title: true, author: true,
                language: true, subjects: true, description: true,
                meta: true, cover: true,
                length: true,
            },
        )
        .exec()
        .then(docs => docs.map(({
            _id, title, author, language, subjects,
            description, meta, cover, length,
        }) => ({
            id: _id,
            title, author, language, subjects, description, meta,
            cover, length,
        })))
}

export async function fileForId(id: string) {
    const doc = await (await uuCards).findOne({ _id: id }).exec()
    if (!doc) {
        return undefined
    } else {
        const asset = await downloadAsset(userUploadedEpubsBucket, doc.assetId)
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined
    }
}
