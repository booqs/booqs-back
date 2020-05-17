import { Booq } from '../../core';
import { uploadBooqImages } from './upload';
import { isAlreadyPrepared, markAsPrepared } from './mark';
export { booqImageUrl } from './upload';

export async function prepareImagesWithBooq(booqId: string, booq: Booq) {
    if (await isAlreadyPrepared(booqId)) {
        return;
    }

    await uploadBooqImages(booq, booqId);

    markAsPrepared(booqId);
}
