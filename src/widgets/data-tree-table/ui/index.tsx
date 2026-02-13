import { useMemo } from 'react';
import { TreeTable, buildTreeFromFlat } from '@/shared/ui';
import type { ReorderEvent, FlatNode } from '@/shared/ui';
import type { TableColumnsType } from 'antd';

interface DataNode extends FlatNode {
    key: string;
    name: string;
    age: number;
    address: string;
    parentId?: string | null;
    children?: DataNode[];
}

const columns: TableColumnsType<DataNode> = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name'
    },
    {
        title: 'Age',
        dataIndex: 'age',
        key: 'age',
        width: '12%'
    },
    {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
        width: '30%'
    }
];

/**
 * Плоский список данных с UUID ключами и parentId
 * (как приходит с бэкенда)
 */
const flatMockData: DataNode[] = [
    // Корневой элемент 1
    {
        key: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Brown',
        age: 60,
        address: 'New York No. 1 Lake Park',
        parentId: null
    },
    // Дети элемента 1
    {
        key: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 2 Lake Park',
        parentId: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
        key: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        name: 'Joe Black',
        age: 32,
        address: 'Sydney No. 1 Lake Park',
        parentId: '550e8400-e29b-41d4-a716-446655440000'
    },
    // Внуки элемента 1 (дети Jim Green)
    {
        key: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        name: 'Jimmy Green',
        age: 16,
        address: 'London No. 3 Lake Park',
        parentId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    },
    {
        key: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
        name: 'Sammy Green',
        age: 18,
        address: 'London No. 4 Lake Park',
        parentId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    },
    // Внуки элемента 1 (дети Joe Black)
    {
        key: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
        name: 'Joey Black',
        age: 8,
        address: 'Sydney No. 2 Lake Park',
        parentId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
    },
    // Корневой элемент 2
    {
        key: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
        name: 'Jane Doe',
        age: 45,
        address: 'Los Angeles No. 5 Street',
        parentId: null
    },
    // Дети элемента 2
    {
        key: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
        name: 'Janet Doe',
        age: 20,
        address: 'Los Angeles No. 6 Street',
        parentId: '6ba7b815-9dad-11d1-80b4-00c04fd430c8'
    },
    // Внуки элемента 2
    {
        key: '6ba7b817-9dad-11d1-80b4-00c04fd430c8',
        name: 'Jennifer Doe',
        age: 2,
        address: 'Los Angeles No. 7 Street',
        parentId: '6ba7b816-9dad-11d1-80b4-00c04fd430c8'
    }
];

export const DataTreeTable = () => {
    /**
     * Преобразуем плоский список с parentId в древовидную структуру с children
     */
    const treeData = useMemo(() => {
        return buildTreeFromFlat<DataNode>(flatMockData);
    }, []);

    /**
     * Обработчик завершения перетаскивания строки
     * Выводит информацию о перетаскивании в консоль
     */
    const handleReorder = (event: ReorderEvent) => {
        console.log('Reorder event:', {
            sourceKey: event.sourceKey,
            targetKey: event.targetKey,
            position: event.position
        });

        // Здесь будет логика для фактического изменения порядка данных
        // Например:
        // 1. Обновить parentId у sourceKey
        // 2. Пересчитать порядок элементов (если есть поле order/position)
        // 3. Отправить изменения на бэкенд
        // 4. Обновить локальное состояние
    };

    return (
        <TreeTable
            columns={columns}
            dataSource={treeData}
            pagination={false}
            draggable={true}
            onReorder={handleReorder}
        />
    );
};
