import { useMemo, useCallback, useState, useEffect } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import { DragHandle } from '../drag-handle';
import { DraggableRow } from './ui/draggable-row';
import { useDragHandleRef } from './lib/drag-handle-context';
import { TreeDndProvider } from './lib/tree-dnd-context';
import type { TreeNodeMeta, ReorderEvent } from './lib/types';

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
function buildNodeMap<T extends Record<string, any>>(
    data: readonly T[],
    level: number,
    parentKey: string | null,
    map: Map<string, TreeNodeMeta>,
    expandedKeys: Set<string>,
    childrenColumnName: string
): void {
    const siblingKeys = data.map(item => String(item.key));

    data.forEach((item, idx) => {
        const key = String(item.key);
        const children: T[] | undefined = item[childrenColumnName];
        const hasChildren = Array.isArray(children) && children.length > 0;
        const isExpanded = hasChildren && expandedKeys.has(key);

        // childKeys — только непосредственные дети.
        // Заполняются даже для свёрнутых узлов (нужно для правила 4 — no-op detection).
        const childKeys = hasChildren
            ? children.map((c: T) => String(c.key))
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

export const TreeTable = <T extends object>({
    columns,
    draggable = false,
    expandable,
    onReorder,
    dataSource,
    ...restProps
}: TreeTableProps<T>) => {
    const childrenColumnName = (expandable as any)?.childrenColumnName ?? 'children';

    // ─── Отслеживание раскрытых строк ───────────────────
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const handleExpand = useCallback(
        (expanded: boolean, record: T) => {
            const key = String((record as any).key);
            setExpandedKeys(prev => {
                const next = new Set(prev);
                expanded ? next.add(key) : next.delete(key);
                return next;
            });
            (expandable as any)?.onExpand?.(expanded, record);
        },
        [expandable]
    );

    useEffect(() => {
        if ((expandable as any)?.expandedRowKeys) {
            setExpandedKeys(new Set((expandable as any).expandedRowKeys.map(String)));
        }
    }, [(expandable as any)?.expandedRowKeys]);

    // ─── Полная карта метаданных узлов ───────────────────
    const nodeMap = useMemo(() => {
        const map = new Map<string, TreeNodeMeta>();
        if (dataSource) {
            buildNodeMap(
                dataSource as readonly Record<string, any>[],
                0,
                null,
                map,
                expandedKeys,
                childrenColumnName
            );
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
