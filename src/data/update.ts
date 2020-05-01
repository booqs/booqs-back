import {
    DbCurrent,
    collection,
} from './schema';

export async function addCurrent(
    userId: string,
    element: DbCurrent,
) {
    let result = await collection.update(
        {
            _id: userId,
            'currents.booqId': element.booqId,
            'currents.source': element.source,
        },
        {
            $set: {
                'currents.$.path': element.path,
                'currents.$.date': element.date,
            },
        },
    ).exec();
    if (!result.nModified) {
        result = await collection.findByIdAndUpdate(
            userId,
            { $push: { currents: element } },
        ).exec();
    }

    return result ? true : false;
}

export async function deleteCurrent(
    userId: string,
    element: Pick<DbCurrent, 'booqId'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        { $pull: { currents: element } },
    ).exec();

    return result ? true : false;
}
