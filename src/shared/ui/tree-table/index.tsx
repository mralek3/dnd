import { useMemo, useCallback, useState, useEffect } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import type { ItemMode } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { DragHandle } from '../drag-handle';
import { DraggableRow } from './ui/draggable-row';
import { useDragHandleRef } from './lib/drag-handle-context';
import type { ReorderEvent } from './lib/types';

/**
 * Компонент ячейки с drag handle.
 *
 * Вынесен в отдельный компонент, чтобы хук useDragHandleRef()
 * вызывался в собственном контексте компонента, а не внутри
 * render-функции колонки (что нарушает правила хуков React).
 */
const DragHandleCell = () => {
    const dragHandleRef = useDragHandleRef();
    return <DragHandle innerRef={dragHandleRef} />;
};

/**
 * Метаданные строки для tree-item hitbox
 */
interface RowMeta {
    level: number;
    mode: ItemMode;
}

/**
 * Рекурсивно строит карту { rowKey → RowMeta } по дереву данных.
 *
 * @param data       — массив строк текущего уровня
 * @param level      — уровень вложенности (0 = корень)
 * @param map        — аккумулятор
 * @param expandedKeys — набор раскрытых ключей
 * @param childrenColumnName — имя поля с дочерними элементами
 */
function buildRowMetaMap<T extends Record<string, any>>(
    data: readonly T[],
    level: number,
    map: Map<string, RowMeta>,
    expandedKeys: Set<string>,
    childrenColumnName: string
): void {
    data.forEach((item, idx) => {
        const key = String(item.key);
        const children: T[] | undefined = item[childrenColumnName];
        const hasChildren = Array.isArray(children) && children.length > 0;
        const isExpanded = hasChildren && expandedKeys.has(key);

        // Определяем mode для tree-item hitbox:
        // - 'expanded'      — узел раскрыт (имеет видимых детей)
        // - 'last-in-group' — последний элемент на данном уровне
        // - 'standard'      — обычный узел
        let mode: ItemMode = 'standard';
        if (isExpanded) {
            mode = 'expanded';
        } else if (idx === data.length - 1) {
            mode = 'last-in-group';
        }

        map.set(key, { level, mode });

        // Рекурсивно обрабатываем дочерние элементы (только если раскрыты)
        if (isExpanded && children) {
            buildRowMetaMap(children, level + 1, map, expandedKeys, childrenColumnName);
        }
    });
}

interface TreeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
    columns: TableColumnsType<T>;
    draggable?: boolean;
    onReorder?: (event: ReorderEvent) => void;
}

/**
 * Компонент древовидной таблицы с поддержкой drag-and-drop
 */
export const TreeTable = <T extends object>({
    columns,
    draggable = false,
    expandable,
    onReorder,
    dataSource,
    ...restProps
}: TreeTableProps<T>) => {
    const childrenColumnName = (expandable as any)?.childrenColumnName ?? 'children';

    // Отслеживаем раскрытые строки для определения mode
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    // При монтировании: по умолчанию antd Table с defaultExpandAllRows раскрывает все
    // Ловим expand/collapse через expandable.onExpand
    const handleExpand = useCallback(
        (expanded: boolean, record: T) => {
            const key = String((record as any).key);
            setExpandedKeys(prev => {
                const next = new Set(prev);
                if (expanded) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
                return next;
            });

            // Вызываем оригинальный onExpand если был передан
            (expandable as any)?.onExpand?.(expanded, record);
        },
        [expandable]
    );

    // Синхронизируем с controlled expandedRowKeys если передан
    useEffect(() => {
        if ((expandable as any)?.expandedRowKeys) {
            setExpandedKeys(
                new Set((expandable as any).expandedRowKeys.map(String))
            );
        }
    }, [(expandable as any)?.expandedRowKeys]);

    // Строим карту метаданных строк { key → { level, mode } }
    const rowMetaMap = useMemo(() => {
        const map = new Map<string, RowMeta>();
        if (dataSource) {
            buildRowMetaMap(
                dataSource as readonly Record<string, any>[],
                0,
                map,
                expandedKeys,
                childrenColumnName
            );
        }
        return map;
    }, [dataSource, expandedKeys, childrenColumnName]);

    // Добавляем столбец с drag handle если включен режим перетаскивания
    const allColumns = useMemo(() => {
        if (!draggable) return columns;

        const dragColumn = {
            key: '__drag__',
            title: '',
            width: 40,
            render: () => <DragHandleCell />
        };

        // Добавляем drag столбец первым
        return [dragColumn, ...columns];
    }, [columns, draggable]);

    // Настройка expandable для корректного отображения expand иконки
    const expandableConfig = useMemo(() => {
        const base = draggable
            ? {
                  childrenColumnName,
                  ...expandable,
                  expandIconColumnIndex: 1 // Expand иконка после drag handle
              }
            : expandable;

        // Подключаем свой onExpand для отслеживания раскрытых строк
        return {
            ...base,
            onExpand: handleExpand
        };
    }, [draggable, expandable, handleExpand, childrenColumnName]);

    // Кастомный компонент строки с поддержкой drag-and-drop
    const components = useMemo(() => {
        if (!draggable) return undefined;

        return {
            body: {
                row: (props: any) => {
                    const key = props['data-row-key'];
                    const meta = rowMetaMap.get(String(key));

                    return (
                        <DraggableRow
                            {...props}
                            draggable={draggable}
                            level={meta?.level ?? 0}
                            mode={meta?.mode ?? 'standard'}
                            onReorder={onReorder}
                        />
                    );
                }
            }
        };
    }, [draggable, onReorder, rowMetaMap]);

    return (
        <Table
            {...restProps}
            dataSource={dataSource}
            columns={allColumns}
            expandable={expandableConfig}
            components={components}
        />
    );
};
