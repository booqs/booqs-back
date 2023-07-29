export function transformHref(href: string) {
    const [file, id] = href.split('#')
    return id
        ? `#${file}/${id}`
        : `#${file}`
}