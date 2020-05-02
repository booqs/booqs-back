import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String!, provider: String!): AuthToken
    booq(id: ID!): Booq
    search(query: String!): [Booq]
    bookmarks(booqId: ID!): [Bookmark]
    highlights(booqId: ID!): [Highlight]
    currents: [Current]
    collection(name: String!): Collection
}
type Mutation {
    addBookmark(bm: BookmarkInput!): Boolean
    removeBookmark(uuid: ID!): Boolean
    addHighlight(hl: HighlightInput!): Boolean
    removeHighlight(uuid: ID!): Boolean
    addCurrent(current: CurrentInput!): Boolean
    removeCurrent(booqId: ID!): Boolean
    addToCollection(name: String!, booqId: ID!): Boolean
    removeFromCollection(name: String!, booqId: ID!): Boolean
}

input BookmarkInput {
    uuid: ID
    booqId: ID!
    path: [Int!]!
}
input HighlightInput {
    uuid: ID
    booqId: ID!
    group: String!
    start: [Int!]
    end: [Int!]
}
input CurrentInput {
    booqId: ID!
    source: ID!
    path: [Int!]!
}

type BooqRange {
    start: [Int!]
    end: [Int!]
}

type Booq {
    id: ID!
    title: String
    author: String
}
type AuthToken {
    token: String
}
type Bookmark {
    uuid: ID
    booqId: ID
    path: [Int!]
}
type Highlight {
    uuid: ID
    booqId: ID
    range: BooqRange
    group: String
}
type Current {
    booqId: ID
    path: [Int!]
    source: String
}
type Collection {
    booqs: [Booq!]
}
`;