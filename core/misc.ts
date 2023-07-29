export function makeId(...ids: string[]): string {
    return ids.join('/')
}

export function parseId(id: string): string[] {
    return id.split('/')
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(x => x !== undefined) as T[]
}

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
        // tslint:disable-next-line: no-bitwise
        const r = Math.random() * 16 | 0
        // tslint:disable-next-line: no-bitwise
        const v = ch === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

export function uniqueId() {
    return Math.random().toString(36).substring(2)
}

export function assertNever(x: never) {
    return x
}
