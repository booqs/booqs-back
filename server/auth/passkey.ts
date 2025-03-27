import { config } from '../config'
import { taggedObject, typedModel } from '../mongoose'
import { users } from '../users'
import {
    generateRegistrationOptions, RegistrationResponseJSON, verifyRegistrationResponse,
    WebAuthnCredential,
} from '@simplewebauthn/server'

export async function initiatePasskeyRegistration({ email }: {
    email: string,
}) {
    try {
        const user = await users.getOrCreateForEmail(email)

        const userCredentials = await getCredentialsForUser(user._id)

        const options = await generateRegistrationOptions({
            rpName: config().appName,
            rpID: config().domain,
            userID: new TextEncoder().encode(user._id),
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

        return options
    } catch (err) {
        console.error(err)
        return undefined
    }
}

export async function verifyPasskeyRegistration({ userId, response }: {
    userId: string,
    response: RegistrationResponseJSON, // The credential JSON received from the client
}) {
    try {
        // Retrieve the original challenge we generated for this user
        const expectedChallenge = await getChallengeForUser({ userId, kind: 'registration' })
        if (!expectedChallenge) {
            return {
                error: 'Registration challenge not found or expired',
                verified: false,
            }
        }

        const expectedOrigin = config().origin

        // Verify the registration response
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin,
            expectedRPID: config().domain,
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
    } catch (err) {
        console.error(err)
        return {
            error: `Error during verification: ${err}`,
            verified: false,
        }
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

async function getCredentialsForUser(userId: string) {
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