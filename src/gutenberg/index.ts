import { search } from './search';
import { cards, fileForId } from './lookup';

export * from './sync';

export const pgLib = {
    search, cards, fileForId,
};
