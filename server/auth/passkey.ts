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
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    const options = await generateRegistrationOptions({
        rpName: config().appName,
        rpID,
        userName: 'placeholder', // This will be replaced with the actual user ID
        timeout: 60000,
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
        },
    })

    const challengeRecord = await createChallenge({
        challenge: options.challenge,
        kind: 'registration',
    })

    return {
        success: true as const,
        options,
        id: challengeRecord._id,
    }
}

export async function verifyPasskeyRegistration({
    id, response, requestOrigin,
}: {
    id: string,
    response: RegistrationResponseJSON, // The credential JSON received from the client
    requestOrigin?: RequestOrigin,
}) {
    // Retrieve the original challenge we generated for this user
    const expectedChallenge = await getChallengeForId({ id, kind: 'registration' })
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
    const user = await users.createUser({})

    await saveUserCredential({
        userId: user._id,
        credential: registrationInfo.credential,
    })

    // Invalidate or clear the stored challenge as it's used up
    await invalidateChallengeForId({
        id,
    })

    return {
        success: true as const,
        user,
        credential: registrationInfo.credential,
    }
}

export async function initiatePasskeyLogin({
    requestOrigin,
}: {
    requestOrigin?: RequestOrigin,
}) {
    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    const options = await generateAuthenticationOptions({
        timeout: 60000,
        rpID,
        userVerification: 'preferred',
    })

    // Store the challenge for this login attempt
    const challengeRecord = await createChallenge({
        challenge: options.challenge,
        kind: 'login',
    })

    return {
        success: true as const,
        options,
        id: challengeRecord._id,
    }
}

export async function verifyPasskeyLogin({
    id, response, requestOrigin,
}: {
    id: string,
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
    const user = await users.forId(record.userId)
    if (!user) {
        return {
            error: 'User not found',
            success: false as const,
        }
    }

    // Retrieve expected challenge
    const expectedChallenge = await getChallengeForId({
        id, kind: 'login',
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

    const credential = {
        ...matchingCredential,
        publicKey: Buffer.from(matchingCredential.publicKey.buffer),
    }
    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        credential,
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
            userId: user._id,
            credential: {
                ...matchingCredential,
                counter: newCounter,
            },
        })
    }

    // Clear the challenge as it's been used
    await invalidateChallengeForId({ id })

    return {
        success: true as const,
        user,
    }
}

const challengesSchema = {
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
async function getChallengeForId({ id, kind }: {
    id: string,
    kind: ChallengeKind,
}) {
    const challenge = await (await challengesCollection).findById(id)
    if (!challenge) {
        return undefined
    }
    if (challenge.expiration < new Date()) {
        console.warn('Challenge expired', challenge)
        await (await challengesCollection).deleteOne({ _id: challenge._id })
        return undefined
    } else if (challenge.kind !== kind) {
        console.warn('Challenge kind mismatch', challenge)
        await (await challengesCollection).deleteOne({ _id: challenge._id })
        return undefined
    }
    return challenge.challenge
}

async function createChallenge({ challenge, kind }: {
    challenge: string,
    kind: ChallengeKind,
}) {
    const expiration = new Date(Date.now() + 60000)
    const doc = await (await challengesCollection).insertOne(
        { kind, challenge, expiration },
    )

    return doc
}

async function invalidateChallengeForId({ id }: { id: string }) {
    return (await challengesCollection).deleteOne({ _id: id })
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