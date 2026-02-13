import { Button } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';

interface DragHandleProps {
    className?: string;
    style?: CSSProperties;

    innerRef?: React.RefObject<HTMLElement | null>;
}

export const DragHandle = ({ className, style, innerRef }: DragHandleProps) => {
    return (
        <Button
            ref={innerRef}
            type='text'
            icon={<HolderOutlined />}
            className={className}
            style={{
                cursor: 'grab',
                ...style
            }}
            aria-label='Drag to reorder'
        />
    );
};