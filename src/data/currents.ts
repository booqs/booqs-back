import { CurrentData, collection, DbUser } from './schema';
import { flatten } from 'lodash';

export type DbCurrent = CurrentData & {
    booqId: string,
    source: string,
};
export function userCurrents(user: DbUser): DbCurrent[] {
    const results = Object.entries(user.currents ?? {}).map(
        ([booqId, sourceData]) => Object.entries(sourceData).map(([source, data]) => ({
            booqId, source,
            ...data,
        })),
    );
    return flatten(flatten(results));
}

export async function addCurrent(
    userId: string,
    { booqId, source, ...data }: DbCurrent,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            [`currents.${booqId}.${source}`]: data,
        },
    ).exec();

    return result ? true : false;
}

export async function deleteCurrent(
    userId: string,
    { booqId }: Pick<DbCurrent, 'booqId'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $unset: {
                [`currents.${booqId}`]: '',
            },
        },
    ).exec();

    return result ? true : false;
}
