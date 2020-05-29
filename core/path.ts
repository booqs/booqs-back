import { BooqPath, BooqRange } from './model';

const separator = '-';
export function pathToString(path: BooqPath): string {
    return path.join(separator);
}

export function pathFromString(pathString: string): BooqPath | undefined {
    const path = pathString
        .split(separator)
        .map(c => parseInt(c, 10));
    return path.some(isNaN)
        ? undefined
        : path;
}

export function samePath(first: BooqPath, second: BooqPath) {
    return first.length === second.length
        && first.every((p, idx) => p === second[idx]);
}

export function pathLessThan(first: BooqPath, second: BooqPath): boolean {
    const [firstHead, ...firstTail] = first;
    const [secondHead, ...secondTail] = second;
    if (secondHead === undefined) {
        return false;
    } else if (firstHead === undefined) {
        return true;
    } else if (firstHead === secondHead) {
        return pathLessThan(firstTail, secondTail);
    } else {
        return firstHead < secondHead;
    }
}

export function comparePaths(first: BooqPath, second: BooqPath): number {
    return pathLessThan(first, second) ? -1
        : samePath(first, second) ? 0
            : +1;
}

export function pathInRange(path: BooqPath, range: BooqRange): boolean {
    return pathLessThan(path, range.start)
        ? false
        : (
            range.end
                ? pathLessThan(path, range.end)
                : true
        );
}