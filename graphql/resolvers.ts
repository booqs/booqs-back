import { IResolvers } from '@graphql-tools/utils'
import GraphQLJSON from 'graphql-type-json'
import { queryResolver } from './query'
import { mutationResolver } from './mutation'
import { collectionResolver } from './collection'
import { booqResolver } from './booq'
import { booqHistoryResolver } from './history'
import { bookmarkResolver } from './bookmark'
import { highlightResolver } from './highlight'
import { userResolver } from './user'
import { copilotResolver } from './copilot'
import { authorResolver } from './author'
import { GraphQLScalarType } from 'graphql'

export const resolvers: IResolvers = {
    ...queryResolver,
    ...mutationResolver,
    ...collectionResolver,
    ...booqResolver,
    ...authorResolver,
    ...booqHistoryResolver,
    ...bookmarkResolver,
    ...highlightResolver,
    ...userResolver,
    ...copilotResolver,
    BooqNode: namedJsonScalar('BooqNode'),
    WebAtuhnCredentialCreationOptions: namedJsonScalar('WebAtuhnCredentialCreationOptions'),
    WebAtuhnCredentialRequestOptions: namedJsonScalar('WebAtuhnCredentialRequestOptions'),
    WebAtuhnCredential: namedJsonScalar('WebAtuhnCredential'),
    WebAuthnRegistrationResponseJSON: namedJsonScalar('WebAuthnRegistrationResponseJSON'),
    WebAuthnAuthenticationResponseJSON: namedJsonScalar('WebAuthnAuthenticationResponseJSON'),
}

function namedJsonScalar(name: string,) {
    return new GraphQLScalarType({
        ...GraphQLJSON.toConfig(),
        name,
    })
}
