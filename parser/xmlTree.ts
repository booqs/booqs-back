import { Parser } from 'htmlparser2';

export function xmlStringParser(input: string): XmlElement {
    let current: XmlElement = {
        name: '@root',
        attributes: {},
        children: [],
    };
    const parser = new Parser({
        onopentag(name, attributes) {
            current = {
                parent: current,
                name, attributes,
                children: [],
            };
        },
        onclosetag() {
            if (current.parent) {
                current.parent.children.push(current);
                current = current.parent;
            }
        },
        ontext(text: string) {
            current.children.push({ text });
        },
    }, {
        xmlMode: true,
    });
    parser.end(input);

    return current;
}

export type XmlAttributes = {
    [key: string]: string,
};
export type XmlElement = {
    parent?: XmlElement,
    children: XmlChild[],
    name: string,
    attributes: XmlAttributes,
    text?: undefined,
};
export type XmlText = {
    name?: undefined,
    children?: undefined,
    text: string,
};
export type XmlChild = XmlElement | XmlText;

export function attributesToString(attr: XmlAttributes): string {
    const result = Object.keys(attr)
        .map(k => attr[k] ? `${k}="${attr[k]}"` : k)
        .join(' ');

    return result;
}

export function xml2string(xml: XmlChild, depth = 1): string {
    if (xml.name !== undefined) {
        const name = xml.name;
        const attrs = attributesToString(xml.attributes);
        const attrsStr = attrs.length > 0 ? ' ' + attrs : '';
        const chs = depth !== 0
            ? xml.children
                .map(ch => xml2string(ch, depth - 1))
                .join('')
            : '';
        return chs.length > 0
            ? `<${name}${attrsStr}>${chs}</${name}>`
            : `<${name}${attrsStr}/>`;
    } else {
        return xml.text;
    }
}
