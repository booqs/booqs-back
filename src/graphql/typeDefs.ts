import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String!, provider: String!): AuthToken
    search(query: String!): [Card]
    bookmarks(booqId: ID!): [Bookmark]
    highlights(booqId: ID!): [Highlight]
    currents: [Current]
    collection(name: String!): Collection
}
type Mutation {
    addBookmark(bm: BookmarkInput!): Boolean
    addHighlight(hl: HighlightInput!): Boolean
    addCurrent(current: CurrentInput!): Boolean
    addToCollection(name: String!, booqId: ID!): Boolean
}

input BookmarkInput {
    uuid: String
    booqId: ID!
    path: [Int!]!
}
input HighlightInput {
    uuid: String
    booqId: ID!
    group: String!
    start: [Int!]
    end: [Int!]
}
input CurrentInput {
    booqId: ID!
    source: String!
    path: [Int!]!
}

type BooqRange {
    start: [Int!]
    end: [Int!]
}

type Card {
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
    books: [Card!]
}
`;