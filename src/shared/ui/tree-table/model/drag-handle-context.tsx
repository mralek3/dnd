import { createContext, useContext } from 'react';

interface DragHandleContextValue {
    dragHandleRef: React.RefObject<HTMLElement | null>;
}

export const DragHandleContext = createContext<DragHandleContextValue | null>(null);

export const useDragHandleRef = () => {
    const context = useContext(DragHandleContext);
    return context?.dragHandleRef;
};