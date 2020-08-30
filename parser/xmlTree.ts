import { parseDOM } from 'htmlparser2';
import { findOne, getOuterHTML, getChildren, getName, isTag, isText } from 'domutils';

export type XmlAttributes = {
    [attr: string]: string,
};
export type XmlElement = ReturnType<typeof parseDOM>[number];
export function xmlStringParser(input: string) {
    return parseDOM(input, {
        xmlMode: true,
        recognizeSelfClosing: true,
    });
}

export function asObject(element: XmlElement) {
    if (isTag(element)) {
        return {
            name: element.name,
            attributes: element.attribs,
            children: element.children,
        };
    } else if (isText(element)) {
        return {
            text: element.nodeValue,
        };
    } else {
        return {};
    }
}

export function nameOf(element: XmlElement) {
    return isTag(element)
        ? getName(element)
        : undefined;
}

export function textOf(element: XmlElement): string | undefined {
    return isText(element)
        ? element.nodeValue
        : undefined;
}

export function attributesOf(element: XmlElement) {
    return isTag(element)
        ? element.attribs
        : {};
}

export function childrenOf(element: XmlElement): XmlElement[] {
    return getChildren(element) ?? [];
}

export function findByName(elements: XmlElement[], name: string) {
    return findOne(n => n.name === name, elements, true);
}

export function xml2string(...elements: XmlElement[]) {
    return getOuterHTML(elements);
}
