import slugify from 'slugify'
import { userUploadsLibrary } from './uu'
import { deleteUserCredentials } from './passkey'
import { estimatedRowCount, sql } from './db'

export type DbUser = {
    id: string,
    username: string,
    email: string | null,
    name: string | null,
    profile_picture_url: string | null,
    joined_at: string,
}

export async function userForId(id: string): Promise<DbUser | null> {
    const [user] = await sql`
      SELECT * FROM users
      WHERE id = ${id}
    `
    return user ? (user as DbUser) : null
}

export async function createUser({
    username, email, name, profilePictureUrl,
}: {
    username?: string,
    email?: string,
    name?: string,
    profilePictureUrl?: string
}): Promise<DbUser> {
    username = username ?? await proposeUsername({
        name, email,
    })
    const [user] = await sql`
      INSERT INTO users (username, email, name, profile_picture_url)
      VALUES (${username}, ${email ?? null}, ${name ?? null}, ${profilePictureUrl ?? null})
      RETURNING *
    `
    return user as DbUser
}

export async function deleteUserForId(id: string): Promise<boolean> {
    const deleteUserPromise = await deleteDbUserForId(id)
    const deleteBooksPromise = userUploadsLibrary.deleteAllBooksForUserId
        ? userUploadsLibrary.deleteAllBooksForUserId(id) : Promise.resolve(true)
    const deleteCredentialsPromise = deleteUserCredentials(id)

    const [
        deleteUserResult,
        deleteBooksResult,
        _deleteCredentialsResult,
    ] = await Promise.all([
        deleteUserPromise,
        deleteBooksPromise,
        deleteCredentialsPromise,
    ])
    return deleteUserResult && deleteBooksResult
}

async function deleteDbUserForId(id: string) {
    const result = await sql`
    DELETE FROM users
    WHERE id = ${id}
  `
    return result.length > 0
}

async function isUserExistForUsername(username: string): Promise<boolean> {
    const [user] = await sql`
      SELECT 1 FROM users
      WHERE username = ${username}
      LIMIT 1
    `
    return Boolean(user)
}

type UserDataForNameGeneration = {
    name?: string,
    email?: string,
}
async function proposeUsername(user: UserDataForNameGeneration) {
    const base = generateUsername(user)
    let current = base
    let next = current
    let idx = await estimatedRowCount('users') ?? 0
    let existing: any
    do {
        current = next
        existing = await isUserExistForUsername(current)
        next = `${base}${++idx}`
    } while (existing)
    return current
}

function generateUsername({ name, email }: UserDataForNameGeneration) {
    const base = name ?? email ?? 'user'
    const username = slugify(base, {
        replacement: '.',
        lower: true,
        strict: true,
        locale: 'en',
    })
    return username
}