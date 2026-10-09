"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";

/**
 * One rich-text editor for every admin form (pages, products, showcase).
 * Outputs HTML; the server sanitises it before saving.
 */
export function RichTextEditor({
  value,
  onChange,
  minHeight = 180,
  label,
  tokens,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  label: string;
  /** Insertable placeholders, e.g. { label: "First name", value: "{first_name}" }. */
  tokens?: Array<{ label: string; value: string }>;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": label,
        class:
          "prose prose-sm max-w-none px-4 py-3 text-fg outline-none dark:prose-invert prose-headings:font-semibold prose-p:my-2",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Swap content when the caller loads a different document into the form.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  return (
    <div className="border border-line focus-within:border-fg">
      <Toolbar editor={editor} tokens={tokens} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  tokens,
}: {
  editor: Editor | null;
  tokens?: Array<{ label: string; value: string }>;
}) {
  const btn = (active: boolean) =>
    clsx(
      "grid size-8 place-items-center transition-colors",
      active ? "bg-fg text-canvas" : "text-fg-3 hover:bg-plate hover:text-fg",
    );
  if (!editor) return <div className="h-9 border-b border-line" />;
  const items = [
    {
      label: "Bold",
      icon: Bold,
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      label: "Heading",
      icon: Heading2,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Subheading",
      icon: Heading3,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "Bulleted list",
      icon: List,
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      label: "Quote",
      icon: Quote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
  ];
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-px border-b border-line px-1 py-0.5"
    >
      {items.map(({ label, icon: Icon, run, active }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          aria-label={label}
          aria-pressed={active}
          title={label}
          className={btn(active)}
        >
          <Icon className="size-4" />
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        aria-label="Undo"
        title="Undo"
        className={btn(false)}
      >
        <Undo2 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        aria-label="Redo"
        title="Redo"
        className={btn(false)}
      >
        <Redo2 className="size-4" />
      </button>
      {tokens?.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => editor.chain().focus().insertContent(t.value).run()}
          className="ml-1 h-7 border border-line px-2 font-mono text-[10px] uppercase tracking-wide text-fg-2 hover:border-fg hover:text-fg"
        >
          + {t.label}
        </button>
      ))}
    </div>
  );
}
