import { useMemo } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
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
    ...restProps
}: TreeTableProps<T>) => {
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
        if (!draggable) return expandable;

        // Конфигурация для размещения expand во втором столбце (index 1)
        return {
            childrenColumnName: 'children',
            ...expandable,
            // Expand иконка будет в столбце с индексом 1 (Name)
            expandIconColumnIndex: 1
        };
    }, [draggable, expandable]);

    // Кастомный компонент строки с поддержкой drag-and-drop
    const components = useMemo(() => {
        if (!draggable) return undefined;

        return {
            body: {
                row: (props: any) => (
                    <DraggableRow
                        {...props}
                        draggable={draggable}
                        onReorder={onReorder}
                    />
                )
            }
        };
    }, [draggable, onReorder]);

    return (
        <Table
            {...restProps}
            columns={allColumns}
            expandable={expandableConfig}
            components={components}
        />
    );
};
