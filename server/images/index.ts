import { Booq } from '../../core';
import { booqForId } from '../books';
import { uploadImage } from './upload';
import { isAlreadyPrepared, markAsPrepared } from './mark';

const coverSizes = [60, 120, 210];
export async function prepareImages(booqId: string) {
    if (await isAlreadyPrepared(booqId)) {
        return;
    }

    const booq = await booqForId(booqId);
    if (booq) {
        await uploadBooqImages(booq, booqId);
    }

    markAsPrepared(booqId);
}

async function uploadBooqImages(booq: Booq, booqId: string) {
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
