/**
 * Типы для drag-and-drop функциональности в древовидной таблице
 */

/**
 * Информация о перетаскиваемой строке (источник)
 */
export interface DragSourceData {
    type: 'tree-row';
    rowKey: string;
    rowIndex: number;
    level: number;
    parentKey: string | null;
}

/**
 * Информация о целевой строке (куда перетаскиваем)
 */
export interface DropTargetData {
    rowKey: string;
    rowIndex: number;
}

/**
 * Тип визуального индикатора
 */
export type IndicatorType = 'above' | 'below' | 'make-child';

/**
 * Визуальный индикатор — на какой строке и какого типа
 */
export interface VisualIndicator {
    rowKey: string;
    type: IndicatorType;
}

/**
 * Метаданные узла дерева для вычисления правил перетаскивания
 */
export interface TreeNodeMeta {
    key: string;
    level: number;
    parentKey: string | null;
    /** Ключи прямых дочерних элементов (видимых, т.е. когда узел раскрыт) */
    childKeys: string[];
    hasChildren: boolean;
    isExpanded: boolean;
    /** Индекс среди siblings (дети одного родителя) */
    indexAmongSiblings: number;
    /** Ключи siblings (включая себя) */
    siblingKeys: string[];
}

/**
 * Событие завершения перетаскивания.
 */
export interface ReorderEvent {
    /** ID перетаскиваемой строки */
    sourceKey: string;
    /** ID целевой строки */
    targetKey: string;
    /** Позиция: над/под/внутрь целевой строки */
    position: 'above' | 'below' | 'make-child';
}
