import { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { DropTargetData, ReorderEvent, DragSourceData } from './types';

/**
 * Параметры для hook использования drop target
 */
interface UseDropTargetRowProps {
    /** Уникальный ключ строки */
    rowKey: string;
    /** Индекс строки в массиве данных */
    rowIndex: number;
    /** Включено ли перетаскивание */
    enabled: boolean;
    /** Коллбек вызываемый при завершении перетаскивания */
    onReorder?: (event: ReorderEvent) => void;
}

/**
 * Hook для добавления drop target функциональности к строке таблицы
 *
 * Делает строку целью для перетаскивания, определяет позицию курсора
 * относительно строки (сверху/снизу) и вызывает коллбек при drop.
 *
 * @returns объект с ref для строки и текущей позицией курсора (для индикатора)
 */
export const useDropTargetRow = ({
    rowKey,
    rowIndex,
    enabled,
    onReorder
}: UseDropTargetRowProps) => {
    const rowRef = useRef<HTMLTableRowElement>(null);

    // Состояние для отслеживания позиции курсора (для отображения индикатора)
    const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

    useEffect(() => {
        const element = rowRef.current;

        // Если перетаскивание выключено или элемент не найден - ничего не делаем
        if (!enabled || !element) return;

        // Регистрируем элемент как drop target
        return dropTargetForElements({
            element,

            // Получаем данные о drop target и добавляем информацию о позиции курсора
            getData: ({ input, element }) => {
                const data: DropTargetData = {
                    rowKey,
                    rowIndex
                };

                // Добавляем edge detection для определения позиции (top/bottom)
                return attachClosestEdge(data, {
                    input,
                    element,
                    allowedEdges: ['top', 'bottom'] // Разрешаем только верх и низ
                });
            },

            // Когда курсор входит в область строки
            onDragEnter: ({ self }) => {
                const edge = extractClosestEdge(self.data);
                setClosestEdge(edge);
            },

            // Когда курсор движется внутри строки
            onDrag: ({ self }) => {
                const edge = extractClosestEdge(self.data);
                setClosestEdge(edge);
            },

            // Когда курсор покидает область строки
            onDragLeave: () => {
                setClosestEdge(null);
            },

            // Когда элемент отпущен над строкой
            onDrop: ({ source, self }) => {
                // Сбрасываем индикатор
                setClosestEdge(null);

                // Извлекаем данные источника (перетаскиваемая строка)
                const sourceData = source.data as DragSourceData;

                // Извлекаем данные цели (текущая строка)
                const targetData = self.data as DropTargetData;

                // Извлекаем позицию курсора
                const edge = extractClosestEdge(self.data);

                // Вызываем коллбек с полной информацией о перетаскивании
                onReorder?.({
                    sourceKey: sourceData.rowKey,
                    sourceIndex: sourceData.rowIndex,
                    targetKey: targetData.rowKey,
                    targetIndex: targetData.rowIndex,
                    position: edge
                });
            }
        });
    }, [rowKey, rowIndex, enabled, onReorder]);

    return {
        rowRef,
        closestEdge // Для отображения drop indicator
    };
};
