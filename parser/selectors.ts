import { assertNever, filterUndefined } from '../core';
import { regex, project, Parser, choice, sequence, oneOrMore } from './stringParser';
import { Result } from './result';
import { XmlElement, nameOf, attributesOf } from './xmlTree';

type UniversalSelector = {
    selector: 'universal',
};
type ElementSelector = {
    selector: 'element',
    name: string,
};
type ClassSelector = {
    selector: 'class',
    class: string,
};
type IdSelector = {
    selector: 'id',
    id: string,
}
type PseudoSelector = {
    selector: 'pseudo',
    pseudo: string,
};

type SimpleSelector =
    | UniversalSelector | ElementSelector | ClassSelector | IdSelector | PseudoSelector;

type DescendantSelector = {
    selector: 'descendant',
    ancestor: Selector,
    descendant: Selector,
};
type OrSelector = {
    selector: 'or',
    selectors: Selector[],
};
type AndSelector = {
    selector: 'and',
    selectors: Selector[],
};

type CompositeSelector =
    | DescendantSelector | OrSelector | AndSelector;

export type Selector = SimpleSelector | CompositeSelector;

export function selectXml(xml: XmlElement, selector: Selector): boolean {
    switch (selector.selector) {
        case 'universal':
            return true;
        case 'class':
            return hasClass(xml, selector.class);
        case 'id':
            return attributesOf(xml)?.id === selector.id.substr(1);
        case 'element':
            return nameOf(xml) === selector.name;
        case 'descendant': {
            if (selectXml(xml, selector.descendant)) {
                while (xml.parent) {
                    if (selectXml(xml.parent, selector.ancestor)) {
                        return true;
                    }
                    xml = xml.parent;
                }
            }
            return false;
        }
        case 'or':
            return selector.selectors
                .some(sel => selectXml(xml, sel));
        case 'and':
            return selector.selectors
                .every(sel => selectXml(xml, sel));
        case 'pseudo':
            return false;
        default:
            assertNever(selector);
            return false;
    }
}

function hasClass(xml: XmlElement, cls: string) {
    const classes = attributesOf(xml)?.class;
    if (!classes) {
        return false;
    } else {
        cls = cls.toLowerCase().substr(1);
        return classes
            .toLowerCase()
            .split(' ')
            .some(c => c === cls);
    }
}

export function parseSelector(sel: string): Result<Selector> {
    const result = selectorParser(sel);
    if (result.success) {
        const diags = filterUndefined([
            result.next
                ? { diag: `Selector tail: ${result.next} of ${sel}` }
                : undefined,
        ]);
        return { value: result.value, diags };
    } else {
        return {
            diags: [{
                diag: `Unsupported selector: ${sel}`,
            }],
        };
    }
}

type SelectorParser = Parser<Selector>;
const universalSel: SelectorParser = project(
    regex(/\*/),
    () => ({ selector: 'universal' }),
);
const elementSel: SelectorParser = project(
    regex(/[a-zA-Z][a-zA-Z0-9]*/),
    name => ({
        selector: 'element',
        name,
    }),
);
const classSel: SelectorParser = project(
    regex(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/),
    cls => ({
        selector: 'class',
        class: cls,
    }),
);
const idSel: SelectorParser = project(
    regex(/#[a-zA-Z][a-zA-Z0-9_.-]*/),
    id => ({
        selector: 'id',
        id,
    }),
);
const pseudoSel: SelectorParser = project(
    regex(/:[a-zA-Z0-9_.-]+/),
    pseudo => ({
        selector: 'pseudo',
        pseudo,
    }),
);
const atomSel = choice(
    universalSel, elementSel, classSel, idSel, pseudoSel,
);

const andSel: SelectorParser = project(
    oneOrMore(atomSel),
    selectors => ({
        selector: 'and',
        selectors,
    }),
);

const descendantSel: SelectorParser = project(
    sequence(andSel, regex(/ /), andSel),
    ([ancestor, , descendant]) => ({
        selector: 'descendant',
        ancestor, descendant,
    }),
);
const compositeSel = choice(descendantSel, andSel);

const selectorParser = compositeSel;
