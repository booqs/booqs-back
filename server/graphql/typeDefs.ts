import { readFile } from 'fs'

export async function readTypeDefs() {
    return new Promise<string>((resolve, reject) => {
        readFile('./server/graphql/schema.graphql', {
            encoding: 'utf-8',
        }, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data)
        })
    })
}