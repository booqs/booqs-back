import { gql } from 'apollo-server';
export const typeDefs = gql`
type Query {
    auth(token: String, provider: String): AuthToken
    search(query: String): [Card]
    bookmarks(booqId: ID): [Bookmark]
    highlights(booqId: ID): [Highlight]
    currents: [Current]
}
type Mutation {
    addBookmark(bm: BookmarkInput): Boolean
    addHighlight(hl: HighlightInput): Boolean
}

input BookmarkInput {
    booqId: ID
    path: [Int!]!
    uuid: String
}
input HighlightInput {
    booqId: ID
    group: String!
    start: [Int!]
    end: [Int!]
    uuid: String!
}

type BooqRange {
    start: [Int!]
    end: [Int!]
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
type Card {
    title: String
    author: String
}
type AuthToken {
    token: String
}
`;