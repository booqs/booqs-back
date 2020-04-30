import { IResolvers } from 'apollo-server';
import { DbBookmark } from '../data';

export type BookmarkParent = DbBookmark;
export const bookmarkResolver: IResolvers<BookmarkParent> = {
};
