import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isGenerating?: boolean;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing...",
  disabled = false,
  isGenerating = false
}: MarkdownEditorProps) => {
  const [showToolbar, setShowToolbar] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: isGenerating 
          ? '✨ AI is drafting your proposal description...' 
          : disabled
          ? 'Write a proposal title first, and AI will draft the description for you...'
          : placeholder,
      }),
    ],
    content: value ? marked.parse(value) as string : '',
    editable: !disabled && !isGenerating,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setShowToolbar(from !== to && !disabled && !isGenerating);
    },
    editorProps: {
      attributes: {
        class: 'max-w-[72ch] mx-auto focus:outline-none min-h-[220px] px-4 py-4 text-foreground leading-7',
      },
    },
  });

  // Update content when value changes externally (from AI generation)
  useEffect(() => {
    if (editor && value && !editor.isFocused) {
      const currentContent = turndownService.turndown(editor.getHTML());
      if (currentContent !== value) {
        editor.commands.setContent(marked.parse(value) as string);
      }
    }
  }, [value, editor]);

  // Update editability when disabled/generating state changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !isGenerating);
    }
  }, [disabled, isGenerating, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg bg-background relative ${isGenerating ? 'opacity-50' : ''}`}>
      {showToolbar && editor && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 rounded-lg border bg-popover shadow-lg">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className="h-8 w-8 p-0"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
