export { TreeTable } from './tree-table';
export { DragHandle } from './tree-table/ui/drag-handle';

// Экспорт утилит
export { buildTreeFromFlat } from './tree-table/lib/build-tree-from-flat';

// Экспорт типов для drag-and-drop
export type {
    ReorderEvent,
    VisualIndicator,
    IndicatorType,
    TreeNodeMeta
} from './tree-table/model/types';

// Экспорт типов для работы с плоскими данными
export type { FlatNode, TreeNode } from './tree-table/lib/build-tree-from-flat';
