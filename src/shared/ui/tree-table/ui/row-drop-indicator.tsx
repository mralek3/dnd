import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

/**
 * Параметры компонента индикатора вставки
 */
interface RowDropIndicatorProps {
    /** Позиция индикатора относительно строки */
    edge: Edge | null;
}

/**
 * Визуальный индикатор показывающий куда будет вставлена строка
 *
 * Отображается как синяя линия сверху или снизу строки в зависимости
 * от позиции курсора во время перетаскивания.
 */
export const RowDropIndicator = ({ edge }: RowDropIndicatorProps) => {
    // Если нет позиции - не отображаем индикатор
    if (!edge) return null;

    // Определяем стили в зависимости от позиции
    const style: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: '#1890ff', // Синий цвет Ant Design
        zIndex: 1,
        pointerEvents: 'none', // Индикатор не должен перехватывать события мыши
        ...(edge === 'top' ? { top: -1 } : { bottom: -1 })
    };

    return <div style={style} />;
};
