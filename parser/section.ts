import { BooqNode } from '../core';
import {
    xmlStringParser, XmlElement, findByName, xml2string, childrenOf, nameOf, attributesOf, textOf, asObject, XmlAttributes,
} from './xmlTree';
import { EpubSection, EpubFile } from './epubFile';
import { parseCss, Stylesheet, StyleRule } from './css';
import { Result, Diagnostic } from './result';
import { processStyle } from './style';
import { transformHref } from './parserUtils';

export async function parseSection(section: EpubSection, file: EpubFile): Promise<Result<BooqNode>> {
    const diags: Diagnostic[] = [];
    const node = await processSectionContent(section.content, {
        fileName: section.fileName,
        stylesheet: { rules: [] },
        report: d => diags.push(d),
        resolveTextFile: async href => {
            const buffer = await file.itemResolver(href);
            return buffer
                ? Buffer.from(buffer).toString('utf8')
                : undefined;
        },
    });
    return {
        value: node,
        diags,
    };
}

type Env = {
    fileName: string,
    stylesheet: Stylesheet,
    report: (diag: Diagnostic) => void,
    resolveTextFile: (href: string) => Promise<string | undefined>,
};

async function processSectionContent(content: string, env: Env) {
    const elements = xmlStringParser(content);
    const head = findByName(elements, 'head');
    const body = findByName(elements, 'body');
    if (!body) {
        env.report({
            diag: 'missing body node',
            data: { xml: xml2string(...elements) },
        });
        return undefined;
    } else {
        const stylesheet = head?.name !== undefined
            ? await processHead(head, env)
            : undefined;
        return processBody(body, {
            ...env,
            stylesheet: stylesheet ?? env.stylesheet,
        });
    }
}

async function processHead(head: XmlElement, env: Env) {
    const rules: StyleRule[] = [];
    for (const ch of childrenOf(head)) {
        switch (nameOf(ch)) {
            case 'link': {
                const fromLink = await processLink(ch, env);
                rules.push(...fromLink);
                break;
            }
            case 'style': {
                const fromStyle = await processStyleElement(ch, env);
                rules.push(...fromStyle);
                break;
            }
            case 'title':
            case 'meta':
                // TODO: handle ?
                break;
            default:
                if (!isEmptyText(ch)) {
                    env.report({
                        diag: 'unexpected head node',
                        data: { xml: xml2string(ch) },
                    });
                }
        }
    }
    return { rules };
}

async function processLink(link: XmlElement, env: Env) {
    const { rel, href, type } = attributesOf(link);
    switch (rel?.toLowerCase()) {
        case 'stylesheet':
            break;
        case 'coverpage':
            return [];
        default:
            env.report({
                diag: `unexpected link rel: ${rel}`,
                data: { xml: xml2string(link) },
            });
            return [];
    }
    switch (type?.toLowerCase()) {
        case 'text/css':
            break;
        // Note: known unsupported
        case 'application/vnd.adobe-page-template+xml':
            return [];
        // Note: unknown unsupported
        default:
            env.report({
                diag: `unexpected link type: ${type}`,
            });
            return [];
    }
    if (href === undefined) {
        env.report({
            diag: 'missing href on link',
            data: { xml: xml2string(link) },
        });
        return [];
    }
    const content = await env.resolveTextFile(href);
    if (content === undefined) {
        env.report({
            diag: `couldn't load css: ${href}`,
        });
        return [];
    } else {
        const { value, diags } = parseCss(content, href);
        diags.forEach(d => env.report(d));
        return value?.rules ?? [];
    }
}

async function processStyleElement(style: XmlElement, env: Env) {
    const [content] = childrenOf(style);
    const { type } = attributesOf(style);
    const text = content && textOf(content);
    if (type !== 'text/css' || text === undefined) {
        env.report({
            diag: 'unsupported style tag',
            data: { xml: xml2string(style) },
        });
        return [];
    }
    const { value, diags } = parseCss(text, `${env.fileName}: <style>`);
    diags.forEach(d => env.report(d));
    return value?.rules ?? [];
}

function processBody(body: XmlElement, env: Env) {
    const node = processXml(body, env);
    return {
        ...node,
        fileName: env.fileName,
        name: 'div',
    };
}

function processXmls(xmls: XmlElement[], env: Env) {
    return xmls.map(n => processXml(n, env));
}

function processXml(element: XmlElement, env: Env): BooqNode {
    const {
        text,
        name, children,
        attributes,
    } = asObject(element);
    if (text !== undefined) {
        return { content: text };
    } else if (name) {
        const { id, class: _, style: __, ...rest } = attributes ?? {};
        const result: BooqNode = {
            name,
            id: processId(id, env),
            style: processStyle(element, env),
            attrs: processAttributes(rest, env),
            children: children?.length
                ? processXmls(children, env)
                : undefined,
        };
        return result;
    } else {
        return {};
    }
}

function processId(id: string | undefined, env: Env) {
    return id
        ? `${env.fileName}/${id}`
        : undefined;
}

function processAttributes(attrs: XmlAttributes, env: Env) {
    const entries = Object
        .entries(attrs)
        .map(([key, value]): [string, string | undefined] => {
            switch (key) {
                case 'colspan':
                    return ['colSpan', value];
                case 'rowspan':
                    return ['rowSpan', value];
                case 'href':
                    return ['href', value ? transformHref(value) : undefined];
                default:
                    return [key, value];
            }
        });
    return entries.length
        ? Object.fromEntries(entries)
        : undefined;
}

function isEmptyText(xml: XmlElement) {
    const text = textOf(xml);
    return text !== undefined && text.match(/^\s*$/)
        ? true : false;
}
