// import { BubbleMenu } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Code, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EditorBubbleMenu = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    // Temporary: BubbleMenu import failing.
    return null;

    /*
    const handleAI = (command: string) => {
        // Dispatch event for parent to handle
        const event = new CustomEvent('ai-command', {
            detail: {
                command,
                context: editor.state.selection.content().content.textBetween(0, editor.state.selection.content().size)
            }
        });
        editor.view.dom.dispatchEvent(event);
    };

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex overflow-hidden rounded-md border bg-popover shadow-md">
            <div className="flex p-1 gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'bg-accent text-accent-foreground' : ''}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'bg-accent text-accent-foreground' : ''}
                >
                    <Code className="h-4 w-4" />
                </Button>
                <div className="w-px bg-border mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAI('fix')}
                    className="text-purple-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Fix
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAI('summarize')}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Summarize
                </Button>
            </div>
        </BubbleMenu>
    );
    */
};
