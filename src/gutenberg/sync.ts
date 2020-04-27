import { writeFile } from 'fs';
import { promisify } from 'util';
import { parseMetadata } from 'booqs-parser';
import { BooqMeta } from 'booqs-core';
import { log, uuid, makeBatches } from '../utils';
import { listObjects, AssetBody, downloadAsset, Asset } from '../s3';
import { pgCards, PgCard } from './db';

const bucket = 'pg-epub';

export async function syncWithS3() {
    const batches = makeBatches(listEpubObjects(), 50);
    for await (const batch of batches) {
        await Promise.all(
            batch.map(processAsset),
        );
    }
}

async function processAsset(asset: Asset) {
    if (!asset.Key) {
        log('PG: bad asset', asset);
        return;
    } else if (await exists(asset.Key)) {
        return;
    }
    return downloadAndInsert(asset.Key);
}

async function exists(assetId: string) {
    return pgCards.exists({ assetId });
}

async function* listEpubObjects() {
    yield* listObjects(bucket);
}

async function downloadAndInsert(assetId: string) {
    const asset = await downloadAsset(bucket, assetId);
    if (!asset) {
        log(`PG: Couldn't load pg asset: ${asset}`);
        return;
    }
    const fileName = await writeTempFile(asset);
    const { value: meta, diags } = await parseMetadata(fileName);
    if (diags.length > 0) {
        log(`PG: Diagnostics while parsing ${assetId}`, diags);
    }
    if (!meta) {
        log(`PG: Couldn't parse metadata: ${assetId}`);
        return;
    }
    return insertRecord(meta, assetId);
}

async function insertRecord(meta: BooqMeta, assetId: string) {
    const index = indexFromAssetId(assetId);
    if (index === undefined) {
        log(`PG: Invalid asset ig: ${assetId}`);
        return undefined;
    }
    const doc: PgCard = {
        title: typeof meta.title === 'string'
            ? meta.title : undefined,
        author: typeof meta.author === 'string'
            ? meta.author : undefined,
        assetId,
        meta,
        index,
    };
    const [inserted] = await pgCards.insertMany([doc]);
    return inserted;
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

async function writeTempFile(body: AssetBody) {
    const path = uuid();
    await promisify(writeFile)(path, body);
    return path;
}
