import {
    parse, Rule, Declaration, Charset, Media, AtRule, Comment,
} from 'css'
import { compile, is } from 'css-select'
import { SpecificityArray, calculate, compare } from 'specificity'
import { flatten } from 'lodash'
import { filterUndefined } from '../core'
import { XmlElement, attributesOf } from './xmlTree'
import { Diagnoser } from 'booqs-epub'

type CompiledQuery = ReturnType<typeof compile>
type Specificity = SpecificityArray;
export type Selector = {
    selector: string,
    compiled: CompiledQuery,
    specificity: Specificity,
};
export type StyleDeclaration = {
    property: string,
    value: string | undefined,
};
export type StyleRule = {
    selectors: Selector[],
    content: StyleDeclaration[],
}
export type Stylesheet = {
    rules: StyleRule[],
};
export function parseCss(css: string, fileName: string, diags: Diagnoser): Stylesheet | undefined {
    const parsed = parse(css, {
        silent: true,
        source: fileName,
    })
    if (parsed.stylesheet?.parsingErrors?.length) {
        diags?.push({
            message: 'css parsing error',
            data: {
                errors: parsed.stylesheet.parsingErrors.map(
                    e => ({ ...e, message: undefined }),
                ),
            },
        })
    }
    const parsedRules = parsed.stylesheet?.rules ?? []
    const rules = processRules(parsedRules, diags)

    return { rules }
}

export function applyRules(xml: XmlElement, rules: StyleRule[], diags: Diagnoser) {
    const assignments = flatten(
        rules.map(rule => selectXml(xml, rule)),
    )
    const result: {
        [key in string]?: {
            value?: string,
            specificity: Specificity,
        };
    } = {}
    for (const { property, value, specificity } of assignments) {
        const existing = result[property]
        if (!existing || compare(existing.specificity, specificity) <= 0) {
            result[property] = { value, specificity }
        }
    }
    const style = Object.fromEntries(
        Object.entries(result).map(([k, v]) => [k, v?.value]),
    )
    const inlineStyle = attributesOf(xml)?.style
    const inlineRules = inlineStyle !== undefined
        ? parseInlineStyle(inlineStyle, 'inline', diags)
        : []
    const inlineDeclarations = flatten(
        inlineRules.map(rule => rule.content),
    )
    for (const { property, value } of inlineDeclarations) {
        style[property] = value
    }
    return style
}

function processRules(parsedRules: Array<Rule | Comment | AtRule>, diags: Diagnoser) {
    const rules: StyleRule[] = []
    for (const parsedRule of parsedRules) {
        switch (parsedRule.type) {
            case 'comment':
            case 'font-face':
            case 'page':
                break
            case 'charset': {
                const charset = (parsedRule as Charset).charset
                if (charset !== '"utf-8"') {
                    diags?.push({
                        message: `unsupported charset: ${charset}`,
                    })
                }
                break
            }
            case 'media': {
                const fromMedia = processMedia(parsedRule, diags)
                rules.push(...fromMedia)
                break
            }
            case 'rule': {
                const value = buildRule(parsedRule, diags)
                if (value) {
                    rules.push(value)
                }
                break
            }
            default:
                diags?.push({
                    message: `unsupported css rule: ${parsedRule.type}`,
                })
                break
        }
    }

    return rules
}

function parseInlineStyle(style: string, fileName: string, diags: Diagnoser) {
    const pseudoCss = `* {\n${style}\n}`
    const value = parseCss(pseudoCss, fileName, diags)
    return value?.rules ?? []
}

function buildRule(rule: Rule, diags: Diagnoser): StyleRule | undefined {
    const supported = rule.selectors?.filter(supportedSelector) ?? []
    const value = supported.map(s => parseSelector(s, diags))
    const selectors = filterUndefined(value ?? [])
    if (selectors.length === 0) {
        return undefined
    }

    return {
        selectors,
        content: (rule.declarations ?? [])
            .filter((r): r is Declaration => r.type === 'declaration')
            .map(d => ({
                property: d.property!,
                value: d.value,
            })),
    }
}

function processMedia(media: Media, diags: Diagnoser): StyleRule[] {
    switch (media.media) {
        case 'all':
        case 'screen':
            return processRules(media.rules ?? [], diags)
        case 'print':
        case 'speech':
            return []
        default:
            diags.push({
                message: `unsupported media rule: ${media.media}`,
            })
            return []
    }
}

function selectXml(xml: XmlElement, rule: StyleRule) {
    let maxSpecificity: Specificity | undefined = undefined
    for (const sel of rule.selectors) {
        if (isSelect(xml, sel)) {
            if (maxSpecificity !== undefined) {
                maxSpecificity = compare(
                    maxSpecificity,
                    sel.specificity,
                ) < 0 ? sel.specificity : maxSpecificity
            } else {
                maxSpecificity = sel.specificity
            }
            return rule.content.map(decl => ({
                property: decl.property,
                value: decl.value,
                specificity: sel.specificity,
            }))
        }
    }
    if (maxSpecificity !== undefined) {
        return rule.content.map(decl => ({
            property: decl.property,
            value: decl.value,
            specificity: maxSpecificity!,
        }))
    } else {
        return []
    }
}

function isSelect(xml: XmlElement, selector: Selector) {
    return is(xml, selector.compiled)
}

function parseSelector(selector: string, diags: Diagnoser): Selector | undefined {
    try {
        const compiled = compile(selector)
        const [specificity] = calculate(selector)
        return {
            selector,
            compiled,
            specificity: specificity.specificityArray,
        }
    } catch (err) {
        diags.push({
            message: `Couldn't parse selector: ${selector}`,
            data: err as object,
        })
        return undefined
    }
}

const ignorePseudo = [
    ':after', ':before',
    ':focus',
    ':first-letter', ':first-line',
]
function supportedSelector(selector: string): boolean {
    return !ignorePseudo.some(pseudo => selector.endsWith(pseudo))
}