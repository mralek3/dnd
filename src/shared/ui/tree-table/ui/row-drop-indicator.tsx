import type { IndicatorType } from '../model/types';

export const getDropIndicatorStyle = (indicator: IndicatorType | null): React.CSSProperties => {
    if (!indicator) {
        return {};
    }

    switch (indicator) {
        case 'above':
            return { boxShadow: 'inset 0 2px 0 0 #1890ff' };

        case 'below':
            return { boxShadow: 'inset 0 -2px 0 0 #1890ff' };

        case 'make-child':
            return {
                outline: '2px solid #1890ff',
                outlineOffset: '-2px',
                borderRadius: '4px'
            };

        default:
            return {};
    }
};