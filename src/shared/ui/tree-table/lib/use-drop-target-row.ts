import { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachInstruction,
    extractInstruction
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import type {
    Instruction,
    ItemMode
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import type { DropTargetData, ReorderEvent, DragSourceData } from './types';

/**
 * Параметры для hook использования drop target
 */
interface UseDropTargetRowProps {
    /** Уникальный ключ строки */
    rowKey: string;
    /** Индекс строки в массиве данных */
    rowIndex: number;
    /** Уровень вложенности строки (0 — корень) */
    level: number;
    /** Режим элемента дерева (standard, expanded, last-in-group) */
    mode: ItemMode;
    /** Включено ли перетаскивание */
    enabled: boolean;
    /** Коллбек вызываемый при завершении перетаскивания */
    onReorder?: (event: ReorderEvent) => void;
}

/** Отступ на один уровень вложенности (в px) */
const INDENT_PER_LEVEL = 24;

/**
 * Hook для добавления drop target функциональности к строке таблицы.
 *
 * Использует tree-item hitbox из pragmatic-drag-and-drop для определения
 * позиции курсора: reorder-above, reorder-below или make-child.
 *
 * @returns объект с ref для строки и текущей инструкцией (для индикатора)
 */
export const useDropTargetRow = ({
    rowKey,
    rowIndex,
    level,
    mode,
    enabled,
    onReorder
}: UseDropTargetRowProps) => {
    const rowRef = useRef<HTMLTableRowElement>(null);

    // Текущая инструкция (для отображения индикатора)
    const [instruction, setInstruction] = useState<Instruction | null>(null);

    useEffect(() => {
        const element = rowRef.current;

        // Если перетаскивание выключено или элемент не найден — ничего не делаем
        if (!enabled || !element) return;

        // Регистрируем элемент как drop target
        return dropTargetForElements({
            element,

            // Получаем данные о drop target и добавляем tree-item инструкцию
            getData: ({ input, element }) => {
                const data: DropTargetData = {
                    rowKey,
                    rowIndex
                };

                // attachInstruction определяет позицию курсора:
                // - верхние ~25% → reorder-above
                // - нижние ~25% → reorder-below
                // - центр → make-child
                return attachInstruction(
                    data as unknown as Record<string | symbol, unknown>,
                    {
                        input,
                        element,
                        currentLevel: level,
                        indentPerLevel: INDENT_PER_LEVEL,
                        mode
                    }
                );
            },

            // Когда курсор входит в область строки
            onDragEnter: ({ self }) => {
                setInstruction(extractInstruction(self.data));
            },

            // Когда курсор движется внутри строки
            onDrag: ({ self }) => {
                setInstruction(extractInstruction(self.data));
            },

            // Когда курсор покидает область строки
            onDragLeave: () => {
                setInstruction(null);
            },

            // Когда элемент отпущен над строкой
            onDrop: ({ source, self }) => {
                // Сбрасываем индикатор
                setInstruction(null);

                // Извлекаем данные источника (перетаскиваемая строка)
                const sourceData = source.data as unknown as DragSourceData;

                // Извлекаем данные цели (текущая строка)
                const targetData = self.data as unknown as DropTargetData;

                // Извлекаем инструкцию
                const dropInstruction = extractInstruction(self.data);

                // Вызываем коллбек с полной информацией о перетаскивании
                onReorder?.({
                    sourceKey: sourceData.rowKey,
                    sourceIndex: sourceData.rowIndex,
                    targetKey: targetData.rowKey,
                    targetIndex: targetData.rowIndex,
                    instruction: dropInstruction
                });
            }
        });
    }, [rowKey, rowIndex, level, mode, enabled, onReorder]);

    return {
        rowRef,
        instruction // Для отображения drop indicator
    };
};
