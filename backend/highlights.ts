import { typedModel, TypeFromSchema } from './mongoose'

const schema = {
    id: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    booqId: {
        type: String,
        required: true,
    },
    start: {
        type: [Number],
        required: true,
    },
    end: {
        type: [Number],
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
} as const
const collection = typedModel('highlights', schema)
export type DbHighlight = TypeFromSchema<typeof schema>



export async function highlightForId(id: string): Promise<DbHighlight | undefined> {
    const highlight = await (await collection).findOne({ id }).exec()
    return highlight ?? undefined
}

export async function highlightsForBooqId(booqId: string): Promise<DbHighlight[]> {
    return (await collection)
        .find({ booqId })
        .exec()
}

export async function addHighlight(highlight: Omit<DbHighlight, '_id'>) {
    const result = await (await collection).insertMany([highlight])

    return result?.length ? true : false
}

export async function removeHighlight({
    userId, id,
}: Pick<DbHighlight, 'userId' | 'id'>) {
    const result = await (await collection)
        .findOneAndDelete({ userId, id })
        .exec()

    return result ? true : false
}

export async function updateHighlight({
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

export async function removeAllHighlightsForUserId(id: string) {
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
