import { DbComment, collection } from './schema';


export async function forId(id: string): Promise<DbComment | undefined> {
    const comment = await collection.findOne({ id }).exec();
    return comment ?? undefined;
}

export async function forBooqId(booqId: string): Promise<DbComment[]> {
    return collection
        .find({ booqId })
        .exec();
}

export async function add(comment: DbComment) {
    const result = await collection.insertMany([comment]);

    return result?.length ? true : false;
}

export async function remove({
    userId, id,
}: Pick<DbComment, 'userId' | 'id'>) {
    const result = await collection
        .findOneAndDelete({ userId, id })
        .exec();

    return result ? true : false;
}

export async function update({
    userId, id, comment,
}: Pick<DbComment, 'userId' | 'id' | 'comment'>) {
    const result = await collection
        .findOneAndUpdate(
            { userId, id },
            { comment },
        )
        .exec();

    return result ? true : false;
}