import {
    parse, Rule, Declaration, Charset, Media, AtRule, Comment,
} from 'css'
import { compile, is } from 'css-select'
import { SpecificityArray, calculate, compare } from 'specificity'
import { flatten } from 'lodash'
import { Result, combineResults, Diagnostic, Success } from './result'
import { filterUndefined } from '../core'
import { XmlElement, attributesOf } from './xmlTree'

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
export function parseCss(css: string, fileName: string): Result<Stylesheet> {
    const diags: Diagnostic[] = []
    const parsed = parse(css, {
        silent: true,
        source: fileName,
    })
    if (parsed.stylesheet?.parsingErrors?.length) {
        diags.push({
            message: 'css parsing error',
            data: {
                errors: parsed.stylesheet.parsingErrors.map(
                    e => ({ ...e, message: undefined }),
                ),
            },
        })
    }
    const parsedRules = parsed.stylesheet?.rules ?? []
    const { value: rules, diags: rulesDiags } = processRules(parsedRules)
    diags.push(...rulesDiags)

    return {
        value: { rules },
        diags,
    }
}

export function applyRules(xml: XmlElement, rules: StyleRule[]) {
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
        ? parseInlineStyle(inlineStyle, 'inline')
        : []
    const inlineDeclarations = flatten(
        inlineRules.map(rule => rule.content),
    )
    for (const { property, value } of inlineDeclarations) {
        style[property] = value
    }
    return style
}

function processRules(parsedRules: Array<Rule | Comment | AtRule>) {
    const rules: StyleRule[] = []
    const diags: Diagnostic[] = []
    for (const parsedRule of parsedRules) {
        switch (parsedRule.type) {
            case 'comment':
            case 'font-face':
            case 'page':
                break
            case 'charset': {
                const charset = (parsedRule as Charset).charset
                if (charset !== '"utf-8"') {
                    diags.push({
                        message: `unsupported charset: ${charset}`,
                    })
                }
                break
            }
            case 'media': {
                const fromMedia = processMedia(parsedRule)
                rules.push(...fromMedia.value)
                diags.push(...fromMedia.diags)
                break
            }
            case 'rule': {
                const { value, diags: ruleDiags } = buildRule(parsedRule)
                diags.push(...ruleDiags)
                if (value) {
                    rules.push(value)
                }
                break
            }
            default:
                diags.push({
                    message: `unsupported css rule: ${parsedRule.type}`,
                })
                break
        }
    }

    return {
        value: rules,
        diags,
    }
}

function parseInlineStyle(style: string, fileName: string) {
    const pseudoCss = `* {\n${style}\n}`
    const { value } = parseCss(pseudoCss, fileName)
    return value?.rules ?? []
}

function buildRule(rule: Rule): Result<StyleRule> {
    const supported = rule.selectors?.filter(supportedSelector) ?? []
    const { value, diags } = combineResults(supported.map(parseSelector))
    const selectors = filterUndefined(value ?? [])
    if (selectors.length === 0) {
        return { diags }
    }

    return {
        value: {
            selectors,
            content: (rule.declarations ?? [])
                .filter((r): r is Declaration => r.type === 'declaration')
                .map(d => ({
                    property: d.property!,
                    value: d.value,
                })),
        },
        diags,
    }
}

function processMedia(media: Media): Success<StyleRule[]> {
    switch (media.media) {
        case 'all':
        case 'screen':
            return processRules(media.rules ?? [])
        case 'print':
        case 'speech':
            return { value: [], diags: [] }
        default:
            return {
                value: [],
                diags: [{
                    message: `unsupported media rule: ${media.media}`,
                }],
            }
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

function parseSelector(selector: string): Result<Selector> {
    try {
        const compiled = compile(selector)
        const [specificity] = calculate(selector)
        return {
            value: {
                selector,
                compiled,
                specificity: specificity.specificityArray,
            },
            diags: [],
        }
    } catch (err) {
        return {
            diags: [{
                message: `Couldn't parse selector: ${selector}`,
                data: err as object,
            }],
        }
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