import { pgCards, pgEpubsBucket } from './schema';
import { downloadAsset } from '../s3';
import { LibraryCard } from '../sources';

export async function cards(ids: string[]): Promise<LibraryCard[]> {
    return pgCards
        .find(
            { index: { $in: ids } },
            {
                index: true,
                title: true, author: true,
                language: true, subjects: true, description: true,
                meta: true, cover: true,
                length: true,
            },
        )
        .exec()
        .then(docs => docs.map(({
            index, title, author, language, subjects,
            description, meta, cover, length,
        }) => ({
            id: index,
            cover, title, author, language, subjects, description, meta,
            length,
        })));
}

export async function fileForId(id: string) {
    const doc = await pgCards.findOne({ index: id }).exec();
    if (!doc) {
        return undefined;
    } else {
        const asset = await downloadAsset(pgEpubsBucket, doc.assetId);
        return Buffer.isBuffer(asset)
            ? { kind: 'epub', file: asset } as const
            : undefined;
    }
}
