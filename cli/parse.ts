import { promisify, inspect } from 'util'
import { exists, lstat, readdir, readFile } from 'fs'
import { join } from 'path'
import { extractMetadata, parseEpub } from '@/parser'

export async function parseEpubs(path: string, options: {
    verbose?: boolean,
}) {
    if (!await promisify(exists)(path)) {
        console.log(`No such file or directory: ${path}`)
        return
    }

    let count = 0
    for await (const filePath of listEpubs([path])) {
        if (++count % 1000 === 0) {
            console.log(`Processed ${count} files`)
        }
        await processFile(filePath, options.verbose)
    }
}

async function processFile(filePath: string, verbose?: boolean) {
    try {
        if (verbose) {
            console.log(pretty(`Processing ${filePath}`))
        }
        const file = await promisify(readFile)(filePath)
        const { value: result, diags: parseDiags } = await parseEpub({
            fileData: file,
        })
        const { value: meta, diags: metaDiags } = await extractMetadata({
            fileData: file,
            extractCover: true,
        })
        const diags = [...parseDiags, ...metaDiags]
        if (!meta?.cover) {
            diags.push({
                message: 'No cover image found',
            })
        }
        diags.forEach(diag => console.log(`${filePath}: `, pretty(diag)))
        if (verbose) {
            console.log(pretty(result?.meta))
        }
    } catch (err) {
        console.log(pretty(err))
    }
}

export async function* listEpubs(paths: string[]): AsyncGenerator<string> {
    for (const path of paths) {
        const info = await promisify(lstat)(path)
        if (info.isDirectory()) {
            const dir = await promisify(readdir)(path)
            const subs = dir.map(s => join(path, s))
            yield* listEpubs(subs)
        } else if (info.isFile()) {
            if (path.endsWith('.epub')) {
                yield path
            }
        }
    }
}

function pretty(obj: any, depth?: number) {
    return inspect(obj, false, depth ?? 8, true)
}