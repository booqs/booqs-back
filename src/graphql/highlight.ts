import { IResolvers } from 'apollo-server';
import { DbHighlight } from '../data';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
    },
};