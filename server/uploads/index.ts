import { search } from './search';
import { cards, fileForId } from './lookup';
import { uploadEpub } from './upload';
import { userUploadedImagesBucket } from './schema';

export const userUploadsLib = {
    search, cards, fileForId,
    uploadEpub,
};

export const userUploadsImagesRoot = `https://${userUploadedImagesBucket}.s3.amazonaws.com`;

