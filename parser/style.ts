import { flatten, capitalize } from 'lodash';
import { BooqNodeStyle } from '../core';
import { XmlElement, nameOf, attributesOf } from './xmlTree';
import { selectXml } from './selectors';
import { parseInlineStyle, Stylesheet, StyleDeclaration } from './css';
import { Diagnostic } from './result';

type Env = {
    fileName: string,
    stylesheet: Stylesheet,
    report: (diag: Diagnostic) => void,
};
export function processStyle(xml: XmlElement, env: Env): BooqNodeStyle | undefined {
    const rules = getRules(xml, env);
    const declarations = flatten(rules.map(r => r.content));
    if (declarations.length === 0) {
        return undefined;
    } else {
        return buildStyle(declarations, env);
    }
}

function getRules(xml: XmlElement, env: Env) {
    const cssRules = env.stylesheet.rules.filter(
        rule => selectXml(xml, rule.selector),
    );
    const inline = attributesOf(xml)?.style;
    if (inline) {
        const { value, diags } = parseInlineStyle(inline, `${env.fileName}: <${nameOf(xml)} style>`);
        diags.forEach(d => env.report(d));
        const inlineRules = value ?? [];
        return [...cssRules, ...inlineRules];
    } else {
        return cssRules;
    }
}

function buildStyle(declarations: StyleDeclaration[], env: Env): BooqNodeStyle {
    const style = declarations.reduce(applyStyle, {});

    return style;
}

function translatePropertyName(property: string): string {
    const comps = property.split('-');
    const result = comps.reduce((res, c) => res + capitalize(c));
    return result;
}

function applyStyle(style: BooqNodeStyle, { property, value }: StyleDeclaration): BooqNodeStyle {
    switch (property) {
        case 'margin':
            return {
                ...style,
                margin: value,
                marginTop: undefined, marginBottom: undefined,
                marginLeft: undefined, marginRight: undefined,
            };
        case 'padding':
            return {
                ...style,
                padding: value,
                paddingTop: undefined, paddingBottom: undefined,
                paddingLeft: undefined, paddingRight: undefined,
            };
        default:
            return {
                ...style,
                [translatePropertyName(property)]: value,
            };
    }
}