import { parseId, Booq } from '../../core'
import { parseEpub } from '../../parser'
import { sources } from './libSources'
import { logTime } from '../utils'
import { diagnoser } from 'booqs-epub'

const cache: {
    [booqId: string]: Promise<Booq | undefined>,
} = {}

export async function booqForId(booqId: string) {
    const cached = cache[booqId]
    if (cached) {
        return cached
    } else {
        const promise = parseBooqForId(booqId)
        cache[booqId] = promise
        return promise
    }
}

async function parseBooqForId(booqId: string) {
    const file = await fileForId(booqId)
    if (!file) {
        return undefined
    }
    let diags = diagnoser('booqForId')
    const booq = await logTime(() => parseEpub({
        fileData: file.file,
        diagnoser: diags,
    }), 'Parser')
    diags.all().forEach(console.log)
    return booq
}

async function fileForId(booqId: string) {
    const [prefix, id] = parseId(booqId)
    const source = sources[prefix]
    return source && id
        ? source.fileForId(id)
        : undefined
}
