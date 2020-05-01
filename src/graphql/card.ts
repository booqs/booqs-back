import { IResolvers } from 'apollo-server';
import { Card } from '../books';

export type CardParent = Card;
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
