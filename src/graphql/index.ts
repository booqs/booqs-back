import { gql, IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken, fromHeader } from '../auth';
import { bookmarks } from '../data';

export const typeDefs = gql`
input BooqIdInput {
    source: String!
    id: String!
}
input BookmarkInput {
    booqId: BooqIdInput
}

type Query {
    auth(token: String, provider: String): AuthToken
    search(query: String): [Card]
    bookmarks(booqId: BooqIdInput): [Bookmark]
}
type Mutation {
    addBookmark(bm: BookmarkInput): HasUuid
}

type HasUuid {
    uuid: String
}
type BooqId {
    source: String!
    id: String!
}
type Bookmark {
    booqId: BooqId
    path: [Int!]!
    uuid: String
}
type Card {
    title: String
    author: String
}
type AuthToken {
    token: String
}
`;

export const resolvers: IResolvers = {
    Query: {
        async search(_, { query }) {
            const results = await pgLib.search(query, 100);
            return results;
        },
        async auth(_, { token, provider }) {
            const authToken = await getAuthToken({
                provider,
                token,
            });
            return { token: authToken };
        },
        async bookmarks(_, { booqId }, context) {
            return bookmarks.forBook(context.user?._id, booqId.id, booqId.source);
        },
    },
    Mutation: {
        async addBookmark(_, { bm }, context) {
            const result = await bookmarks.addBookmark(
                context.user?._id,
                {
                    uuid: '100',
                    bookId: bm.booqId.id,
                    bookSource: bm.booqId.source,
                    path: [1],
                },
            );
            console.log(result);
            return result;
        },
    },
    Bookmark: {
        booqId(parent) {
            return {
                id: parent.bookId,
                source: parent.bookSource,
            };
        },
    },
};

type Context = {
    req: {
        headers: {
            authorization?: string,
        },
    },
};
export async function context(context: Context) {
    const header = context.req.headers.authorization ?? '';
    let user = await fromHeader(header);
    // TODO: remove
    if (!user) {
        user = {
            _id: '000000000000000000000000',
            name: 'Incognito',
            joined: new Date(Date.now()),
            pictureUrl: undefined,
        };
    }
    return { user };
}
