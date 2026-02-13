import { createContext, useContext } from 'react';

/**
 * Контекст для передачи ref от DraggableRow к DragHandle
 *
 * Позволяет DragHandle компоненту получить ref для подключения
 * drag функциональности без явной передачи через props.
 */
interface DragHandleContextValue {
    dragHandleRef: React.RefObject<HTMLElement>;
}

export const DragHandleContext = createContext<DragHandleContextValue | null>(null);

/**
 * Hook для получения dragHandleRef в DragHandle компоненте
 * Используется внутри DragHandle для подключения к drag функциональности
 */
export const useDragHandleRef = () => {
    const context = useContext(DragHandleContext);
    return context?.dragHandleRef;
};
