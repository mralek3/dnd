import { useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { useDraggableRow } from '../lib/use-draggable-row';
import { useDropTargetRow } from '../lib/use-drop-target-row';
import { DragHandleContext } from '../lib/drag-handle-context';
import { RowDropIndicator } from './row-drop-indicator';
import type { ReorderEvent } from '../lib/types';

/**
 * Параметры компонента перетаскиваемой строки
 */
interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Уникальный ключ строки (data-row-key от antd) */
    'data-row-key': string;
    /** Индекс строки в массиве */
    index: number;
    /** Включено ли перетаскивание */
    draggable: boolean;
    /** Коллбек при завершении перетаскивания */
    onReorder?: (event: ReorderEvent) => void;
}

/**
 * Компонент строки таблицы с поддержкой drag-and-drop
 *
 * Используется как кастомный компонент строки в antd Table через components.body.row.
 * Добавляет функциональность перетаскивания и отображает индикатор вставки.
 */
export const DraggableRow = ({
    'data-row-key': rowKey,
    index,
    draggable: isDraggable,
    onReorder,
    children,
    ...restProps
}: DraggableRowProps) => {
    // Hook для drag handle (будет подключен к кнопке внутри строки)
    const dragHandleRef = useDraggableRow({
        rowKey,
        rowIndex: index,
        enabled: isDraggable
    });

    // Hook для drop target (вся строка)
    const { rowRef, closestEdge } = useDropTargetRow({
        rowKey,
        rowIndex: index,
        enabled: isDraggable,
        onReorder
    });

    // Прокидываем ref для drag handle через контекст React
    // Это позволит DragHandle компоненту получить ref без явной передачи
    const contextValue = useMemo(
        () => ({ dragHandleRef }),
        [dragHandleRef]
    );

    return (
        <DragHandleContext.Provider value={contextValue}>
            <tr
                ref={rowRef}
                data-row-key={rowKey}
                style={{ position: 'relative' }} // Для позиционирования индикатора
                {...restProps}
            >
                {children}
                {/* Индикатор вставки */}
                <RowDropIndicator edge={closestEdge} />
            </tr>
        </DragHandleContext.Provider>
    );
};
