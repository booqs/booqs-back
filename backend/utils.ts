export async function logTime<T>(f: () => Promise<T>, label?: string) {
    console.info(`Start: ${label}`)
    const start = Date.now()
    const result = await f()
    const end = Date.now()
    console.info(`End: ${label}, time: ${end - start}`)
    return result
}

export async function* makeBatches<T>(generator: AsyncGenerator<T>, size: number) {
    let batch: T[] = []
    for await (const item of generator) {
        if (batch.length < size) {
            batch.push(item)
        } else {
            yield batch
            batch = [item]
        }
    }
    if (batch.length > 0) {
        yield batch
    }
}

export function afterPrefix(str: string, prefix: string): string | undefined {
    if (str.startsWith(prefix)) {
        return str.substring(prefix.length)
    } else {
        return undefined
    }
}
