/**
 * Утилита для преобразования плоского списка с parentId в древовидную структуру
 */

/**
 * Элемент плоского списка с parentId
 */
export interface FlatNode {
    key: string;
    parentId?: string | null;
    [key: string]: unknown;
}

/**
 * Элемент древовидной структуры с children
 */
export interface TreeNode extends FlatNode {
    children?: TreeNode[];
}

/**
 * Преобразует плоский список элементов с parentId в древовидную структуру с children
 *
 * @param flatData - Плоский список элементов с полем parentId
 * @param options - Опции преобразования
 * @returns Древовидная структура с вложенными children
 *
 * @example
 * const flatData = [
 *   { key: 'uuid-1', name: 'Parent', parentId: null },
 *   { key: 'uuid-2', name: 'Child', parentId: 'uuid-1' }
 * ];
 * const tree = buildTreeFromFlat(flatData);
 * // [{ key: 'uuid-1', name: 'Parent', children: [{ key: 'uuid-2', name: 'Child' }] }]
 */
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

    // Создаем Map для быстрого доступа к элементам по key
    const nodeMap = new Map<string, TreeNodeWithChildren>();

    // Инициализируем все узлы в Map
    flatData.forEach(item => {
        nodeMap.set(item.key, { ...item });
    });

    // Массив корневых элементов (без родителя)
    const rootNodes: TreeNodeWithChildren[] = [];

    // Строим дерево
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

        // Если parentId не указан или равен rootParentId - это корневой элемент
        if (parentId === rootParentId || parentId === undefined || parentId === null) {
            rootNodes.push(node);
        } else {
            // Находим родителя и добавляем текущий узел в его children
            const parent = nodeMap.get(parentId);

            if (parent) {
                // Безопасное приведение для доступа к динамическому ключу
                const parentRecord = parent as Record<string, unknown>;

                if (!parentRecord[childrenKey]) {
                    parentRecord[childrenKey] = [];
                }

                const children = parentRecord[childrenKey];

                if (Array.isArray(children)) {
                    children.push(node);
                }
            } else {
                // Если родитель не найден, считаем элемент корневым
                console.warn(`Parent with key "${parentId}" not found for item "${item.key}"`);
                rootNodes.push(node);
            }
        }
    });

    return rootNodes;
};
