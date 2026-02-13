import { useMemo, useCallback, useState, useEffect } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import { DragHandle } from './ui/drag-handle';
import { DraggableRow } from './ui/draggable-row';
import { useDragHandleRef } from './model/drag-handle-context';
import { TreeDndProvider } from './model/tree-dnd-context';
import type { TreeNodeMeta, ReorderEvent } from './model/types';

// ─── DragHandleCell ───────────────────────────────────────────────────

const DragHandleCell = () => {
    const dragHandleRef = useDragHandleRef();
    return <DragHandle innerRef={dragHandleRef} />;
};

// ─── Построение карты метаданных дерева ───────────────────────────────

/**
 * Рекурсивно строит полную карту { rowKey → TreeNodeMeta } по дереву данных.
 * Обходит все узлы (включая collapsed), чтобы computeDropResult имел
 * полную информацию о структуре дерева.
 */
function buildNodeMap<T extends Record<string, unknown>>(
    data: readonly T[],
    level: number,
    parentKey: string | null,
    map: Map<string, TreeNodeMeta>,
    expandedKeys: Set<string>,
    childrenColumnName: string
): void {
    const siblingKeys = data.map(item => {
        return hasKeyProperty(item) ? String(item.key) : '';
    });

    data.forEach((item, idx) => {
        const key = hasKeyProperty(item) ? String(item.key) : '';
        const childrenProp = item[childrenColumnName];
        const children: T[] | undefined = Array.isArray(childrenProp) ? childrenProp : undefined;
        const hasChildren = Array.isArray(children) && children.length > 0;
        const isExpanded = hasChildren && expandedKeys.has(key);

        // childKeys — только непосредственные дети.
        // Заполняются даже для свёрнутых узлов (нужно для правила 4 — no-op detection).
        const childKeys = hasChildren
            ? children.map(c => {
                  return hasKeyProperty(c) ? String(c.key) : '';
              })
            : [];

        map.set(key, {
            key,
            level,
            parentKey,
            childKeys,
            hasChildren,
            isExpanded,
            indexAmongSiblings: idx,
            siblingKeys
        });

        // Рекурсия по всем дочерним элементам (не только раскрытым),
        // чтобы иметь полную карту для проверок isAncestor и т.п.
        if (hasChildren) {
            buildNodeMap(children, level + 1, key, map, expandedKeys, childrenColumnName);
        }
    });
}

// ─── TreeTable ────────────────────────────────────────────────────────

interface TreeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
    columns: TableColumnsType<T>;
    draggable?: boolean;
    onReorder?: (event: ReorderEvent) => void;
}

/**
 * Проверяет, есть ли у объекта свойство key
 */
const hasKeyProperty = (obj: unknown): obj is Record<string, unknown> & { key: unknown } => {
    return typeof obj === 'object' && obj !== null && 'key' in obj;
};

export const TreeTable = <T extends Record<string, unknown>>({
    columns,
    draggable = false,
    expandable,
    onReorder,
    dataSource,
    ...restProps
}: TreeTableProps<T>) => {
    // Helper для безопасного доступа к свойствам expandable
    // Antd не экспортирует полные типы для ExpandableConfig
    const getExpandableProperty = <K extends string>(key: K): unknown => {
        if (!expandable || typeof expandable !== 'object') {
            return undefined;
        }
        // Безопасное приведение для доступа к свойствам объекта Antd
        const obj = expandable as unknown;
        return (obj as Record<string, unknown>)[key];
    };

    const childrenColumnNameValue = getExpandableProperty('childrenColumnName');
    const childrenColumnName =
        typeof childrenColumnNameValue === 'string' ? childrenColumnNameValue : 'children';

    // ─── Отслеживание раскрытых строк ───────────────────
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const handleExpand = useCallback(
        (expanded: boolean, record: T) => {
            const key = hasKeyProperty(record) ? String(record.key) : '';

            setExpandedKeys(prev => {
                const next = new Set(prev);
                if (expanded) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
                return next;
            });

            const onExpandCallback = getExpandableProperty('onExpand');
            if (typeof onExpandCallback === 'function') {
                onExpandCallback(expanded, record);
            }
        },
        [expandable]
    );

    useEffect(() => {
        const expandedRowKeys = getExpandableProperty('expandedRowKeys');
        if (Array.isArray(expandedRowKeys)) {
            setExpandedKeys(new Set(expandedRowKeys.map(String)));
        }
    }, [expandable]);

    // ─── Полная карта метаданных узлов ───────────────────
    const nodeMap = useMemo(() => {
        const map = new Map<string, TreeNodeMeta>();
        if (dataSource) {
            buildNodeMap(dataSource, 0, null, map, expandedKeys, childrenColumnName);
        }
        return map;
    }, [dataSource, expandedKeys, childrenColumnName]);

    // ─── Columns ─────────────────────────────────────────
    const allColumns = useMemo(() => {
        if (!draggable) return columns;
        const dragColumn = {
            key: '__drag__',
            title: '',
            width: 40,
            render: () => <DragHandleCell />
        };
        return [dragColumn, ...columns];
    }, [columns, draggable]);

    // ─── Expandable config ───────────────────────────────
    const expandableConfig = useMemo(() => {
        const base = draggable
            ? { childrenColumnName, ...expandable, expandIconColumnIndex: 1 }
            : expandable;
        return { ...base, onExpand: handleExpand };
    }, [draggable, expandable, handleExpand, childrenColumnName]);

    // ─── Custom row component ────────────────────────────
    const components = useMemo(() => {
        if (!draggable) return undefined;

        return {
            body: {
                row: (props: any) => {
                    const key = String(props['data-row-key']);
                    const meta = nodeMap.get(key);

                    return (
                        <DraggableRow
                            {...props}
                            index={meta?.indexAmongSiblings ?? 0}
                            draggable={draggable}
                            level={meta?.level ?? 0}
                            parentKey={meta?.parentKey ?? null}
                        />
                    );
                }
            }
        };
    }, [draggable, nodeMap]);

    // ─── Render ──────────────────────────────────────────
    const table = (
        <Table
            {...restProps}
            dataSource={dataSource}
            columns={allColumns}
            expandable={expandableConfig}
            components={components}
        />
    );

    if (!draggable) return table;

    return (
        <TreeDndProvider nodeMap={nodeMap} onReorder={onReorder}>
            {table}
        </TreeDndProvider>
    );
};
