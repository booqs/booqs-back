import { parseDocument } from 'htmlparser2'
import { findOne, getChildren, getName, isTag, isText } from 'domutils'
import { render } from 'dom-serializer'

export type XmlAttributes = {
    [attr: string]: string,
};
export type XmlElement = ReturnType<typeof parseDocument>['childNodes'][number];
export function xmlStringParser(input: string): XmlElement[] {
    return parseDocument(input, {
        xmlMode: true,
        recognizeSelfClosing: true,
    }).childNodes
}

export function asObject(element: XmlElement): {
    name?: string,
    attributes?: XmlAttributes,
    children?: XmlElement[],
    text?: string,
} {
    if (isTag(element)) {
        return {
            name: element.name,
            attributes: element.attribs,
            children: element.children as XmlElement[],
        }
    } else if (isText(element)) {
        return {
            text: element.nodeValue,
        }
    } else {
        return {}
    }
}

export function nameOf(element: XmlElement) {
    return isTag(element)
        ? getName(element)
        : undefined
}

export function textOf(element: XmlElement): string | undefined {
    return isText(element)
        ? element.nodeValue
        : undefined
}

export function attributesOf(element: XmlElement) {
    return isTag(element)
        ? element.attribs
        : {}
}

export function childrenOf(element: XmlElement): XmlElement[] {
    return getChildren(element) ?? []
}

export function findByName(elements: XmlElement[], name: string): XmlElement | undefined {
    return findOne(n => n.name === name, elements, true) ?? undefined
}

export function xml2string(...elements: XmlElement[]) {
    return render(elements)
}
