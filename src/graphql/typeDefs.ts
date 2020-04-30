import { gql } from 'apollo-server';

export const typeDefs = gql`
input BooqIdInput {
    source: String!
    id: String!
}
input BookmarkInput {
    booqId: BooqIdInput
    path: [Int!]!
    uuid: String
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
