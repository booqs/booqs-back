import { inspect } from 'util';
import { flatten, uniq } from 'lodash';
import { Booq, nodesLength, filterUndefined } from '../../core';
import { parseEpub, Diagnostic } from '../../parser';
import { makeBatches } from '../utils';
import { listObjects, downloadAsset, Asset } from '../s3';
import { logExists, logItem } from '../log';
import { pgCards, DbPgCard, pgEpubsBucket } from './schema';

export async function* syncWithS3() {
    report('Syncing with S3');

    const batches = makeBatches(assetsToProcess(), 5);
    for await (const batch of batches) {
        const added = await Promise.all(
            batch.map(processAsset),
        );
        yield* filterUndefined(added);
    }

    report('done syncing with S3');
}

async function* assetsToProcess() {
    for await (const asset of listEpubObjects()) {
        if (!asset.Key) {
            report('bad asset', asset);
            continue;
        } if (await recordExists(asset.Key)) {
            continue;
        } else if (await hasProblems(asset.Key)) {
            report('skipping asset with problems', asset.Key);
            continue;
        }
        yield asset;
    }
}

async function processAsset(asset: Asset) {
    if (!asset.Key) {
        report('bad asset', asset);
        return;
    }
    try {
        const result = await downloadAndInsert(asset.Key);
        return result;
    } catch (e) {
        report(`Promise rejection ${asset.Key}: ${e}`);
        logProblem(asset.Key, 'Unhandled exception', e);
        return;
    }
}

async function recordExists(assetId: string) {
    return pgCards.exists({ assetId });
}

async function hasProblems(assetId: string) {
    return logExists({
        kind: 'pg-sync',
        id: assetId,
    });
}

async function logProblem(assetId: string, message: string, err: any) {
    return logItem({
        kind: 'pg-sync',
        message,
        id: assetId,
        data: err,
    });
}

async function* listEpubObjects() {
    yield* listObjects(pgEpubsBucket);
}

async function downloadAndInsert(assetId: string) {
    report(`Processing ${assetId}`);
    const asset = await downloadAsset(pgEpubsBucket, assetId);
    if (!asset) {
        report(`Couldn't load pg asset: ${assetId}`);
        return;
    }
    const diags: Diagnostic[] = [];
    const booq = await parseEpub({
        fileData: asset as any,
        diagnoser: diag => diags.push(diag),
    });
    if (!booq) {
        report(`Couldn't parse epub: ${assetId}`);
        await logProblem(assetId, 'Parsing errors', diags);
        return;
    }
    const document = await insertRecord(booq, assetId);
    if (document) {
        return {
            id: document.index,
            booq,
        };
    } else {
        return undefined;
    }
}

async function insertRecord(booq: Booq, assetId: string) {
    const index = indexFromAssetId(assetId);
    if (index === undefined) {
        report(`Invalid asset id: ${assetId}`);
        await logProblem(assetId, 'Bad asset id', assetId);
        return undefined;
    }
    const {
        title, creator: author, subject, language, description, cover,
        ...rest
    } = booq.meta;
    const length = nodesLength(booq.nodes);
    const doc: DbPgCard = {
        assetId,
        index,
        length,
        title: parseString(title),
        author: parseString(author),
        language: parseString(language),
        description: parseString(description),
        subjects: parseSubject(subject),
        cover: parseString(cover),
        meta: rest,
    };
    const [inserted] = await pgCards.insertMany([doc]);
    report('inserted', inserted);
    return inserted;
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
        return isNaN(index) ? undefined : indexString;
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
