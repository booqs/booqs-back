import { IResolvers } from 'apollo-server';
import { LibraryCard } from '../books';
import { userBookmarks, userHighlights } from '../data';

export type BooqParent = LibraryCard;
export const booqResolver: IResolvers<BooqParent> = {
    Booq: {
        async bookmarks(parent, _, { user }) {
            return user
                ? userBookmarks(user, parent.id)
                : [];
        },
        async highlights(parent, _, { user }) {
            return user
                ? userHighlights(user, parent.id)
                : [];
        },
    },
};
