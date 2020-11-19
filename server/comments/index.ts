import { forBooqId, add, remove, update } from './operations';
import { DbComment } from './schema';

export { DbComment };
export const comments = {
    forBooqId, add, update, remove,
};
