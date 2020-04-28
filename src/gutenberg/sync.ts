import { inspect } from 'util';
import { parseMetadata } from 'booqs-parser';
import { BooqMeta } from 'booqs-core';
import { makeBatches, writeTempFile } from '../utils';
import { listObjects, downloadAsset, Asset } from '../s3';
import { pgCards, PgCard } from './db';

const bucket = 'pg-epub';

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
    yield* listObjects(bucket);
}

async function downloadAndInsert(assetId: string) {
    report(`Processing ${assetId}`);
    const asset = await downloadAsset(bucket, assetId);
    if (!asset) {
        report(`Couldn't load pg asset: ${asset}`);
        return;
    }
    const fileName = await writeTempFile(asset);
    const { value: meta, diags } = await parseMetadata(fileName);
    if (diags.length > 0) {
        report(`Diagnostics while parsing ${assetId}`, diags);
    }
    if (!meta) {
        report(`Couldn't parse metadata: ${assetId}`);
        return;
    }
    return insertRecord(meta, assetId);
}

async function insertRecord(meta: BooqMeta, assetId: string) {
    const index = indexFromAssetId(assetId);
    if (index === undefined) {
        report(`Invalid asset ig: ${assetId}`);
        return undefined;
    }
    const {
        title, creator: author, subject, language, description,
        ...rest
    } = meta;
    const doc: PgCard = {
        assetId,
        index,
        title: parseString(title),
        author: parseString(author),
        language: parseString(language),
        description: parseString(description),
        subjects: parseSubject(subject),
        meta: rest,
    };
    const [inserted] = await pgCards.insertMany([doc]);
    report(`inserted: ${inspect(doc)}`);
    return inserted;
}

function parseString(field: unknown) {
    return typeof field === 'string'
        ? field : undefined;
}

function parseSubject(subject: unknown) {
    if (Array.isArray(subject)) {
        return subject;
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
    console.log('PG:', inspect(label, true, 3, true));
    if (data) {
        console.log(inspect(data, true, 3, true));
    }
}
