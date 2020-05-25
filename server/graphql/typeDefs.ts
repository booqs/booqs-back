import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String!, provider: String!): AuthResult
    booq(id: ID!): Booq
    search(query: String!): [Booq]
    currents: [Current]
    collection(name: String!): Collection
    featured(limit: Int!): [Booq]
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
    uploadEpub(file: Upload!): Booq
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

type Booq {
    id: ID!
    title: String
    author: String
    cover(size: Int): String
    tags: [Tag]!
    bookmarks: [Bookmark]
    highlights: [Highlight]
    preview(path: [Int!], length: Int = 1500): String
    fragment(path: [Int!]): BooqFragment
    nodes: [BooqNode]
}

scalar BooqNode

type BooqFragment {
    previous: BooqAnchor
    current: BooqAnchor!
    next: BooqAnchor
    position: Int!
    nodes: [BooqNode]
}

type BooqAnchor {
    title: String
    path: [Int!]!
}

type BooqRange {
    start: [Int!]
    end: [Int!]
}

type Tag {
    tag: String!
    value: String
}
type AuthResult {
    token: String!
    name: String!
    profilePicture: String
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