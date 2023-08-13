import { highlights } from '../highlights'
import { uuSource } from '../uploads'
import { collection } from './schema'

export async function deleteForId(id: string): Promise<boolean> {
    let deleteUserPromise = (await collection).deleteOne({ _id: id }).exec()
    let deleteHighlightsPromise = highlights.removeAllForUserId(id)
    let deleteBooksPromise = uuSource.deleteAllBooksForUserId
        ? uuSource.deleteAllBooksForUserId(id) : Promise.resolve(true)

    let [deleteUserResult, deleteHighlightsResult, deleteBooksResult] = await Promise.all([
        deleteUserPromise, deleteHighlightsPromise, deleteBooksPromise,
    ])
    return deleteUserResult.deletedCount > 0 && deleteHighlightsResult && deleteBooksResult
}