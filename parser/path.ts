export function resolveRelativePath(path: string, relativeTo: string): string {
    if (path.startsWith('../')) {
        // TODO: support multiple levels of parent directories
        const [_, ...parts] = path.split('/')
        const parent = getParentPath(relativeTo)
        return parent ? `${parent}/${parts.join('/')}` : parts.join('/')
    } else {
        return path
    }
}

function getParentPath(fileName: string): string {
    const parts = fileName.split('/')
    parts.pop()
    parts.pop()
    return parts.join('/')
}