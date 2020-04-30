import { gql } from 'apollo-server';
import { importSchema } from 'graphql-import';

const schemaContent = importSchema('src/graphql/schema.graphql');
export const typeDefs = gql`${schemaContent}`;
