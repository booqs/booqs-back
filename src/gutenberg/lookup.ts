import { collection } from './schema';

export async function forId(id: string) {
    return collection.findById(id);
}

export async function forIds(ids: string[]) {
    return collection
        .find({ _id: { $in: ids } })
        .exec()
        .then(docs => docs.map(doc => ({
            ...doc,
            id: doc.index,
        })));
}
