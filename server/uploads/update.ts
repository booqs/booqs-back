import { deleteAsset } from '../s3'
import { userUploadedEpubsBucket, uuCards } from './schema'

export async function deleteAllBooksForUserId(userId: string) {
    let result = await (await uuCards).updateMany(
        {},
        { $pull: { users: userId } },
    ).exec()
    if (result.modifiedCount > 0) {
        return deleteAllBooksWithoutUsers()
    }
    return true
}

async function deleteAllBooksWithoutUsers() {
    let cards = await (await uuCards).find({ users: { $size: 0 } }).exec()
    let results = await Promise.all(cards.map(card => deleteBook(card)))
    return results.every(result => result)
}

async function deleteBook({ _id, assetId }: {
    _id: string,
    assetId: string,
}) {
    let s3promies = deleteAsset(userUploadedEpubsBucket, assetId)
    let dbPromise = (await uuCards).deleteOne({ _id }).exec()
    let [s3Result, dbResult] = await Promise.all([s3promies, dbPromise])
    return s3Result && dbResult.deletedCount === 1
}