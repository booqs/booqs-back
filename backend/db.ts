import { neon } from '@neondatabase/serverless'
import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

export const sql = neon(process.env.DATABASE_URL!)

export async function estimatedRowCount(tableName: string): Promise<number | null> {
    // Use regclass to handle schema qualification and ensure the table exists.
    // $1 is the placeholder for the tableName parameter.
    const query = `
      SELECT reltuples::bigint AS estimate
      FROM pg_class
      WHERE oid = $1::regclass;
    `

    try {
        const rows = await sql.query(query, [tableName]) // pg returns bigint as string

        if (rows.length === 0) {
            // Table not found by regclass lookup
            console.warn(`Table "${tableName}" not found or not visible.`)
            return null
        }

        // Parse the estimate string to a number
        const estimate = parseInt(rows[0].estimate, 10)

        // Check if parsing was successful (it should be given the query)
        if (isNaN(estimate)) {
            console.error(`Could not parse reltuples value for table "${tableName}".`)
            return null
        }

        return estimate

    } catch (error) {
        console.error(`Error fetching estimated row count for table "${tableName}":`, error)
        // If the error is due to the table not existing, regclass cast will throw
        // an error which is caught here. Other database errors are also caught.
        return null
    }
}