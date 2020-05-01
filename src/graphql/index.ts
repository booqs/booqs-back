import { IResolvers } from 'apollo-server';
import { queryResolver } from './query';
import { mutationResolver } from './mutation';

export { typeDefs } from './typeDefs';
export { context } from './context';

export const resolvers: IResolvers = {
    ...queryResolver,
    ...mutationResolver,
};
