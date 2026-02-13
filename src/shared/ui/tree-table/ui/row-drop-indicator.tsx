import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

/**
 * Возвращает inline-стили для <tr>, рисующие индикатор вставки
 * через box-shadow (надёжно работает на <tr> во всех браузерах).
 *
 * Прежний вариант рендерил <div> внутри <tr>, что невалидно в HTML.
 * Браузеры выносили <div> за структуру таблицы, из-за чего индикатор
 * отображался над/под всей таблицей, а не над/под конкретной строкой.
 */
export function getDropIndicatorStyle(edge: Edge | null): React.CSSProperties {
    if (!edge) return {};

    // Используем box-shadow — он рисуется относительно элемента
    // и корректно работает с <tr> (в отличие от position: relative + absolute дочернего).
    // inset — для внутреннего shadow, не сдвигает layout.
    if (edge === 'top') {
        return { boxShadow: 'inset 0 2px 0 0 #1890ff' };
    }

    return { boxShadow: 'inset 0 -2px 0 0 #1890ff' };
}
