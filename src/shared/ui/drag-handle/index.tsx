import { Button } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';

interface DragHandleProps {
    className?: string;
    style?: CSSProperties;
    /** Внутренний ref для подключения drag функциональности */
    innerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Кнопка для перетаскивания строк таблицы
 *
 * Отображает иконку "holder" и служит точкой захвата для drag-and-drop.
 * innerRef привязывается к кнопке для подключения drag функциональности
 * через pragmatic-drag-and-drop.
 */
export const DragHandle = ({ className, style, innerRef }: DragHandleProps) => {
    return (
        <Button
            ref={innerRef as any}
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
