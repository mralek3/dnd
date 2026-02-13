
export interface DragSourceData {
    type: 'tree-row';
    rowKey: string;
    rowIndex: number;
    level: number;
    parentKey: string | null;
}

export interface DropTargetData {
    rowKey: string;
    rowIndex: number;
}

export type IndicatorType = 'above' | 'below' | 'make-child';

export interface VisualIndicator {
    rowKey: string;
    type: IndicatorType;
}

export interface TreeNodeMeta {
    key: string;
    level: number;
    parentKey: string | null;

    childKeys: string[];
    hasChildren: boolean;
    isExpanded: boolean;

    indexAmongSiblings: number;

    siblingKeys: string[];
}

export interface ReorderEvent {

    sourceKey: string;

    targetKey: string;

    position: 'above' | 'below' | 'make-child';
}