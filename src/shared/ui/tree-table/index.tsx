import { useMemo } from 'react';
import { Table } from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import { DragHandle } from '../drag-handle';

interface TreeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
    columns: TableColumnsType<T>;
    draggable?: boolean;
    onReorder?: (newData: T[]) => void;
}

export const TreeTable = <T extends object>({
    columns,
    draggable = false,
    expandable,
    ...restProps
}: TreeTableProps<T>) => {
    const allColumns = useMemo(() => {
        if (!draggable) return columns;

        const dragColumn = {
            key: '__drag__',
            title: '',
            width: 40,
            render: () => <DragHandle />
        };

        // Добавляем drag столбец первым
        return [dragColumn, ...columns];
    }, [columns, draggable]);

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

    return <Table {...restProps} columns={allColumns} expandable={expandableConfig} />;
};
