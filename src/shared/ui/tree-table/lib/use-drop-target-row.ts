import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachClosestEdge,
    extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { useTreeDnd } from './tree-dnd-context';
import { computeDropResult } from './compute-drop-result';
import type { RawInstruction } from './compute-drop-result';
import type { DragSourceData } from './types';

// Символы для маркировки инструкций в userData
const MAKE_CHILD_KEY = Symbol('make-child');
const DESCENDANT_KEY = Symbol('descendant');

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
export const useDropTargetRow = ({ rowKey, rowIndex, level, enabled }: UseDropTargetRowProps) => {
    const rowRef = useRef<HTMLTableRowElement>(null);
    const { nodeMap, indicatorStore, onReorder } = useTreeDnd();

    // Храним в ref чтобы не пересоздавать dropTarget при изменении nodeMap/onReorder
    const nodeMapRef = useRef(nodeMap);
    nodeMapRef.current = nodeMap;

    const onReorderRef = useRef(onReorder);
    onReorderRef.current = onReorder;

    useEffect(() => {
        const element = rowRef.current;
        if (!enabled || !element) {
            return;
        }

        const isDragSourceData = (data: unknown): data is DragSourceData => {
            if (typeof data !== 'object' || data === null) {
                return false;
            }

            const record = data as Record<string, unknown>;
            return (
                typeof record.rowKey === 'string' &&
                typeof record.rowIndex === 'number' &&
                typeof record.level === 'number' &&
                record.type === 'tree-row'
            );
        };

        const updateIndicator = (
            source: { data: Record<string, unknown> },
            selfData: Record<string | symbol, unknown>
        ) => {
            const raw = extractRawInstruction(selfData);
            if (!raw) {
                indicatorStore.set(null);
                return;
            }

            if (!isDragSourceData(source.data)) {
                return;
            }

            const result = computeDropResult(source.data.rowKey, rowKey, raw, nodeMapRef.current);

            indicatorStore.set(result.indicator);
        };

        const extractRawInstruction = (
            data: Record<string | symbol, unknown>
        ): RawInstruction | null => {
            // Проверяем make-child маркер
            if (data[MAKE_CHILD_KEY]) {
                return 'make-child';
            }

            // Проверяем descendant маркер (будет перенаправлен на «below ancestor»)
            if (data[DESCENDANT_KEY]) {
                return 'below-ancestor';
            }

            // Проверяем closest-edge
            const edge = extractClosestEdge(data);
            if (edge === 'top') {
                return 'above';
            }
            if (edge === 'bottom') {
                return 'below';
            }

            return null;
        };

        return dropTargetForElements({
            element,

            getData: ({ input, element, source }) => {
                const baseData: Record<string | symbol, unknown> = {
                    rowKey,
                    rowIndex
                };

                if (!isDragSourceData(source.data)) {
                    return baseData;
                }

                // Определяем, какой тип hit detection использовать
                if (source.data.level === level) {
                    // Тот же уровень → closest-edge (top/bottom)
                    return attachClosestEdge(baseData, {
                        input,
                        element,
                        allowedEdges: ['top', 'bottom']
                    });
                }

                if (source.data.level - 1 === level) {
                    // Уровень потенциального родителя → make-child
                    return { ...baseData, [MAKE_CHILD_KEY]: true };
                }

                if (level > source.data.level) {
                    // Вложенный потомок элемента того же уровня → будет
                    // перенаправлен в computeDropResult на «below ancestor»
                    return { ...baseData, [DESCENDANT_KEY]: true };
                }

                // Другие уровни → нет валидных инструкций
                return baseData;
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
                if (!raw) {
                    return;
                }

                if (!isDragSourceData(source.data)) {
                    return;
                }

                const result = computeDropResult(
                    source.data.rowKey,
                    rowKey,
                    raw,
                    nodeMapRef.current
                );

                if (result.event) {
                    onReorderRef.current?.(result.event);
                }
            }
        });
    }, [rowKey, rowIndex, level, enabled, indicatorStore]);

    return { rowRef };
};
