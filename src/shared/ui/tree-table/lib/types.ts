/**
 * Типы для drag-and-drop функциональности в древовидной таблице
 */

/**
 * Позиция относительно целевой строки при перетаскивании
 * - 'top' - над строкой (вставка выше)
 * - 'bottom' - под строкой (вставка ниже)
 * - null - на самой строке (без точной позиции)
 */
export type DropPosition = 'top' | 'bottom' | null;

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
 * Событие завершения перетаскивания
 * Содержит всю информацию для обработки изменения порядка строк
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
    /** Позиция относительно целевой строки */
    position: DropPosition;
}
