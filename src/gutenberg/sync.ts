import { inspect } from 'util';
import { flatten, uniq } from 'lodash';
import { extractMetadata, ExtractedMetadata } from 'booqs-parser';
import { makeBatches, writeTempFile, resizeImage } from '../utils';
import { listObjects, downloadAsset, Asset, uploadAsset } from '../s3';
import { pgCards, PgCard } from './db';

const epubsBucket = 'pg-epubs';
const coversBucket = 'pg-covers';

export async function syncWithS3() {
    report('Syncing with S3');

    const batches = makeBatches(listEpubObjects(), 50);
    for await (const batch of batches) {
        await Promise.all(
            batch.map(processAsset),
        );
    }

    report('done syncing with S3');
}

async function processAsset(asset: Asset) {
    if (!asset.Key) {
        report('bad asset', asset);
        return;
    } else if (await recordExists(asset.Key)) {
        report(`Skipping ${asset.Key}`);
        return;
    }
    return downloadAndInsert(asset.Key);
}

async function recordExists(assetId: string) {
    return pgCards.exists({ assetId });
}

async function* listEpubObjects() {
    yield* listObjects(epubsBucket);
}

async function downloadAndInsert(assetId: string) {
    report(`Processing ${assetId}`);
    const asset = await downloadAsset(epubsBucket, assetId);
    if (!asset) {
        report(`Couldn't load pg asset: ${asset}`);
        return;
    }
    const fileName = await writeTempFile(asset);
    const { value, diags } = await extractMetadata(fileName, {
        extractCover: true,
    });
    if (diags.length > 0) {
        report(`Diagnostics while parsing ${assetId}`, diags);
    }
    if (!value) {
        report(`Couldn't parse metadata: ${assetId}`);
        return;
    }
    return insertRecord(value, assetId);
}

async function insertRecord({ metadata, cover }: ExtractedMetadata, assetId: string) {
    const index = indexFromAssetId(assetId);
    if (index === undefined) {
        report(`Invalid asset ig: ${assetId}`);
        return undefined;
    }
    const coverData = await uploadCover(cover, assetId);
    const {
        title, creator: author, subject, language, description,
        ...rest
    } = metadata;
    const doc: PgCard = {
        assetId,
        index,
        title: parseString(title),
        author: parseString(author),
        language: parseString(language),
        description: parseString(description),
        subjects: parseSubject(subject),
        meta: rest,
        ...coverData,
    };
    const [inserted] = await pgCards.insertMany([doc]);
    report('inserted', doc);
    return inserted;
}

async function uploadCover(coverBase64: string | undefined, assetId: string) {
    if (!coverBase64) {
        return {};
    }
    const cover = Buffer.from(coverBase64, 'base64');
    const originalId = `${assetId}-cover`;
    const originalResult = await uploadAsset(coversBucket, originalId, cover);
    if (originalResult.$response) {
        const size = 270;
        const resized = await resizeImage(cover, size);
        const resizedId = `${originalId}@${size}`;
        const resizedResult = await uploadAsset(coversBucket, resizedId, resized);
        if (resizedResult.$response) {
            return {
                cover: originalId,
                coverSizes: {
                    [size]: resizedId,
                },
            };
        } else {
            report(`Can't upload resized cover: ${resizedId}`);
            return { cover: originalId };
        }
    } else {
        report(`Can't upload original cover: ${originalId}`);
        return {};
    }
}

function parseString(field: unknown) {
    return typeof field === 'string'
        ? field : undefined;
}

function parseSubject(subject: unknown) {
    if (Array.isArray(subject)) {
        const subs = subject.map((s: string) => s.split(' -- '));
        const result = uniq(flatten(subs));
        return result;
    } else if (typeof subject === 'string') {
        return [subject];
    } else {
        return undefined;
    }
}

function indexFromAssetId(assetId: string) {
    const match = assetId.match(/^pg(\d+)/);
    if (match) {
        const indexString = match[1];
        const index = parseInt(indexString, 10);
        return isNaN(index) ? undefined : index;
    } else {
        return undefined;
    }
}

function report(label: string, data?: any) {
    console.log('PG: \x1b[32m%s\x1b[0m', label);
    if (data) {
        console.log(inspect(data, false, 3, true));
    }
}
