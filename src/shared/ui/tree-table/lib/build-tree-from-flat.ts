
export interface FlatNode {
    key: string;
    parentId?: string | null;
    [key: string]: unknown;
}

export interface TreeNode extends FlatNode {
    children?: TreeNode[];
}

export const buildTreeFromFlat = <T extends FlatNode>(
    flatData: T[],
    options: {
        parentIdKey?: string;
        childrenKey?: string;
        rootParentId?: string | null;
    } = {}
): (T & { children?: T[] })[] => {
    const { parentIdKey = 'parentId', childrenKey = 'children', rootParentId = null } = options;

    type TreeNodeWithChildren = T & { children?: T[] };

    const nodeMap = new Map<string, TreeNodeWithChildren>();

    flatData.forEach(item => {
        nodeMap.set(item.key, { ...item });
    });

    const rootNodes: TreeNodeWithChildren[] = [];

    flatData.forEach(item => {
        const node = nodeMap.get(item.key);
        if (!node) {
            return;
        }

        const parentIdValue = item[parentIdKey];
        const parentId =
            typeof parentIdValue === 'string'
                ? parentIdValue
                : parentIdValue === null
                  ? null
                  : undefined;

        if (parentId === rootParentId || parentId === undefined || parentId === null) {
            rootNodes.push(node);
        } else {

            const parent = nodeMap.get(parentId);

            if (parent) {

                const parentRecord = parent as Record<string, unknown>;

                if (!parentRecord[childrenKey]) {
                    parentRecord[childrenKey] = [];
                }

                const children = parentRecord[childrenKey];

                if (Array.isArray(children)) {
                    children.push(node);
                }
            } else {

                rootNodes.push(node);
            }
        }
    });

    return rootNodes;
};