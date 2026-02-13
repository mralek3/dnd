import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachClosestEdge,
    extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { useTreeDnd } from './tree-dnd-context';
import { computeDropResult } from './compute-drop-result';
import type { RawInstruction } from './compute-drop-result';
import type { DropTargetData, DragSourceData } from './types';

// Символ для маркировки make-child в userData
const MAKE_CHILD_KEY = Symbol('make-child');

interface UseDropTargetRowProps {
    rowKey: string;
    rowIndex: number;
    level: number;
    enabled: boolean;
}

/**
 * Hook для drop target на строке таблицы.
 *
 * Определяет raw-инструкцию (above / below / make-child) на основе:
 * - closest-edge hitbox (top/bottom) для элементов того же уровня
 * - простого make-child для элементов уровнем выше
 *
 * Затем передаёт инструкцию в computeDropResult для применения правил 1—5
 * и обновляет centralised indicator store.
 */
export const useDropTargetRow = ({
    rowKey,
    rowIndex,
    level,
    enabled
}: UseDropTargetRowProps) => {
    const rowRef = useRef<HTMLTableRowElement>(null);
    const { nodeMap, indicatorStore, onReorder } = useTreeDnd();

    // Храним в ref чтобы не пересоздавать dropTarget при изменении nodeMap/onReorder
    const nodeMapRef = useRef(nodeMap);
    nodeMapRef.current = nodeMap;

    const onReorderRef = useRef(onReorder);
    onReorderRef.current = onReorder;

    useEffect(() => {
        const element = rowRef.current;
        if (!enabled || !element) return;

        return dropTargetForElements({
            element,

            getData: ({ input, element, source }) => {
                const data: DropTargetData = { rowKey, rowIndex };
                const sourceData = source.data as unknown as DragSourceData;

                // Определяем, какой тип hit detection использовать
                if (sourceData.level === level) {
                    // Тот же уровень → closest-edge (top/bottom)
                    return attachClosestEdge(
                        data as unknown as Record<string | symbol, unknown>,
                        { input, element, allowedEdges: ['top', 'bottom'] }
                    );
                }

                if (sourceData.level - 1 === level) {
                    // Уровень потенциального родителя → make-child
                    return { ...data, [MAKE_CHILD_KEY]: true };
                }

                // Другие уровни → нет валидных инструкций
                return data as unknown as Record<string | symbol, unknown>;
            },

            onDragEnter: ({ source, self }) => {
                updateIndicator(source, self.data);
            },

            onDrag: ({ source, self }) => {
                updateIndicator(source, self.data);
            },

            onDragLeave: () => {
                indicatorStore.set(null);
            },

            onDrop: ({ source, self }) => {
                indicatorStore.set(null);

                const raw = extractRawInstruction(self.data);
                if (!raw) return;

                const sourceData = source.data as unknown as DragSourceData;
                const result = computeDropResult(
                    sourceData.rowKey,
                    rowKey,
                    raw,
                    nodeMapRef.current
                );

                if (result.event) {
                    onReorderRef.current?.(result.event);
                }
            }
        });

        function updateIndicator(
            source: { data: Record<string, unknown> },
            selfData: Record<string | symbol, unknown>
        ) {
            const raw = extractRawInstruction(selfData);
            if (!raw) {
                indicatorStore.set(null);
                return;
            }

            const sourceData = source.data as unknown as DragSourceData;
            const result = computeDropResult(
                sourceData.rowKey,
                rowKey,
                raw,
                nodeMapRef.current
            );

            indicatorStore.set(result.indicator);
        }

        function extractRawInstruction(
            data: Record<string | symbol, unknown>
        ): RawInstruction | null {
            // Проверяем make-child маркер
            if (data[MAKE_CHILD_KEY]) return 'make-child';

            // Проверяем closest-edge
            const edge = extractClosestEdge(data);
            if (edge === 'top') return 'above';
            if (edge === 'bottom') return 'below';

            return null;
        }
    }, [rowKey, rowIndex, level, enabled, indicatorStore]);

    return { rowRef };
};
