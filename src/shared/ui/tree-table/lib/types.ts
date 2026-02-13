/**
 * Типы для drag-and-drop функциональности в древовидной таблице
 */

import type { Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';

/**
 * Реэкспорт типа Instruction для использования снаружи.
 *
 * Instruction — это результат работы tree-item hitbox:
 * - 'reorder-above'  — вставка над строкой
 * - 'reorder-below'  — вставка под строкой
 * - 'make-child'     — перетаскивание В строку (сделать дочерним)
 * - 'reparent'       — переместить на другой уровень
 * - 'instruction-blocked' — действие заблокировано
 */
export type { Instruction };

/**
 * Информация о перетаскиваемой строке (источник)
 */
export interface DragSourceData {
    type: 'tree-row';
    rowKey: string;
    rowIndex: number;
}

/**
 * Информация о целевой строке (куда перетаскиваем)
 */
export interface DropTargetData {
    rowKey: string;
    rowIndex: number;
}

/**
 * Событие завершения перетаскивания.
 * Содержит всю информацию для обработки изменения порядка строк.
 */
export interface ReorderEvent {
    /** ID перетаскиваемой строки */
    sourceKey: string;
    /** Индекс источника в массиве данных */
    sourceIndex: number;
    /** ID целевой строки */
    targetKey: string;
    /** Индекс цели в массиве данных */
    targetIndex: number;
    /** Инструкция от tree-item hitbox (позиция + уровень) */
    instruction: Instruction | null;
}
