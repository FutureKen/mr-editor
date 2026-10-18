import React from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { loadSummaryHtml, saveSummaryHtml } from '../lib/summary';

const INDENT_PX = 24;
const MAX_INDENT = 8;

// Indent/outdent: nests list items, otherwise shifts paragraphs with margin-left
// (stored inline so the PDF export picks it up).
const Indent = Extension.create({
	name: 'indent',

	addGlobalAttributes() {
		return [{
			types: ['paragraph'],
			attributes: {
				indent: {
					default: 0,
					parseHTML: el => Math.min(MAX_INDENT, Math.round((parseInt(el.style.marginLeft, 10) || 0) / INDENT_PX)),
					renderHTML: attrs => (attrs.indent ? { style: `margin-left: ${attrs.indent * INDENT_PX}px` } : {})
				}
			}
		}];
	},

	addCommands() {
		const shift = (delta) => ({ editor, state, tr, dispatch, commands }) => {
			if (editor.isActive('listItem')) {
				// Swallow the key even when the item can't move, so Tab never leaves the editor
				if (delta > 0) commands.sinkListItem('listItem');
				else commands.liftListItem('listItem');
				return true;
			}
			const { from, to } = state.selection;
			state.doc.nodesBetween(from, to, (node, pos) => {
				if (node.type.name !== 'paragraph') return;
				const indent = Math.max(0, Math.min(MAX_INDENT, (node.attrs.indent || 0) + delta));
				if (indent !== node.attrs.indent) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
			});
			if (dispatch) dispatch(tr);
			return true;
		};
		return { indent: () => shift(1), outdent: () => shift(-1) };
	},

	addKeyboardShortcuts() {
		return {
			Tab: () => this.editor.commands.indent(),
			'Shift-Tab': () => this.editor.commands.outdent()
		};
	}
});

const Icon = ({ d }) => (
	<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d={d} />
	</svg>
);

const ICONS = {
	bullet: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
	ordered: 'M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 2h3M3 12.5a1.5 1.5 0 1 1 2.5 1L3 15h3',
	indent: 'M3 6h18M11 12h10M11 18h10M3 10l4 3-4 3z',
	outdent: 'M3 6h18M11 12h10M11 18h10M7 10l-4 3 4 3z',
	alignLeft: 'M3 6h18M3 12h12M3 18h16',
	alignCenter: 'M3 6h18M6 12h12M4 18h16',
	alignRight: 'M3 6h18M9 12h12M5 18h16',
	clear: 'M4 7V5h12v2M10 5l-3 14M14 19H6M15 13l6 6M21 13l-6 6',
	undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
	redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3'
};

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
	<button
		type="button"
		// Keep focus (and the selection) in the editor while clicking the toolbar
		onMouseDown={e => e.preventDefault()}
		onClick={onClick}
		disabled={disabled}
		title={title}
		aria-label={title}
		aria-pressed={active}
		className={`h-8 min-w-8 px-1.5 flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30 ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
	>
		{children}
	</button>
);

const Divider = () => <span className="w-px h-5 bg-slate-300 mx-1" />;

const Toolbar = ({ editor, language }) => {
	const en = language === 'en';
	const state = useEditorState({
		editor,
		selector: ({ editor: e }) => ({
			bold: e.isActive('bold'),
			italic: e.isActive('italic'),
			underline: e.isActive('underline'),
			strike: e.isActive('strike'),
			bulletList: e.isActive('bulletList'),
			orderedList: e.isActive('orderedList'),
			alignLeft: e.isActive({ textAlign: 'left' }),
			alignCenter: e.isActive({ textAlign: 'center' }),
			alignRight: e.isActive({ textAlign: 'right' }),
			canUndo: e.can().undo(),
			canRedo: e.can().redo()
		})
	});
	const run = (fn) => () => fn(editor.chain().focus()).run();

	return (
		<div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-white rounded-t-lg">
			<ToolbarButton title={en ? 'Bold (Ctrl+B)' : '粗體 (Ctrl+B)'} active={state.bold} onClick={run(c => c.toggleBold())}>
				<span className="font-bold">B</span>
			</ToolbarButton>
			<ToolbarButton title={en ? 'Italic (Ctrl+I)' : '斜體 (Ctrl+I)'} active={state.italic} onClick={run(c => c.toggleItalic())}>
				<span className="italic font-serif">I</span>
			</ToolbarButton>
			<ToolbarButton title={en ? 'Underline (Ctrl+U)' : '底線 (Ctrl+U)'} active={state.underline} onClick={run(c => c.toggleUnderline())}>
				<span className="underline">U</span>
			</ToolbarButton>
			<ToolbarButton title={en ? 'Strikethrough' : '刪除線'} active={state.strike} onClick={run(c => c.toggleStrike())}>
				<span className="line-through">S</span>
			</ToolbarButton>
			<Divider />
			<ToolbarButton title={en ? 'Bullet list' : '項目符號'} active={state.bulletList} onClick={run(c => c.toggleBulletList())}>
				<Icon d={ICONS.bullet} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Numbered list' : '編號清單'} active={state.orderedList} onClick={run(c => c.toggleOrderedList())}>
				<Icon d={ICONS.ordered} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Decrease indent (Shift+Tab)' : '減少縮排 (Shift+Tab)'} onClick={run(c => c.outdent())}>
				<Icon d={ICONS.outdent} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Increase indent (Tab)' : '增加縮排 (Tab)'} onClick={run(c => c.indent())}>
				<Icon d={ICONS.indent} />
			</ToolbarButton>
			<Divider />
			<ToolbarButton title={en ? 'Align left' : '靠左對齊'} active={state.alignLeft} onClick={run(c => c.setTextAlign('left'))}>
				<Icon d={ICONS.alignLeft} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Align center' : '置中'} active={state.alignCenter} onClick={run(c => c.setTextAlign('center'))}>
				<Icon d={ICONS.alignCenter} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Align right' : '靠右對齊'} active={state.alignRight} onClick={run(c => c.setTextAlign('right'))}>
				<Icon d={ICONS.alignRight} />
			</ToolbarButton>
			<Divider />
			<ToolbarButton title={en ? 'Clear formatting' : '清除格式'} onClick={run(c => c.unsetAllMarks().clearNodes())}>
				<Icon d={ICONS.clear} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Undo (Ctrl+Z)' : '復原 (Ctrl+Z)'} disabled={!state.canUndo} onClick={run(c => c.undo())}>
				<Icon d={ICONS.undo} />
			</ToolbarButton>
			<ToolbarButton title={en ? 'Redo (Ctrl+Y)' : '重做 (Ctrl+Y)'} disabled={!state.canRedo} onClick={run(c => c.redo())}>
				<Icon d={ICONS.redo} />
			</ToolbarButton>
		</div>
	);
};

const SummaryBox = ({ language }) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Only formatting the PDF export can reproduce
				heading: false,
				blockquote: false,
				code: false,
				codeBlock: false,
				horizontalRule: false,
				link: false
			}),
			TextAlign.configure({ types: ['paragraph'] }),
			Indent
		],
		content: loadSummaryHtml(language),
		onUpdate: ({ editor: e }) => saveSummaryHtml(language, e.getHTML()),
		editorProps: {
			attributes: {
				id: `summary-editor-${language}`,
				'aria-label': language === 'en' ? 'Summary' : '本週總結',
				class: 'summary-editor min-h-[5rem] p-3 focus:outline-none'
			}
		}
	});

	return (
		<div className="summary-box mb-6 bg-white rounded-xl p-5 border border-slate-200 shadow">
			<label htmlFor={`summary-editor-${language}`} className="block text-sm font-semibold text-slate-700 mb-2">
				{language === 'en' ? 'Summary' : '本週總結'}
			</label>
			<div className="border border-slate-200 rounded-lg shadow-sm bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
				{editor && <Toolbar editor={editor} language={language} />}
				<EditorContent editor={editor} />
			</div>
		</div>
	);
};

export default SummaryBox;
