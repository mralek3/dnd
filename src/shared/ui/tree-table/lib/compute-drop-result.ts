import type { TreeNodeMeta, VisualIndicator, ReorderEvent } from '../model/types';

export type RawInstruction = 'above' | 'below' | 'make-child' | 'below-ancestor';

export interface DropResult {

    indicator: VisualIndicator | null;

    event: ReorderEvent | null;
}

const getLastVisibleDescendant = (key: string, nodeMap: Map<string, TreeNodeMeta>): string => {
    const node = nodeMap.get(key);

    if (!node || !node.isExpanded || node.childKeys.length === 0) {
        return key;
    }

    const lastChildKey = node.childKeys[node.childKeys.length - 1];
    return getLastVisibleDescendant(lastChildKey, nodeMap);
};

const isAncestor = (
    ancestorKey: string,
    descendantKey: string,
    nodeMap: Map<string, TreeNodeMeta>
): boolean => {
    let current = nodeMap.get(descendantKey);

    while (current?.parentKey != null) {
        if (current.parentKey === ancestorKey) {
            return true;
        }

        current = nodeMap.get(current.parentKey);
    }

    return false;
};

const findAncestorAtLevel = (
    key: string,
    targetLevel: number,
    nodeMap: Map<string, TreeNodeMeta>
): string | null => {
    let current = nodeMap.get(key);

    while (current) {
        if (current.level === targetLevel) {
            return current.key;
        }

        if (current.parentKey == null) {
            break;
        }

        current = nodeMap.get(current.parentKey);
    }

    return null;
};

export const computeDropResult = (
    sourceKey: string,
    targetKey: string,
    rawInstruction: RawInstruction,
    nodeMap: Map<string, TreeNodeMeta>
): DropResult => {
    const BLOCKED: DropResult = { indicator: null, event: null };

    const source = nodeMap.get(sourceKey);
    const target = nodeMap.get(targetKey);

    if (!source || !target) {
        return BLOCKED;
    }

    if (sourceKey === targetKey) {
        return BLOCKED;
    }

    if (isAncestor(sourceKey, targetKey, nodeMap)) {
        return BLOCKED;
    }

    if (rawInstruction === 'below-ancestor') {
        const ancestorKey = findAncestorAtLevel(targetKey, source.level, nodeMap);

        if (!ancestorKey) {
            return BLOCKED;
        }

        return computeDropResult(sourceKey, ancestorKey, 'below', nodeMap);
    }

    if (rawInstruction === 'above' || rawInstruction === 'below') {

        if (target.level !== source.level) {
            return BLOCKED;
        }
    } else if (rawInstruction === 'make-child') {

        if (target.level !== source.level - 1) {
            return BLOCKED;
        }
    }

    if (rawInstruction === 'make-child') {

        if (target.isExpanded && target.childKeys.length > 0) {
            const firstChildKey = target.childKeys[0];

            if (firstChildKey === sourceKey) {
                return BLOCKED;
            }

            const firstChild = nodeMap.get(firstChildKey);

            if (firstChild && source.parentKey === target.key && source.indexAmongSiblings === 0) {
                return BLOCKED; 
            }

            return {
                indicator: { rowKey: firstChildKey, type: 'above' },
                event: { sourceKey, targetKey: firstChildKey, position: 'above' }
            };
        }

        if (source.parentKey === targetKey) {
            const lastIdx = target.childKeys.length - 1;

            if (target.childKeys[lastIdx] === sourceKey) {
                return BLOCKED;
            }
        }

        return {
            indicator: { rowKey: targetKey, type: 'make-child' },
            event: { sourceKey, targetKey, position: 'make-child' }
        };
    }

    if (rawInstruction === 'above') {

        if (source.parentKey === target.parentKey) {

            if (source.indexAmongSiblings + 1 === target.indexAmongSiblings) {
                return BLOCKED;
            }

        }

        return {
            indicator: { rowKey: targetKey, type: 'above' },
            event: { sourceKey, targetKey, position: 'above' }
        };
    }

    if (rawInstruction === 'below') {

        if (source.parentKey === target.parentKey) {
            if (target.indexAmongSiblings + 1 === source.indexAmongSiblings) {
                return BLOCKED;
            }
        }

        if (target.isExpanded && target.childKeys.length > 0) {
            const lastDescendantKey = getLastVisibleDescendant(targetKey, nodeMap);
            return {
                indicator: { rowKey: lastDescendantKey, type: 'below' },

                event: { sourceKey, targetKey, position: 'below' }
            };
        }

        return {
            indicator: { rowKey: targetKey, type: 'below' },
            event: { sourceKey, targetKey, position: 'below' }
        };
    }

    return BLOCKED;
};