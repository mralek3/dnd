import { TreeTable } from '@/shared/ui';
import type { TableColumnsType } from 'antd';

interface DataNode {
    key: string;
    name: string;
    age: number;
    address: string;
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

const mockData: DataNode[] = [
    {
        key: '1',
        name: 'John Brown',
        age: 60,
        address: 'New York No. 1 Lake Park',
        children: [
            {
                key: '1-1',
                name: 'Jim Green',
                age: 42,
                address: 'London No. 2 Lake Park',
                children: [
                    {
                        key: '1-1-1',
                        name: 'Jimmy Green',
                        age: 16,
                        address: 'London No. 3 Lake Park'
                    },
                    {
                        key: '1-1-2',
                        name: 'Sammy Green',
                        age: 18,
                        address: 'London No. 4 Lake Park'
                    }
                ]
            },
            {
                key: '1-2',
                name: 'Joe Black',
                age: 32,
                address: 'Sydney No. 1 Lake Park',
                children: [
                    {
                        key: '1-2-1',
                        name: 'Joey Black',
                        age: 8,
                        address: 'Sydney No. 2 Lake Park'
                    }
                ]
            }
        ]
    },
    {
        key: '2',
        name: 'Jane Doe',
        age: 45,
        address: 'Los Angeles No. 5 Street',
        children: [
            {
                key: '2-1',
                name: 'Janet Doe',
                age: 20,
                address: 'Los Angeles No. 6 Street',
                children: [
                    {
                        key: '2-1-1',
                        name: 'Jennifer Doe',
                        age: 2,
                        address: 'Los Angeles No. 7 Street'
                    }
                ]
            }
        ]
    }
];

export const DataTreeTable = () => {
    return <TreeTable columns={columns} dataSource={mockData} pagination={false} />;
};
