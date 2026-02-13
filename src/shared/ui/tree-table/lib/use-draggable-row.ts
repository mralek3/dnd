import { useEffect, useRef } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DragSourceData } from './types';

/**
 * Параметры для hook использования перетаскивания строки
 */
interface UseDraggableRowProps {
    /** Уникальный ключ строки */
    rowKey: string;
    /** Индекс строки в массиве данных */
    rowIndex: number;
    /** Включено ли перетаскивание */
    enabled: boolean;
}

/**
 * Hook для добавления drag функциональности к drag handle кнопке
 *
 * Делает drag handle перетаскиваемым элементом и передает данные о строке
 * при начале перетаскивания.
 *
 * @returns ref для привязки к drag handle элементу
 */
export const useDraggableRow = ({ rowKey, rowIndex, enabled }: UseDraggableRowProps) => {
    const dragHandleRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = dragHandleRef.current;

        // Если перетаскивание выключено или элемент не найден - ничего не делаем
        if (!enabled || !element) return;

        // Регистрируем элемент как перетаскиваемый
        return draggable({
            element,
            // Данные, которые будут доступны во время перетаскивания
            getInitialData: (): DragSourceData => ({
                type: 'tree-row',
                rowKey,
                rowIndex
            })
        });
    }, [rowKey, rowIndex, enabled]);

    return dragHandleRef;
};
