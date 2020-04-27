// TODO: move to 'core' ?
export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
        // tslint:disable-next-line: no-bitwise
        const r = Math.random() * 16 | 0;
        // tslint:disable-next-line: no-bitwise
        const v = ch === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function* makeBatches<T>(generator: AsyncGenerator<T>, size: number) {
    let batch: T[] = [];
    for await (const item of generator) {
        if (batch.length < size) {
            batch.push(item);
        } else {
            yield batch;
            batch = [item];
        }
    }
    if (batch.length > 0) {
        yield batch;
    }
}
