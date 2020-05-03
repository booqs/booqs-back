import { collection, epubsBucket } from './schema';
import { downloadAsset } from '../s3';

export async function cards(ids: string[]) {
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

export async function fileForId(id: string) {
    const doc = await collection.findOne({ index: id }).exec();
    if (!doc) {
        return undefined;
    } else {
        const asset = await downloadAsset(epubsBucket, doc.assetId);
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined;
    }
}
