import { Booq } from '../../core';
import { booqForId } from '../books';
import { uploadBooqImages } from './upload';
import { isAlreadyPrepared, markAsPrepared } from './mark';
export { booqImageUrl } from './upload';

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

export async function prepareImagesWithBooq(booqId: string, booq: Booq) {
    if (await isAlreadyPrepared(booqId)) {
        return;
    }

    await uploadBooqImages(booq, booqId);

    markAsPrepared(booqId);
}
