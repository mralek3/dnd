import { Button } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';

interface DragHandleProps {
  className?: string;
  style?: CSSProperties;
}

export const DragHandle = ({ className, style }: DragHandleProps) => {
  return (
    <Button
      type="text"
      icon={<HolderOutlined />}
      className={className}
      style={{
        cursor: 'grab',
        ...style
      }}
      aria-label="Drag to reorder"
    />
  );
};
