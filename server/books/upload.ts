import { ReadStream } from 'fs';
import { processCard, sources } from './libSources';
import { uploadBooqImages } from '../images';

export async function uploadToSource(sourcePrefix: string, fileStream: ReadStream, userId: string) {
    const uploadEpub = sources[sourcePrefix]?.uploadEpub;
    if (uploadEpub) {
        const result = await uploadEpub(fileStream, userId);
        if (result) {
            if (result.booq) {
                uploadBooqImages(`${sourcePrefix}/${result.card.id}`, result.booq);
            }
            return processCard(sourcePrefix)(result.card);
        }
    }
    return undefined;
}
