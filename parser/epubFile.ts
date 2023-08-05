export type EpubSection = {
    fileName: string,
    id: string,
    content: string,
};
export type EpubMetadata = {
    [key: string]: string | string[] | undefined,
};
export type EpubTocItem = {
    level: number | undefined,
    title: string | undefined,
    href: string | undefined,
};
export type EpubFile = {
    // TODO: remove
    rawMetadata: any,
    metadata: EpubMetadata,
    bufferResolver(href: string): Promise<Buffer | undefined>,
    textResolver(href: string): Promise<string | undefined>,
    sections(): AsyncGenerator<EpubSection>,
    toc(): Generator<EpubTocItem>,
};
