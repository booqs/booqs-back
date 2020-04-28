import { writeFile, mkdir, exists } from 'fs';
import { join } from 'path';
import { promisify, inspect } from 'util';
import { parseMetadata } from 'booqs-parser';
import { BooqMeta } from 'booqs-core';
import { log, uuid, makeBatches } from '../utils';
import { listObjects, AssetBody, downloadAsset, Asset } from '../s3';
import { pgCards, PgCard } from './db';

const bucket = 'pg-epub';

export async function syncWithS3() {
    log('PG: Syncing with S3');

    const batches = makeBatches(listEpubObjects(), 50);
    for await (const batch of batches) {
        await Promise.all(
            batch.map(processAsset),
        );
    }

    log('PG: done syncing with S3');
}

async function processAsset(asset: Asset) {
    if (!asset.Key) {
        log('PG: bad asset', asset);
        return;
    } else if (await recordExists(asset.Key)) {
        log(`PG: Skipping ${asset.Key}`);
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
    log(`PG: Processing ${assetId}`);
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
    log(`PG: inserted: ${inspect(doc)}`);
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
    const filePath = await tempPath();
    await promisify(writeFile)(filePath, body);
    return filePath;
}

async function tempPath() {
    const temp = 'tmp';
    if (!await promisify(exists)(temp)) {
        await promisify(mkdir)(temp, { recursive: true });
    }
    return join(temp, uuid());
}
