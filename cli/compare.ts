import { promisify } from 'util'
import { exists, readFile } from 'fs'
import { parseEpub } from '../parser'
import { pretty } from '../server/utils'
import { listEpubs } from './parse'
import { parseEpub as parseEpubOld } from './epubOld'

export async function compateEpubParsers(path: string) {
    if (!await promisify(exists)(path)) {
        console.log(`No such file or directory: ${path}`)
        return
    }

    let count = 0
    let newTotalTime = 0
    let oldTotalTime = 0
    let newTotalDiags = 0
    let oldTotalDiags = 0
    for await (const filePath of listEpubs([path])) {
        if (++count % 1000 === 0) {
            console.log(`Processed ${count} files`)
            console.log(`New parser: ${newTotalTime}ms, ${newTotalDiags} diagnostics`)
            console.log(`Old parser: ${oldTotalTime}ms, ${oldTotalDiags} diagnostics`)
        }
        // console.log(pretty(`Processing ${filePath}`))
        const file = await promisify(readFile)(filePath)

        // Old
        const oldDiags: any[] = []
        try {
            const {
                time: oldTime,
                // value: oldResult,
            } = await measureTime(() => parseEpubOld({
                fileData: file,
                diagnoser: diag => oldDiags.push(diag),
            }))
            oldTotalTime += oldTime
        } catch (err) {
            console.log(pretty(`Error parsing with new parser ${filePath}`))
            console.log(pretty(err))
        }

        // New
        const newDiags: any[] = []
        try {
            const {
                time: newTime,
                // value: newResult,
            } = await measureTime(() => parseEpub({
                fileData: file,
                diagnoser: diag => newDiags.push(diag),
            }))
            newTotalTime += newTime
        } catch (err) {
            console.log(pretty(`Error parsing with new parser ${filePath}`))
            console.log(pretty(err))
        }

        if (newDiags.length !== oldDiags.length) {
            console.log(pretty(`Processing ${filePath}`))
            console.log(`Different number of diagnostics: ${newDiags.length} vs ${oldDiags.length}`)
            console.log('New diagnostics:')
            for (const d of newDiags) {
                console.log(pretty(d))
            }
            console.log('Old diagnostics:')
            for (const d of oldDiags) {
                console.log(pretty(d))
            }
        }
        newTotalDiags += newDiags.length
        oldTotalDiags += oldDiags.length
    }
    console.log(`New total time: ${newTotalTime}ms`)
    console.log(`Old total time: ${oldTotalTime}ms`)
    console.log(`New total diagnostics: ${newTotalDiags}`)
    console.log(`Old total diagnostics: ${oldTotalDiags}`)
}

async function measureTime<T>(fn: () => Promise<T>): Promise<{ value: T, time: number }> {
    const start = Date.now()
    const value = await fn()
    const end = Date.now()
    const time = end - start
    return { value, time }
}