import type { TreeNodeMeta, VisualIndicator, ReorderEvent } from './types';

/**
 * Тип raw-инструкции из hitbox (closest-edge или make-child)
 */
export type RawInstruction = 'above' | 'below' | 'make-child' | 'below-ancestor';

/**
 * Результат вычисления drop-операции
 */
export interface DropResult {
    /** Индикатор для отображения (может указывать на другую строку) */
    indicator: VisualIndicator | null;
    /** Событие для вызова коллбека (null = перемещение невалидно или не даёт эффекта) */
    event: ReorderEvent | null;
}

/**
 * Находит последний видимый потомок узла (рекурсивно по раскрытым потомкам).
 * Нужен для правила 5: индикатор «под развёрнутым» ставится после его последнего потомка.
 */
function getLastVisibleDescendant(
    key: string,
    nodeMap: Map<string, TreeNodeMeta>
): string {
    const node = nodeMap.get(key);
    if (!node || !node.isExpanded || node.childKeys.length === 0) {
        return key;
    }
    const lastChildKey = node.childKeys[node.childKeys.length - 1];
    return getLastVisibleDescendant(lastChildKey, nodeMap);
}

/**
 * Проверяет, является ли `ancestorKey` предком `descendantKey` в дереве.
 */
function isAncestor(
    ancestorKey: string,
    descendantKey: string,
    nodeMap: Map<string, TreeNodeMeta>
): boolean {
    let current = nodeMap.get(descendantKey);
    while (current?.parentKey != null) {
        if (current.parentKey === ancestorKey) return true;
        current = nodeMap.get(current.parentKey);
    }
    return false;
}

/**
 * Находит предка `key` на заданном уровне вложенности.
 * Нужен для обработки drop на вложенный потомок: перенаправляем на «below ancestor».
 */
function findAncestorAtLevel(
    key: string,
    targetLevel: number,
    nodeMap: Map<string, TreeNodeMeta>
): string | null {
    let current = nodeMap.get(key);
    while (current) {
        if (current.level === targetLevel) return current.key;
        if (current.parentKey == null) break;
        current = nodeMap.get(current.parentKey);
    }
    return null;
}

/**
 * Основная функция: вычисляет результат drop-операции с учётом всех правил.
 *
 * Правила:
 * 1. Элементы не меняют уровень вложенности, только родителя того же уровня.
 * 2. Нельзя переместить элемент в/над/под себя.
 * 3. make-child на раскрытый узел → «над первым дочерним».
 * 4. Если перемещение ничего не меняет — не подсвечивать и не вызывать коллбек.
 * 5. «Под развёрнутый sibling» — индикатор под последним видимым потомком,
 *    логика остаётся «под sibling».
 */
export function computeDropResult(
    sourceKey: string,
    targetKey: string,
    rawInstruction: RawInstruction,
    nodeMap: Map<string, TreeNodeMeta>
): DropResult {
    const BLOCKED: DropResult = { indicator: null, event: null };

    const source = nodeMap.get(sourceKey);
    const target = nodeMap.get(targetKey);
    if (!source || !target) return BLOCKED;

    // ── Правило 2: нельзя перемещать элемент в/над/под себя ──
    if (sourceKey === targetKey) return BLOCKED;

    // Нельзя перемещать элемент в собственного потомка
    if (isAncestor(sourceKey, targetKey, nodeMap)) return BLOCKED;

    // ── Правило 6: drop на вложенный потомок элемента того же уровня ──
    // Перенаправляем на «below ancestor» (предок на уровне source)
    if (rawInstruction === 'below-ancestor') {
        const ancestorKey = findAncestorAtLevel(targetKey, source.level, nodeMap);
        if (!ancestorKey) return BLOCKED;
        // Рекурсивно вызываем с «below» на найденного предка — все правила
        // (no-op, правило 5 для развёрнутых) применятся автоматически.
        return computeDropResult(sourceKey, ancestorKey, 'below', nodeMap);
    }

    // ── Правило 1: проверяем допустимость по уровням ──
    if (rawInstruction === 'above' || rawInstruction === 'below') {
        // above/below — только на элементы того же уровня
        if (target.level !== source.level) return BLOCKED;
    } else if (rawInstruction === 'make-child') {
        // make-child — только на элементы уровнем выше (будущий родитель)
        if (target.level !== source.level - 1) return BLOCKED;
    }

    // ── Обработка make-child ──
    if (rawInstruction === 'make-child') {
        // Правило 3: если целевой узел раскрыт → превращаем в «над первым дочерним»
        if (target.isExpanded && target.childKeys.length > 0) {
            const firstChildKey = target.childKeys[0];

            // Если первый дочерний — это сам source → no-op (правило 4)
            if (firstChildKey === sourceKey) return BLOCKED;

            // Проверяем no-op: source уже стоит прямо перед firstChild?
            const firstChild = nodeMap.get(firstChildKey);
            if (firstChild && source.parentKey === target.key &&
                source.indexAmongSiblings === 0) {
                return BLOCKED; // source уже первый ребёнок этого родителя
            }

            return {
                indicator: { rowKey: firstChildKey, type: 'above' },
                event: { sourceKey, targetKey: firstChildKey, position: 'above' }
            };
        }

        // Collapsed make-child: append as last child
        // Правило 4: если source уже последний ребёнок target → no-op
        if (source.parentKey === targetKey) {
            const lastIdx = target.childKeys.length - 1;
            if (target.childKeys[lastIdx] === sourceKey) return BLOCKED;
        }

        return {
            indicator: { rowKey: targetKey, type: 'make-child' },
            event: { sourceKey, targetKey, position: 'make-child' }
        };
    }

    // ── Обработка above ──
    if (rawInstruction === 'above') {
        // Правило 4 (no-op): source уже стоит прямо перед target
        if (source.parentKey === target.parentKey) {
            // source на позиции i, target на позиции i+1 → «над target» = текущая позиция
            if (source.indexAmongSiblings + 1 === target.indexAmongSiblings) {
                return BLOCKED;
            }
            // source === target уже отсечено правилом 2
        }

        return {
            indicator: { rowKey: targetKey, type: 'above' },
            event: { sourceKey, targetKey, position: 'above' }
        };
    }

    // ── Обработка below ──
    if (rawInstruction === 'below') {
        // Правило 4 (no-op): source уже стоит прямо после target
        if (source.parentKey === target.parentKey) {
            if (target.indexAmongSiblings + 1 === source.indexAmongSiblings) {
                return BLOCKED;
            }
        }

        // Правило 5: если target раскрыт → индикатор под последним видимым потомком
        if (target.isExpanded && target.childKeys.length > 0) {
            const lastDescendantKey = getLastVisibleDescendant(targetKey, nodeMap);
            return {
                indicator: { rowKey: lastDescendantKey, type: 'below' },
                // Логика: перемещение «под target» остаётся без изменений
                event: { sourceKey, targetKey, position: 'below' }
            };
        }

        return {
            indicator: { rowKey: targetKey, type: 'below' },
            event: { sourceKey, targetKey, position: 'below' }
        };
    }

    return BLOCKED;
}
