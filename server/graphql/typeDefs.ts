import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String!, provider: String!, name: String): AuthResult
    logout: Boolean
    me: User
    booq(id: ID!): Booq
    search(query: String!, limit: Int): [Booq]
    history: [BooqHistory]
    collection(name: String!): Collection
    featured(limit: Int!): [Booq]
}
type Mutation {
    addBookmark(bookmark: BookmarkInput!): Boolean
    removeBookmark(id: ID!): Boolean
    addHighlight(highlight: HighlightInput!): Boolean
    removeHighlight(id: ID!): Boolean
    updateHighlight(id: ID!, group: String): Boolean
    addBooqHistory(event: BooqHistoryInput!): Boolean
    removeBooqHistory(booqId: ID!): Boolean
    addToCollection(name: String!, booqId: ID!): Boolean
    removeFromCollection(name: String!, booqId: ID!): Boolean
    uploadEpub(file: Upload!, source: String!): Booq
}

type Booq {
    id: ID!
    title: String
    author: String
    length: Int
    cover(size: Int): String
    tags: [Tag]!
    bookmarks: [Bookmark]
    highlights: [Highlight]
    preview(path: [Int!], length: Int = 500): String
    fragment(path: [Int!]): BooqFragment
    nodes: [BooqNode]
    tableOfContents: [TocItem!]
}

type User {
    id: ID!
    name: String
    pictureUrl: String
}

input BookmarkInput {
    id: ID
    booqId: ID!
    path: [Int!]!
}
input HighlightInput {
    id: ID
    booqId: ID!
    group: String!
    start: [Int!]
    end: [Int!]
}
input BooqHistoryInput {
    booqId: ID!
    source: ID!
    path: [Int!]!
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

type TocItem {
    path: [Int!]!
    position: Int!
    title: String!
    level: Int!
}

type Tag {
    tag: String!
    value: String
}
type AuthResult {
    token: String!
    user: User
}
type Bookmark {
    booq: Booq
    id: ID
    path: [Int!]
}
type Highlight {
    author: User
    booq: Booq
    id: ID
    start: [Int!]!
    end: [Int!]!
    group: String
    text: String
    position: Int
}
type BooqHistory {
    booq: Booq!
    path: [Int!]!
    source: String
    preview(length: Int = 500): String
    position: Int!
}
type Collection {
    booqs: [Booq!]
}
`;