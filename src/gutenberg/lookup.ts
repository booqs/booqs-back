import { collection } from './schema';

export async function forId(id: string) {
    return collection.findById(id);
}

export async function forIds(ids: string[]) {
    return collection
        .find(
            { index: { $in: ids } },
            {
                index: true,
                title: true, author: true,
                language: true, subjects: true, description: true,
                meta: true,
                cover: true, coverSizes: true,
            },
        )
        .exec()
        .then(docs => docs.map(({
            index, title, author, language, subjects,
            description, meta, cover, coverSizes,
        }) => ({
            id: index,
            title, author, language, subjects, description, meta,
            cover, coverSizes,
        })));
}
