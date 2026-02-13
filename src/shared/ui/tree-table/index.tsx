import { useMemo, useCallback, useState, useEffect } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import { DragHandle } from './ui/drag-handle';
import { DraggableRow } from './ui/draggable-row';
import { useDragHandleRef } from './model/drag-handle-context';
import { TreeDndProvider } from './model/tree-dnd-context';
import type { TreeNodeMeta, ReorderEvent } from './model/types';

const DragHandleCell = () => {
    const dragHandleRef = useDragHandleRef();
    return <DragHandle innerRef={dragHandleRef} />;
};

const buildNodeMap = <T extends Record<string, unknown>>(
    data: readonly T[],
    level: number,
    parentKey: string | null,
    map: Map<string, TreeNodeMeta>,
    expandedKeys: Set<string>,
    childrenColumnName: string
): void => {
    const siblingKeys = data.map(item => {
        return hasKeyProperty(item) ? String(item.key) : '';
    });

    data.forEach((item, idx) => {
        const key = hasKeyProperty(item) ? String(item.key) : '';
        const childrenProp = item[childrenColumnName];
        const children: T[] | undefined = Array.isArray(childrenProp) ? childrenProp : undefined;
        const hasChildren = Array.isArray(children) && children.length > 0;
        const isExpanded = hasChildren && expandedKeys.has(key);

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

        if (hasChildren) {
            buildNodeMap(children, level + 1, key, map, expandedKeys, childrenColumnName);
        }
    });
};

interface TreeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
    columns: TableColumnsType<T>;
    draggable?: boolean;
    onReorder?: (event: ReorderEvent) => void;
}

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

    const getExpandableProperty = <K extends string>(key: K): unknown => {
        if (!expandable || typeof expandable !== 'object') {
            return undefined;
        }

        const obj = expandable as unknown;
        return (obj as Record<string, unknown>)[key];
    };

    const childrenColumnNameValue = getExpandableProperty('childrenColumnName');
    const childrenColumnName =
        typeof childrenColumnNameValue === 'string' ? childrenColumnNameValue : 'children';

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

    const nodeMap = useMemo(() => {
        const map = new Map<string, TreeNodeMeta>();

        if (dataSource) {
            buildNodeMap(dataSource, 0, null, map, expandedKeys, childrenColumnName);
        }

        return map;
    }, [dataSource, expandedKeys, childrenColumnName]);

    const allColumns = useMemo(() => {
        if (!draggable) {
            return columns;
        }

        const dragColumn = {
            key: '__drag__',
            title: '',
            width: 40,
            render: () => <DragHandleCell />
        };
        return [dragColumn, ...columns];
    }, [columns, draggable]);

    const expandableConfig = useMemo(() => {
        const base = draggable
            ? { childrenColumnName, ...expandable, expandIconColumnIndex: 1 }
            : expandable;
        return { ...base, onExpand: handleExpand };
    }, [draggable, expandable, handleExpand, childrenColumnName]);

    const components = useMemo(() => {
        if (!draggable) {
            return undefined;
        }

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

    const table = (
        <Table
            {...restProps}
            dataSource={dataSource}
            columns={allColumns}
            expandable={expandableConfig}
            components={components}
        />
    );

    if (!draggable) {
        return table;
    }

    return (
        <TreeDndProvider nodeMap={nodeMap} onReorder={onReorder}>
            {table}
        </TreeDndProvider>
    );
};