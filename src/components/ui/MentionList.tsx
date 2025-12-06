import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Hash, Layers } from 'lucide-react';

export interface MentionListProps {
    items: any[];
    command: (item: any) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.label, type: item.type });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return null;
    }

    return (
        <div className="bg-popover border border-border rounded-md shadow-md overflow-hidden p-1 min-w-[200px]">
            {props.items.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <button
                        key={index}
                        className={cn(
                            "flex items-center w-full gap-2 px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                            isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                        )}
                        onClick={() => selectItem(index)}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center shrink-0",
                            item.type === 'context' ? "bg-blue-500/10 text-blue-500" :
                                item.type === 'memory' ? "bg-green-500/10 text-green-500" :
                                    "bg-purple-500/10 text-purple-500"
                        )}>
                            {item.type === 'context' && <Layers className="w-3 h-3" />}
                            {item.type === 'memory' && <FileText className="w-3 h-3" />}
                            {item.type === 'concept' && <Hash className="w-3 h-3" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{item.label}</span>
                            {item.description && (
                                <span className="text-[10px] text-muted-foreground truncate opacity-80">
                                    {item.description}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
});

MentionList.displayName = 'MentionList';
