import { Table } from 'antd';
import type { TableProps } from 'antd';

interface TreeTableProps<T> extends TableProps<T> {
    // Дополнительные пропсы при необходимости
}

export const TreeTable = <T extends object>(props: TreeTableProps<T>) => {
    return <Table {...props} />;
};
