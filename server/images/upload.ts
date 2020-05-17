import * as sharp from 'sharp';
import { uploadAsset } from '../s3';

const bucket = 'booqs-images';

export async function uploadImage(base64: string, booqId: string, src: string, size?: number) {
    const id = size
        ? `${booqId}/${src}@${size}`
        : `${booqId}/${src}`;
    const buffer = Buffer.from(base64, 'base64');
    const toUpload = size
        ? await resizeImage(buffer, size)
        : buffer;
    const result = await uploadAsset(bucket, id, toUpload);
    return result.$response
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
