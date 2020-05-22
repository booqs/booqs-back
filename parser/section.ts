import { BooqNode } from '../core';
import {
    xmlStringParser, xml2string, XmlElement, XmlAttributes, XmlChild,
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
    const document = xmlStringParser(content);
    const html = document.children.find(ch => ch.name === 'html');
    if (html === undefined) {
        env.report({
            diag: 'no html element',
            data: { xml: xml2string(document) },
        });
        return undefined;
    } else {
        const head = html?.children?.find(ch => ch.name === 'head');
        const body = html?.children?.find(ch => ch.name === 'body');
        if (!body?.name) {
            env.report({
                diag: 'missing body node',
                data: { xml: xml2string(html) },
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
}

async function processHead(head: XmlElement, env: Env) {
    const rules: StyleRule[] = [];
    for (const ch of head?.children ?? []) {
        switch (ch.name) {
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
    const { rel, href, type } = link.attributes;
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
    const content = style.children[0];
    if (style.attributes.type !== 'text/css' || style.children.length !== 1 || !content.text) {
        env.report({
            diag: 'unsupported style tag',
            data: { xml: xml2string(style) },
        });
        return [];
    }
    const { value, diags } = parseCss(content.text, `${env.fileName}: <style>`);
    diags.forEach(d => env.report(d));
    return value?.rules ?? [];
}

async function processBody(body: XmlElement, env: Env) {
    const node = await processXml(body, env);
    return {
        ...node,
        fileName: env.fileName,
        name: 'div',
    };
}

async function processXmls(xmls: XmlChild[], env: Env) {
    return Promise.all(
        xmls.map(n => processXml(n, env)),
    );
}

async function processXml(xml: XmlChild, env: Env): Promise<BooqNode> {
    if (!xml.name) {
        return { content: xml.text };
    } else {
        return processXmlElement(xml, env);
    }
}

async function processXmlElement(element: XmlElement, env: Env): Promise<BooqNode> {
    const {
        name, children,
        attributes: { id, class: _, style: __, ...rest },
    } = element;
    const result: BooqNode = {
        name,
        id: processId(id, env),
        style: processStyle(element, env),
        attrs: processAttributes(rest, env),
        children: children?.length > 0
            ? await processXmls(children, env)
            : undefined,
    };
    return result;
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

function isEmptyText(xml: XmlChild) {
    return xml.text !== undefined && xml.text.match(/^\s*$/)
        ? true : false;
}
