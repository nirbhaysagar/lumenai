'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCompletion } from 'ai/react';

import Commands, { getSlashCommandSuggestions, defaultSlashItems } from './SlashCommand';
// import { EditorBubbleMenu } from './EditorBubbleMenu';

export default function SmartEditor() {
    const [isLoading, setIsLoading] = useState(false);

    // Initialized editor first to avoid ReferenceError in useCompletion callback
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Type "/" for commands, or just start writing...',
            }),
            Commands.configure({
                suggestion: getSlashCommandSuggestions(defaultSlashItems),
            }),
        ],
        content: '<p>Hello World! 🌍</p>',
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[500px]',
            },
        },
    });

    const { complete, completion, isLoading: isAiLoading } = useCompletion({
        api: '/api/editor/generate',
        onFinish: (_prompt, result) => {
            setIsLoading(false);
            // Insert result into editor
            if (editor) {
                // If we were continuing, append. If fixing/summarizing, maybe replace?
                // For simplicity, we'll just append for 'continue' and replace selection for others if we tracked it.
                // But the streaming logic below handles insertion better.
            }
        },
        onError: (err) => {
            toast.error(err.message);
            setIsLoading(false);
        }
    });

    // Effect to handle streaming completion insertion
    // This is tricky with Tiptap. Usually we want to insert as it streams.
    // Ideally we'd have a "streaming" node or just append text.
    // For this MVP, let's just use the `completion` string and insert it when done, 
    // OR try to stream it.
    // A common pattern is to use a ref to track previous completion length and insert the diff.

    const [prevCompletionLength, setPrevCompletionLength] = useState(0);

    useEffect(() => {
        if (!editor) return;

        const diff = completion.slice(prevCompletionLength);
        if (diff) {
            editor.commands.insertContent(diff);
            setPrevCompletionLength(completion.length);
        }
    }, [completion, editor]);

    useEffect(() => {
        if (!isAiLoading) {
            setPrevCompletionLength(0);
        }
    }, [isAiLoading]);

    useEffect(() => {
        if (!editor) return;

        const handleAiCommand = (e: any) => {
            const { command, context } = e.detail;
            console.log('AI Command:', command, context);

            setIsLoading(true);

            // Get context if not provided (e.g. for 'continue')
            const textContext = context || editor.getText().slice(-1000); // Last 1000 chars

            complete(textContext, { body: { command, context: textContext } });
        };

        // Attach event listener to the editor's DOM element
        const dom = editor.view.dom;
        dom.addEventListener('ai-command', handleAiCommand);

        return () => {
            dom.removeEventListener('ai-command', handleAiCommand);
        };
    }, [editor, complete]);

    if (!editor) {
        return null;
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto border rounded-lg shadow-sm bg-background min-h-[600px] p-4">
            {isAiLoading && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-sm text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-full border animate-in fade-in">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI is writing...
                </div>
            )}

            {/* <EditorBubbleMenu editor={editor} /> */}
            <EditorContent editor={editor} />
        </div>
    );
}
