import { BooqPath } from '@/core'
import { redis } from './db'

export type DbReadingHistoryEvent = {
    booqId: string,
    source: string,
    path: BooqPath,
    date: number,
}
type DbReadingHistory = Array<{
    booqId: string,
    source: string,
    path: BooqPath,
    date: number,
}>
type RedisHashValue = Omit<DbReadingHistoryEvent, 'booqId' | 'source'>
export async function booqHistoryForUser(userId: string): Promise<DbReadingHistory> {
    const record = await redis.hgetall<Record<string, RedisHashValue>>(`user:${userId}:history`) ?? {}
    const history: DbReadingHistory = Object.entries(record).map(([key, value]) => {
        const [booqId, source] = key.split(':')
        return {
            booqId,
            source,
            ...value,
        }
    })
    history.sort((a, b) => b.date - a.date)
    return history
}

export async function addBooqHistory(
    userId: string,
    { booqId, source, ...data }: DbReadingHistoryEvent,
) {
    const result = await redis.hset(`user:${userId}:history`, {
        [`${booqId}:${source}`]: JSON.stringify(data),
    })
    return result > 0 ? {
        booqId,
        source,
        ...data,
    } : null
}