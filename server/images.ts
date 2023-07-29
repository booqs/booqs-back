import * as sharp from 'sharp';
import { Booq } from '../core';
import { uploadAsset } from './s3';

const bucket = 'booqs-images';
const coverSizes = [60, 120, 210];

export function booqImageUrl(booqId: string, src: string, size?: number) {
    const base = `https://${bucket}.s3.amazonaws.com/${booqId}/${src}`;
    return size ? `${base}@${size}` : base;
}

export async function uploadBooqImages(booqId: string, booq: Booq) {
    const allImages = Object.entries(booq.images).map(
        ([src, base64]) => uploadImage(base64, booqId, src),
    );
    if (typeof booq.meta.cover === 'string') {
        const coverSrc = booq.meta.cover;
        const coverBuffer = booq.images[coverSrc];
        if (coverBuffer) {
            const covers = coverSizes.map(
                size => uploadImage(coverBuffer, booqId, coverSrc, size),
            );
            return Promise.all([...covers, ...allImages]);
        }
    }
    return Promise.all(allImages);
}

async function uploadImage(base64: string, booqId: string, src: string, size?: number) {
    const id = size
        ? `${booqId}/${src}@${size}`
        : `${booqId}/${src}`;
    const buffer = Buffer.from(base64, 'base64');
    const toUpload = size
        ? await resizeImage(buffer, size)
        : buffer;
    const result = await uploadAsset(bucket, id, toUpload);
    return result.$metadata
        ? id
        : undefined;
}

async function resizeImage(buffer: Buffer, height: number): Promise<Buffer> {
    return sharp(buffer)
        .resize({
            height,
            fit: 'cover',
        })
        .toBuffer();
}
