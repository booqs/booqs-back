import { createHash } from 'crypto';
import { ReadStream } from 'fs';
import { inspect } from 'util';
import {
    uuCards, uuRegistry, DbUpload, DbUuCard,
    userUploadedEpubsBucket, userUploadedImagesBucket, toLibraryCard,
} from './schema';
import { parseEpub } from '../../parser';
import { booqLength, Booq } from '../../core';
import { uploadAsset } from '../s3';
import { uuid } from '../utils';
import { uploadImages } from '../images';
import { LibraryCard } from '../sources';

export async function uploadEpub(fileStream: ReadStream, userId: string): Promise<LibraryCard | undefined> {
    const { buffer, hash } = await buildFile(fileStream);
    const existing = await uuCards.findOne({ fileHash: hash }).exec();
    if (existing) {
        await addToRegistry(existing._id, userId);
        return toLibraryCard(existing);
    }

    const booq = await parseEpub({
        fileData: buffer,
        diagnoser: diag => report(diag.diag, diag.data),
    });
    if (!booq) {
        report('Can\'t parse upload');
        return undefined;
    }
    const assetId = uuid();
    const uploadResult = await uploadAsset(userUploadedEpubsBucket, assetId, buffer);
    if (!uploadResult.$response) {
        report('Can\'t upload file to S3');
        return undefined;
    }
    const insertResult = await insertRecord(booq, assetId, hash);
    const uploadImagesResult = await uploadImages(userUploadedImagesBucket, insertResult._id, booq);
    uploadImagesResult.map(id => report(`Uploaded image: ${id}`));
    return toLibraryCard(insertResult);
}

async function insertRecord(booq: Booq, assetId: string, fileHash: string) {
    const {
        title, creator: author, subject, language, description, cover,
        ...rest
    } = booq.meta;
    const subjects = typeof subject === 'string' ? [subject]
        : Array.isArray(subject) ? subject
            : [];
    const length = booqLength(booq);
    const doc: DbUuCard = {
        assetId,
        length,
        fileHash,
        subjects,
        title: parseString(title),
        author: parseString(author),
        language: parseString(language),
        description: parseString(description),
        cover: parseString(cover),
        meta: rest,
    };
    const [inserted] = await uuCards.insertMany([doc]);
    report('inserted', inserted);
    return inserted;
}

async function addToRegistry(cardId: string, userId: string) {
    const doc: DbUpload = {
        userId,
        cardId,
    };
    const [result] = await uuRegistry.insertMany([doc]);
    return result;
}

type File = {
    buffer: Buffer,
    hash: string,
};
async function buildFile(fileStream: ReadStream) {
    return new Promise<File>((resolve, reject) => {
        try {
            const hash = createHash('md5');
            const chunks: any[] = [];

            fileStream.on('data', chunk => {
                hash.update(chunk);
                chunks.push(chunk);
            });
            fileStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    buffer,
                    hash: hash.digest('base64'),
                });
            });
        } catch (e) {
            reject(e);
        }
    });
}

function parseString(field: unknown) {
    return typeof field === 'string'
        ? field : undefined;
}

function report(label: string, data?: any) {
    console.log('UU: \x1b[32m%s\x1b[0m', label);
    if (data) {
        console.log(inspect(data, false, 3, true));
    }
}
