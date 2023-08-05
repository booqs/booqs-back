import { BooqPath, BooqRange } from './model'

const pathSeparator = '-'
export function pathToString(path: BooqPath): string {
    return path.join(pathSeparator)
}

export function pathFromString(pathString: string): BooqPath | undefined {
    const path = pathString
        .split(pathSeparator)
        .map(c => parseInt(c, 10))
    return path.some(isNaN)
        ? undefined
        : path
}

const idPrefix = 'path:'
export function pathToId(path: BooqPath): string {
    return `${idPrefix}${pathToString(path)}`
}

export function pathFromId(id: string): BooqPath | undefined {
    if (id.startsWith(idPrefix)) {
        const pathString = id.substring(idPrefix.length)
        return pathFromString(pathString)
    } else {
        return undefined
    }
}

export function samePath(first: BooqPath, second: BooqPath) {
    return first.length === second.length
        && first.every((p, idx) => p === second[idx])
}

export function pathLessThan(first: BooqPath, second: BooqPath): boolean {
    const [firstHead, ...firstTail] = first
    const [secondHead, ...secondTail] = second
    if (secondHead === undefined) {
        return false
    } else if (firstHead === undefined) {
        return true
    } else if (firstHead === secondHead) {
        return pathLessThan(firstTail, secondTail)
    } else {
        return firstHead < secondHead
    }
}

export function comparePaths(first: BooqPath, second: BooqPath): number {
    return pathLessThan(first, second) ? -1
        : samePath(first, second) ? 0
            : +1
}

export function pathInRange(path: BooqPath, range: BooqRange): boolean {
    return pathLessThan(path, range.start)
        ? false
        : (
            range.end
                ? pathLessThan(path, range.end)
                : true
        )
}

const rangeSeparator = 'to'
export function rangeToString(range: BooqRange): string {
    return range.end
        ? `${pathToString(range.start)}${rangeSeparator}${pathToString(range.end)}`
        : pathToString(range.start)
}

export function rangeFromString(rangeString: string): BooqRange | undefined {
    const [startPart, endPart] = rangeString.split(rangeSeparator)
    const start = startPart !== undefined ? pathFromString(startPart) : undefined
    const end = endPart !== undefined ? pathFromString(endPart) : undefined
    return start && end
        ? { start, end }
        : undefined
}

export function isOverlapping(first: BooqRange, second: BooqRange): boolean {
    if (pathLessThan(first.start, second.start)) {
        if (first.end) {
            return pathLessThan(second.start, first.end)
        } else {
            return true
        }
    } else {
        if (second.end) {
            return pathLessThan(first.start, second.end)
        } else {
            return true
        }
    }
}