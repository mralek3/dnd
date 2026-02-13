import { useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import type { ItemMode } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { useDraggableRow } from '../lib/use-draggable-row';
import { useDropTargetRow } from '../lib/use-drop-target-row';
import { DragHandleContext } from '../lib/drag-handle-context';
import { getDropIndicatorStyle } from './row-drop-indicator';
import type { ReorderEvent } from '../lib/types';

/**
 * Параметры компонента перетаскиваемой строки
 */
interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Уникальный ключ строки (data-row-key от antd) */
    'data-row-key': string;
    /** Индекс строки в массиве */
    index: number;
    /** Уровень вложенности строки (0 — корень) */
    level: number;
    /** Режим элемента дерева (standard / expanded / last-in-group) */
    mode: ItemMode;
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
    level,
    mode,
    draggable: isDraggable,
    onReorder,
    children,
    style,
    ...restProps
}: DraggableRowProps) => {
    // Hook для drag handle (будет подключен к кнопке внутри строки)
    const dragHandleRef = useDraggableRow({
        rowKey,
        rowIndex: index,
        enabled: isDraggable
    });

    // Hook для drop target (вся строка)
    const { rowRef, instruction } = useDropTargetRow({
        rowKey,
        rowIndex: index,
        level,
        mode,
        enabled: isDraggable,
        onReorder
    });

    // Прокидываем ref для drag handle через контекст React
    // Это позволит DragHandle компоненту получить ref без явной передачи
    const contextValue = useMemo(
        () => ({ dragHandleRef }),
        [dragHandleRef]
    );

    // Стили индикатора через box-shadow / outline (надёжно работает на <tr>)
    const indicatorStyle = getDropIndicatorStyle(instruction);

    return (
        <DragHandleContext.Provider value={contextValue}>
            <tr
                ref={rowRef}
                data-row-key={rowKey}
                style={{ ...style, ...indicatorStyle }}
                {...restProps}
            >
                {children}
            </tr>
        </DragHandleContext.Provider>
    );
};
