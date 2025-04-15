import { flatten } from 'lodash'
import { BooqHistoryData, collection, DbUser } from './schema'

export type DbBooqHistory = BooqHistoryData & {
    booqId: string,
    source: string,
}
export function userBooqHistory(user: DbUser): DbBooqHistory[] {
    const results = Object.entries(user.history ?? {}).map(
        ([booqId, sourceData]) => Object.entries(sourceData).map(([source, data]) => ({
            booqId, source,
            ...data,
        })),
    )
    const flat = flatten(flatten(results))
    const sorted = flat.sort((a, b) => b.date.valueOf() - a.date.valueOf())
    return sorted
}

export async function addBooqHistory(
    userId: string,
    { booqId, source, ...data }: DbBooqHistory,
) {
    const result = await (await collection).findByIdAndUpdate(
        userId,
        {
            [`history.${booqId}.${source}`]: data,
        },
    ).exec()

    return result ? true : false
}

export async function deleteBooqHistory(
    userId: string,
    { booqId }: Pick<DbBooqHistory, 'booqId'>,
) {
    const result = await (await collection).findByIdAndUpdate(
        userId,
        {
            $unset: {
                [`history.${booqId}`]: '',
            },
        },
    ).exec()

    return result ? true : false
}
