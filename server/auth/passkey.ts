import { config } from '../config'
import { taggedObject, typedModel } from '../mongoose'
import { users } from '../users'
import {
    generateRegistrationOptions, verifyRegistrationResponse,
    generateAuthenticationOptions, verifyAuthenticationResponse,
    RegistrationResponseJSON, AuthenticationResponseJSON, WebAuthnCredential,
} from '@simplewebauthn/server'

export type PasskeyRequestOrigin = 'production' | 'localhost'
export async function initiatePasskeyRegistration({
    email, requestOrigin,
}: {
    email: string,
    requestOrigin?: PasskeyRequestOrigin,
}) {
    const { user, exists } = await users.createIfNewForEmail(email)
    if (exists) {
        return {
            error: `User already exists with email: ${email}`,
            success: false,
        }
    }
    const userCredentials = await getUserCredentials(user._id)

    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain

    const options = await generateRegistrationOptions({
        rpName: config().appName,
        rpID,
        userID: new TextEncoder().encode(user._id), // TODO: rethink? generate user id?
        userName: email,
        userDisplayName: user.name ?? user.username ?? email,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: userCredentials.map(c => ({
            id: c.id,
            transports: c.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
        },
    })

    await saveChallengeForUser({
        userId: user._id,
        challenge: options.challenge,
        kind: 'registration',
    })

    return {
        success: true,
        options,
    }
}

export async function verifyPasskeyRegistration({
    userId, response, requestOrigin,
}: {
    userId: string,
    response: RegistrationResponseJSON, // The credential JSON received from the client
    requestOrigin?: PasskeyRequestOrigin,
}) {
    // Retrieve the original challenge we generated for this user
    const expectedChallenge = await getChallengeForUser({ userId, kind: 'registration' })
    if (!expectedChallenge) {
        return {
            error: 'Registration challenge not found or expired',
            verified: false,
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
            verified: false,
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
        verified: true,
        credential: registrationInfo.credential,
    }
}

export async function initiatePasskeyLogin({
    email, requestOrigin,
}: {
    email: string,
    requestOrigin?: PasskeyRequestOrigin,
}) {
    // Endpoint: Initiate passkey authentication (login)
    // Look up the user and their registered credentials
    const user = await users.forEmail(email)
    if (!user) {
        return {
            error: `User not found with email: ${email}`,
            success: false,
        }
    }
    const userCredentials = await getUserCredentials(user._id) ?? []
    if (userCredentials.length === 0) {
        return {
            error: 'No credentials found for this user',
            success: false,
        }
    }

    const rpID = requestOrigin === 'localhost'
        ? 'localhost'
        : config().domain
    const allowCredentials = userCredentials.map(cred => ({
        id: cred.id,
        transports: cred.transports,
    }))

    const options = await generateAuthenticationOptions({
        timeout: 60000,
        rpID,
        allowCredentials,
        userVerification: 'preferred',
    })

    // Store the challenge for this login attempt
    await saveChallengeForUser({
        userId: user._id,
        challenge: options.challenge,
        kind: 'login',
    })

    return options
}

export async function verifyPasskeyLogin({
    userId, credentialId, response, requestOrigin,
}: {
    userId: string,
    credentialId: string,
    response: AuthenticationResponseJSON, // The credential assertion JSON received from the client
    requestOrigin?: PasskeyRequestOrigin,
}) {

    // Retrieve expected challenge
    const expectedChallenge = await getChallengeForUser({
        userId, kind: 'login',
    })
    if (!expectedChallenge) {
        return {
            error: 'Authentication challenge not found or expired',
            success: false,
        }
    }

    const userCredentials = await getUserCredentials(userId) ?? []
    const matchingCredential = userCredentials.find(c => c.id === credentialId)
    if (!matchingCredential) {
        return {
            error: 'Credential ID not registered for this user',
            success: false,
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
            success: false,
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
        success: true,
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

async function getUserCredentials(userId: string) {
    const user = await (await credentialsCollection).findOne({ userId })
    return user?.credentials ?? []
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