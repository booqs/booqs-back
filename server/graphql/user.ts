import { IResolvers } from 'apollo-server';
import { DbUser } from '../users';

export type UserParent = DbUser & { _id: string };
export const userResolver: IResolvers<UserParent> = {
    User: {
        id(parent) {
            return parent._id;
        },
    },
};
