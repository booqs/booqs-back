import { IResolvers } from 'apollo-server';
import GraphQLJSON from 'graphql-type-json';
import { queryResolver } from './query';
import { mutationResolver } from './mutation';
import { collectionResolver } from './collection';
import { booqResolver } from './booq';
import { currentResolver } from './current';
import { bookmarkResolver } from './bookmark';
import { highlightResolver } from './highlight';

export { typeDefs } from './typeDefs';
export { context } from './context';

export const resolvers: IResolvers = {
    ...queryResolver,
    ...mutationResolver,
    ...collectionResolver,
    ...booqResolver,
    ...currentResolver,
    ...bookmarkResolver,
    ...highlightResolver,
    BooqNode: GraphQLJSON,
};
