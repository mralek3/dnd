import { useEffect, useRef } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface UseDraggableRowProps {
    rowKey: string;
    rowIndex: number;
    level: number;
    parentKey: string | null;
    enabled: boolean;
}

/**
 * Hook для добавления drag функциональности к drag handle кнопке.
 *
 * Передаёт level и parentKey в source data, что позволяет drop target
 * определить допустимые позиции для перетаскивания (правило 1).
 */
export const useDraggableRow = ({
    rowKey,
    rowIndex,
    level,
    parentKey,
    enabled
}: UseDraggableRowProps) => {
    const dragHandleRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = dragHandleRef.current;
        if (!enabled || !element) return;

        return draggable({
            element,
            getInitialData: () =>
                ({
                    type: 'tree-row',
                    rowKey,
                    rowIndex,
                    level,
                    parentKey
                }) as unknown as Record<string, unknown>
        });
    }, [rowKey, rowIndex, level, parentKey, enabled]);

    return dragHandleRef;
};
