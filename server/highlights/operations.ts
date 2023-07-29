import { DbHighlight, collection } from './schema'


export async function forId(id: string): Promise<DbHighlight | undefined> {
    const highlight = await collection.findOne({ id }).exec()
    return highlight ?? undefined
}

export async function forBooqId(booqId: string): Promise<DbHighlight[]> {
    return collection
        .find({ booqId })
        .exec()
}

export async function add(highlight: DbHighlight) {
    const result = await collection.insertMany([highlight])

    return result?.length ? true : false
}

export async function remove({
    userId, id,
}: Pick<DbHighlight, 'userId' | 'id'>) {
    const result = await collection
        .findOneAndDelete({ userId, id })
        .exec()

    return result ? true : false
}

export async function update({
    userId, id, group,
}: Pick<DbHighlight, 'userId' | 'id' | 'group'>) {
    const result = await collection
        .findOneAndUpdate(
            { userId, id },
            { group },
        )
        .exec()

    return result ? true : false
}