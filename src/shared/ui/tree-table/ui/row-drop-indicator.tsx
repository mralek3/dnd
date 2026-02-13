import type { Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';

/**
 * Возвращает inline-стили для <tr>, рисующие индикатор вставки
 * в зависимости от инструкции tree-item hitbox:
 *
 * - reorder-above  → синяя линия сверху (box-shadow inset top)
 * - reorder-below  → синяя линия снизу (box-shadow inset bottom)
 * - make-child     → обводка всей строки (outline), показывая что элемент
 *                     будет вложен как дочерний
 * - reparent       → синяя линия снизу (аналогично reorder-below)
 */
export function getDropIndicatorStyle(instruction: Instruction | null): React.CSSProperties {
    if (!instruction) return {};

    switch (instruction.type) {
        case 'reorder-above':
            return { boxShadow: 'inset 0 2px 0 0 #1890ff' };

        case 'reorder-below':
            return { boxShadow: 'inset 0 -2px 0 0 #1890ff' };

        case 'make-child':
            return {
                outline: '2px solid #1890ff',
                outlineOffset: '-2px',
                borderRadius: '4px'
            };

        case 'reparent':
            return { boxShadow: 'inset 0 -2px 0 0 #1890ff' };

        case 'instruction-blocked':
            return {};

        default:
            return {};
    }
}
