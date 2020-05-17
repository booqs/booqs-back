import { syncWithS3 } from '../gutenberg';
import { uploadBooqImages } from '../images';

export async function booqsWorker() {
    return pgSyncWorker();
}

async function pgSyncWorker() {
    for await (const { id, booq } of syncWithS3()) {
        uploadBooqImages(`pg/${id}`, booq);
    }
}