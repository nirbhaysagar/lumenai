import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/react';

export const WikiLink = Mention.extend({
    name: 'wikiLink',

    parseHTML() {
        return [
            {
                tag: 'span[data-type="wikiLink"]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes({ 'data-type': 'wikiLink' }, this.options.HTMLAttributes, HTMLAttributes),
            `[[${node.attrs.label ?? node.attrs.id}]]`,
        ];
    },
});
