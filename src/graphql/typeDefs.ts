import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String, provider: String): AuthToken
    search(query: String): [Card]
    bookmarks(booqId: BooqIdInput): [Bookmark]
    highlights(booqId: BooqIdInput): [Highlight]
    currents: [Current]
}
type Mutation {
    addBookmark(bm: BookmarkInput): HasUuid
    addHighlight(hl: HighlightInput): HasUuid
}

input BooqIdInput {
    id: String!
    source: String!
}
input BookmarkInput {
    booqId: BooqIdInput
    path: [Int!]!
    uuid: String
}
input HighlightInput {
    booqId: BooqIdInput
    group: String!
    start: [Int!]
    end: [Int!]
    uuid: String!
}

type HasUuid {
    uuid: String
}
type BooqId {
    source: String!
    id: String!
}
type BooqRange {
    start: [Int!]
    end: [Int!]
}

type Bookmark {
    uuid: String
    booqId: BooqId
    path: [Int!]
}
type Highlight {
    uuid: String
    booqId: BooqId
    range: BooqRange
    group: String
}
type Current {
    booqId: BooqId
    path: [Int!]
    source: String
}
type Card {
    title: String
    author: String
}
type AuthToken {
    token: String
}
`;