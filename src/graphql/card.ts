import { IResolvers } from 'apollo-server';
import { DbPgCard } from '../gutenberg';

export type CardParent = DbPgCard;
export const cardResolver: IResolvers<CardParent> = {
    Card: {
        title(parent) {
            return parent.title;
        },
        author(parent) {
            return parent.author;
        },
    },
};
