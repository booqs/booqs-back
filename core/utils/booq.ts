import { BooqNode, BooqPath } from '../model';

export function findPathForId(nodes: BooqNode[], targetId: string): BooqPath | undefined {
    for (let idx = 0; idx < nodes.length; idx++) {
        const { id, children } = nodes[idx];
        if (id === targetId) {
            return [idx];
        } else if (children) {
            const path = findPathForId(children, targetId);
            if (path) {
                return [idx, ...path];
            }
        }
    }
    return undefined;
}