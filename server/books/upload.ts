import { ReadStream } from 'fs';
import { userUploadsLib } from '../uploads';
import { userUploads, processCard } from './libSources';
import { prepareImagesWithBooq } from '../images';

export async function uploadEpub(fileStream: ReadStream, userId: string) {
    const result = await userUploadsLib.uploadEpub(fileStream, userId);
    if (result) {
        if (result.booq) {
            prepareImagesWithBooq(`uu/${result.card.id}`, result.booq);
        }
        return processCard(userUploads)(result.card);
    } else {
        return undefined;
    }
}
