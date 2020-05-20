import { BooqPath } from '../model';

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
