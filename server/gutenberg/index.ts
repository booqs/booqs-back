import { search } from './search';
import { cards, fileForId } from './lookup';
import { pgImagesBucket } from './schema';

export * from './sync';

export const pgLib = {
    search, cards, fileForId,
};

export const pgImagesRoot = `https://${pgImagesBucket}.s3.amazonaws.com`;
