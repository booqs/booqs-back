import { syncWithS3 } from '../gutenberg';
import { prepareImagesWithBooq } from '../images';

export async function booqsWorker() {
    return pgSyncWorker();
}

async function pgSyncWorker() {
    for await (const { id, booq } of syncWithS3()) {
        prepareImagesWithBooq(`pg/${id}`, booq);
    }
}