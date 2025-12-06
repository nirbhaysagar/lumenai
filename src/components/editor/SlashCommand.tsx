import React, { useState, useEffect, useCallback } from 'react';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { Sparkles, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react';

const CommandList = ({ items, command, editor, range }: any) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    const onKeyDown = ({ event }: any) => {
        if (event.key === 'ArrowUp') {
            setSelectedIndex((selectedIndex + items.length - 1) % items.length);
            return true;
        }
        if (event.key === 'ArrowDown') {
            setSelectedIndex((selectedIndex + 1) % items.length);
            return true;
        }
        if (event.key === 'Enter') {
            selectItem(selectedIndex);
            return true;
        }
        return false;
    };

    useEffect(() => {
        // Expose onKeyDown to the parent
        (window as any).slashCommandKeyDown = onKeyDown;
        return () => { (window as any).slashCommandKeyDown = null; };
    }, [selectedIndex, items]);

    const selectItem = (index: number) => {
        const item = items[index];
        if (item) {
            command(item);
        }
    };

    return (
        <div className="z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="p-1">
                {items.map((item: any, index: number) => (
                    <button
                        key={index}
                        className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ${index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                            }`}
                        onClick={() => selectItem(index)}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },
        onUpdate: (props: any) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
            }
            // Delegate to the component's key handler via global or ref (simplified here)
            // In a real app, we'd use a ref or context. 
            // For this MVP, we'll try to rely on the component handling it if focused, 
            // but tiptap suggestion handles the keydown event before it reaches the component.
            // We need to call the component's handler.
            if ((window as any).slashCommandKeyDown) {
                return (window as any).slashCommandKeyDown(props);
            }
            return false;
        },
        onExit: () => {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

const Commands = Extension.create({
    name: 'slash-command',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getSlashCommandSuggestions = (items: any[]) => ({
    items: ({ query }: any) => {
        return items.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
    },
    render: renderItems
});

export const defaultSlashItems = [
    {
        title: 'Continue writing',
        icon: Sparkles,
        command: ({ editor, range }: any) => {
            // Trigger AI generation
            editor.chain().focus().deleteRange(range).run();
            // We need a way to signal the parent component to start AI.
            // We can emit a custom event or use a callback if passed.
            // For now, let's dispatch a custom event on the editor element.
            const event = new CustomEvent('ai-command', { detail: { command: 'continue' } });
            editor.view.dom.dispatchEvent(event);
        },
    },
    {
        title: 'Heading 1',
        icon: Heading1,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
    },
    {
        title: 'Heading 2',
        icon: Heading2,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
    },
    {
        title: 'Bullet List',
        icon: List,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: 'Ordered List',
        icon: ListOrdered,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: 'Quote',
        icon: Quote,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: 'Code Block',
        icon: Code,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
];

export default Commands;
