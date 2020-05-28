import { inspect } from 'util';

export function makeId(...ids: string[]): string {
    return ids.join('/');
}

export function parseId(id: string): string[] {
    return id.split('/');
}

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce<T[]>(
        (res, a) => a.length > 0
            ? [...res, ...a]
            : res,
        [],
    );
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(x => x !== undefined) as T[];
}

export function pretty(obj: any, depth?: number) {
    return inspect(obj, false, depth ?? 8, true);
}

export async function logTime<T>(f: () => Promise<T>, label?: string) {
    console.log(`Start: ${label}`);
    const start = Date.now();
    const result = await f();
    const end = Date.now();
    console.log(`End: ${label}, time: ${end - start}`);
    return result;
}
