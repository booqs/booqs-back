import { DbHighlight, collection } from './schema';


export async function forId(uuid: string): Promise<DbHighlight | undefined> {
    const highlight = await collection.findOne({ uuid }).exec();
    return highlight ?? undefined;
}

export async function forBooqId(booqId: string): Promise<DbHighlight[]> {
    return collection
        .find({ booqId })
        .exec();
}

export async function add(highlight: DbHighlight) {
    const result = await collection.insertMany([highlight]);

    return result?.length ? true : false;
}

export async function remove({
    userId, uuid,
}: Pick<DbHighlight, 'userId' | 'uuid'>) {
    const result = await collection
        .findOneAndDelete({ userId, uuid })
        .exec();

    return result ? true : false;
}

export async function update({
    userId, uuid, group,
}: Pick<DbHighlight, 'userId' | 'uuid' | 'group'>) {
    const result = await collection
        .findOneAndUpdate(
            { userId, uuid },
            { group },
        )
        .exec();

    return result ? true : false;
}