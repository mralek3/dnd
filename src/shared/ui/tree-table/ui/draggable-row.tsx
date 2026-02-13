import { useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { useDraggableRow } from '../lib/use-draggable-row';
import { useDropTargetRow } from '../lib/use-drop-target-row';
import { DragHandleContext } from '../lib/drag-handle-context';
import { useIndicatorForRow } from '../lib/tree-dnd-context';
import { getDropIndicatorStyle } from './row-drop-indicator';

interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
    index: number;
    level: number;
    parentKey: string | null;
    draggable: boolean;
}

/**
 * Компонент строки таблицы с поддержкой drag-and-drop.
 *
 * Индикатор берётся из централизованного store (через useIndicatorForRow),
 * а не из локального состояния drop-target'а. Это позволяет правилам 3 и 5
 * отображать индикатор на строке, отличной от той, над которой курсор.
 */
export const DraggableRow = ({
    'data-row-key': rowKey,
    index,
    level,
    parentKey,
    draggable: isDraggable,
    children,
    style,
    ...restProps
}: DraggableRowProps) => {
    const dragHandleRef = useDraggableRow({
        rowKey,
        rowIndex: index,
        level,
        parentKey,
        enabled: isDraggable
    });

    const { rowRef } = useDropTargetRow({
        rowKey,
        rowIndex: index,
        level,
        enabled: isDraggable
    });

    // Индикатор из centralized store
    const indicatorType = useIndicatorForRow(rowKey);
    const indicatorStyle = getDropIndicatorStyle(indicatorType);

    const contextValue = useMemo(
        () => ({ dragHandleRef }),
        [dragHandleRef]
    );

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
