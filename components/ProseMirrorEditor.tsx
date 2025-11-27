import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { EditorHandle } from '../types';

// We extend the basic schema to ensure we have a robust document structure
const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

interface ProseMirrorEditorProps {
  initialContent?: string;
}

const ProseMirrorEditor = forwardRef<EditorHandle, ProseMirrorEditorProps>((props, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize ProseMirror
  useEffect(() => {
    if (!editorRef.current) return;

    // Initial state setup
    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(baseKeymap)
      ]
    });

    // Create the view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        // Standard ProseMirror update loop
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      },
      attributes: {
        class: 'prose lg:prose-xl focus:outline-none max-w-none', // Tailwind typography classes inside editor
      }
    });

    viewRef.current = view;

    // Optional: focus on mount
    view.focus();

    return () => {
      view.destroy();
    };
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (!viewRef.current) return '';
      // We grab text content roughly for the AI. 
      // For a real rich text app, we'd serialize to Markdown or JSON.
      // Here, textContent gives a plain string representation.
      let text = '';
      viewRef.current.state.doc.descendants((node) => {
        if (node.isText) {
          text += node.text;
        } else if (node.type.name === 'paragraph') {
          text += '\n';
        }
      });
      return text.trim();
    },
    insertContent: (text: string) => {
      if (!viewRef.current) return;
      const { state, dispatch } = viewRef.current;
      
      // Insert text at the end of the document
      const tr = state.tr.insertText(text, state.doc.content.size);
      
      // Scroll to bottom
      tr.scrollIntoView();
      dispatch(tr);
      viewRef.current.focus();
    },
    focus: () => {
        viewRef.current?.focus();
    }
  }));

  return (
    <div 
      ref={editorRef} 
      className="min-h-[60vh] cursor-text"
      onClick={() => viewRef.current?.focus()} 
    />
  );
});

ProseMirrorEditor.displayName = 'ProseMirrorEditor';

export default ProseMirrorEditor;
