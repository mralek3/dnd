import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useSyncExternalStore
} from 'react';
import type { TreeNodeMeta, VisualIndicator, IndicatorType, ReorderEvent } from './types';

// ─── External store ──────────────────────────────────────────────────
// Минимальный store для индикатора. useSyncExternalStore обеспечивает
// ре-рендер только тех строк, чьё состояние индикатора изменилось.

const createIndicatorStore = () => {
    let current: VisualIndicator | null = null;
    const listeners = new Set<() => void>();

    return {
        get: () => current,
        set: (next: VisualIndicator | null) => {
            if (current?.rowKey === next?.rowKey && current?.type === next?.type) {
                return;
            }

            current = next;
            listeners.forEach(l => l());
        },
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        }
    };
};

export type IndicatorStore = ReturnType<typeof createIndicatorStore>;

// ─── Context ─────────────────────────────────────────────────────────

interface TreeDndContextValue {
    /** Карта метаданных узлов дерева { key → TreeNodeMeta } */
    nodeMap: Map<string, TreeNodeMeta>;
    /** Store для управления индикатором */
    indicatorStore: IndicatorStore;
    /** Коллбек завершения перетаскивания */
    onReorder?: (event: ReorderEvent) => void;
}

const TreeDndContext = createContext<TreeDndContextValue | null>(null);

// ─── Hooks ───────────────────────────────────────────────────────────

/** Получить значения контекста (бросает ошибку вне провайдера) */
export const useTreeDnd = () => {
    const ctx = useContext(TreeDndContext);

    if (!ctx) {
        throw new Error('useTreeDnd must be used inside TreeDndProvider');
    }

    return ctx;
};

/**
 * Возвращает тип индикатора для конкретной строки.
 * Строка ре-рендерится ТОЛЬКО когда её индикатор меняется (null ↔ type).
 */
export const useIndicatorForRow = (rowKey: string): IndicatorType | null => {
    const { indicatorStore } = useTreeDnd();

    const getSnapshot = useCallback(() => {
        const ind = indicatorStore.get();
        return ind?.rowKey === rowKey ? ind.type : null;
    }, [indicatorStore, rowKey]);

    return useSyncExternalStore(indicatorStore.subscribe, getSnapshot);
};

// ─── Provider ────────────────────────────────────────────────────────

interface TreeDndProviderProps {
    nodeMap: Map<string, TreeNodeMeta>;
    onReorder?: (event: ReorderEvent) => void;
    children: React.ReactNode;
}

export const TreeDndProvider = ({ nodeMap, onReorder, children }: TreeDndProviderProps) => {
    // Store создаётся один раз и не пересоздаётся
    const storeRef = useRef<IndicatorStore | null>(null);

    if (!storeRef.current) {
        storeRef.current = createIndicatorStore();
    }

    const value = useMemo<TreeDndContextValue>(
        () => ({
            nodeMap,
            indicatorStore: storeRef.current!,
            onReorder
        }),
        [nodeMap, onReorder]
    );

    return <TreeDndContext.Provider value={value}>{children}</TreeDndContext.Provider>;
};
