import { useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { useDraggableRow } from '../model/hooks/use-draggable-row';
import { useDropTargetRow } from '../model/hooks/use-drop-target-row';
import { DragHandleContext } from '../model/drag-handle-context';
import { useIndicatorForRow } from '../model/tree-dnd-context';
import { getDropIndicatorStyle } from './row-drop-indicator';

interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
    index: number;
    level: number;
    parentKey: string | null;
    draggable: boolean;
}

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

    const indicatorType = useIndicatorForRow(rowKey);
    const indicatorStyle = getDropIndicatorStyle(indicatorType);

    const contextValue = useMemo(() => ({ dragHandleRef }), [dragHandleRef]);

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