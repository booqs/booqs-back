import { DbHighlight, collection } from './schema'


export async function forId(id: string): Promise<DbHighlight | undefined> {
    const highlight = await (await collection).findOne({ id }).exec()
    return highlight ?? undefined
}

export async function forBooqId(booqId: string): Promise<DbHighlight[]> {
    return (await collection)
        .find({ booqId })
        .exec()
}

export async function add(highlight: Omit<DbHighlight, '_id'>) {
    const result = await (await collection).insertMany([highlight])

    return result?.length ? true : false
}

export async function remove({
    userId, id,
}: Pick<DbHighlight, 'userId' | 'id'>) {
    const result = await (await collection)
        .findOneAndDelete({ userId, id })
        .exec()

    return result ? true : false
}

export async function update({
    userId, id, group,
}: Pick<DbHighlight, 'userId' | 'id' | 'group'>) {
    const result = await (await collection)
        .findOneAndUpdate(
            { userId, id },
            { group },
        )
        .exec()

    return result ? true : false
}

export async function removeAllForUserId(id: string) {
    try {
        await (await collection)
            .deleteMany({ userId: id })
            .exec()
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}