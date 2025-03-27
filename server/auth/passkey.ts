import { config } from '../config'
import { RequestOrigin } from '../graphql'
import { taggedObject, typedModel } from '../mongoose'
import { users } from '../users'
import {
    generateRegistrationOptions, verifyRegistrationResponse,
    generateAuthenticationOptions, verifyAuthenticationResponse,
    RegistrationResponseJSON, AuthenticationResponseJSON, WebAuthnCredential,
} from '@simplewebauthn/server'

export async function initiatePasskeyRegistration({
    requestOrigin,
}: {
    requestOrigin?: RequestOrigin,
}) {
    const user = await users.createUser({})
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    const options = await generateRegistrationOptions({
        rpName: config().appName,
        rpID,
        userID: new TextEncoder().encode(user._id),
        userName: user.username,
        timeout: 60000,
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
        },
    })

    await saveChallengeForUser({
        userId: user._id,
        challenge: options.challenge,
        kind: 'registration',
    })

    return {
        success: true as const,
        options,
    }
}

export async function verifyPasskeyRegistration({
    userId, response, requestOrigin,
}: {
    userId: string,
    response: RegistrationResponseJSON, // The credential JSON received from the client
    requestOrigin?: RequestOrigin,
}) {
    // Retrieve the original challenge we generated for this user
    const expectedChallenge = await getChallengeForUser({ userId, kind: 'registration' })
    if (!expectedChallenge) {
        return {
            error: 'Registration challenge not found or expired',
            success: false as const,
        }
    }

    const expectedOrigin = requestOrigin === 'localhost'
        ? config().origins.secureLocalhost
        : config().origins.production
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: true,
    })

    const { verified, registrationInfo } = verification
    if (!verified || !registrationInfo) {
        return {
            error: 'Registration verification failed',
            success: false as const,
        }
    }

    await saveUserCredential({
        userId: userId,
        credential: registrationInfo.credential,
    })

    // Invalidate or clear the stored challenge as it's used up
    await invalidateChallengeForUser({
        userId, kind: 'registration',
    })

    return {
        success: true as const,
        credential: registrationInfo.credential,
    }
}

export async function initiatePasskeyLogin({
    credentialId,
    requestOrigin,
}: {
    credentialId: string,
    requestOrigin?: RequestOrigin,
}) {
    const record = await getCredentialRecordByCredentialId(credentialId)
    if (!record || !record.userId) {
        return {
            error: 'Credential ID not registered',
            success: false as const,
        }
    }
    const userId = record.userId
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    const options = await generateAuthenticationOptions({
        timeout: 60000,
        rpID,
        userVerification: 'preferred',
    })

    // Store the challenge for this login attempt
    await saveChallengeForUser({
        userId,
        challenge: options.challenge,
        kind: 'login',
    })

    return {
        success: true as const,
        options,
    }
}

export async function verifyPasskeyLogin({
    response, requestOrigin,
}: {
    response: AuthenticationResponseJSON, // The credential assertion JSON received from the client
    requestOrigin?: RequestOrigin,
}) {
    const credentialId = response.id
    const record = await getCredentialRecordByCredentialId(credentialId)
    if (!record || !record.userId) {
        return {
            error: 'Credential ID not registered',
            success: false as const,
        }
    }
    const userId = record.userId

    // Retrieve expected challenge
    const expectedChallenge = await getChallengeForUser({
        userId, kind: 'login',
    })
    if (!expectedChallenge) {
        return {
            error: 'Authentication challenge not found or expired',
            success: false as const,
        }
    }

    const userCredentials = record.credentials ?? []
    const matchingCredential = userCredentials.find(c => c.id === credentialId)
    if (!matchingCredential) {
        return {
            error: 'Credential ID not registered for this user',
            success: false as const,
        }
    }

    const expectedOrigin = requestOrigin === 'localhost'
        ? config().origins.secureLocalhost
        : config().origins.production
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        credential: matchingCredential,
        requireUserVerification: true,
    })

    const { verified, authenticationInfo } = verification
    if (!verified || !authenticationInfo) {
        return {
            error: 'Authentication verification failed',
            success: false as const,
        }
    }

    // Authentication succeeded. Update the credential's counter to prevent replay attacks.
    const { newCounter } = authenticationInfo
    if (typeof newCounter === 'number') {
        await saveUserCredential({
            userId,
            credential: {
                ...matchingCredential,
                counter: newCounter,
            },
        })
    }

    // Clear the challenge as it's been used
    await invalidateChallengeForUser({ userId, kind: 'login' })

    return {
        success: true as const,
        userId,
    }
}

const challengesSchema = {
    userId: {
        requred: true,
        type: String,
    },
    kind: {
        type: String,
        required: true,
    },
    challenge: {
        type: String,
        required: true,
    },
    expiration: {
        type: Date,
        required: true,
    },
} as const
const challengesCollection = typedModel('challenges', challengesSchema)

type ChallengeKind = 'registration' | 'login'
async function getChallengeForUser({ userId, kind }: {
    userId: string,
    kind: ChallengeKind,
}) {
    const challenge = await (await challengesCollection).findOne({ userId, kind })
    if (!challenge) {
        return undefined
    }
    if (challenge.expiration < new Date()) {
        console.warn('Challenge expired', challenge)
        await (await challengesCollection).deleteOne({ _id: challenge._id })
        return undefined
    }
    return challenge.challenge
}

async function saveChallengeForUser({ userId, challenge, kind }: {
    userId: string,
    challenge: string,
    kind: ChallengeKind,
}) {
    const expiration = new Date(Date.now() + 60000)
    return (await challengesCollection).findOneAndUpdate(
        { userId, kind },
        { userId, kind, challenge, expiration },
        {
            upsert: true, // insert if not exists
            new: true, // return the new document
            setDefaultsOnInsert: true, // apply default values if inserting
        },
    )
}

async function invalidateChallengeForUser({ userId, kind }: {
    userId: string, kind: ChallengeKind,
}) {
    return (await challengesCollection).deleteMany({ userId, kind })
}

const credentialsSchema = {
    userId: {
        required: true,
        type: String,
    },
    credentials: [taggedObject<PasskeyCredentialData>()],
}

const credentialsCollection = typedModel('credentials', credentialsSchema)

type PasskeyCredentialData = WebAuthnCredential

async function getCredentialRecordByCredentialId(credentialId: string) {
    const record = await (await credentialsCollection).findOne({
        'credentials.id': credentialId,
    })
    return record
}

async function saveUserCredential({ userId, credential }: {
    userId: string, credential: PasskeyCredentialData,
}) {
    return (await credentialsCollection).findOneAndUpdate(
        { userId },
        { $addToSet: { credentials: credential } },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    )
}