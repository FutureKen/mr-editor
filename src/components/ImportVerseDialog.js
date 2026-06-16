import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getBibleSearch, ensureBibleLoaded, COL, enRefLabel, cnRefLabel } from '../lib/bibleSearch';

/**
 * ImportVerseDialog — a modal search box (mirroring Logos Seeker) for finding
 * verses by reference (e.g. "John 1:1", "约 1:1") or keyword, and importing them
 * into the MR Composer. Importing a verse pulls in BOTH the English and Chinese
 * text/reference; the parent decides which column each goes to. Multiple verses
 * can be selected and imported together.
 *
 * The dialog is rendered into a portal on document.body so its fixed overlay
 * covers the whole page (not just the column it was opened from).
 *
 * Props:
 *   isOpen   — whether the dialog is shown
 *   onClose  — called to dismiss the dialog
 *   onImport — called with { enRef, cnRef, enText, cnText } per imported verse
 */

const PAGE_SIZE = 30; // keyword matches revealed per page

const ImportVerseDialog = ({ isOpen, onClose, onImport }) => {
	const [query, setQuery] = useState('');
	const [displayLang, setDisplayLang] = useState('en'); // 'en' | 'cn'
	const [rows, setRows] = useState([]); // matching row indices
	const [shown, setShown] = useState(PAGE_SIZE);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const [ready, setReady] = useState(false);
	const [selected, setSelected] = useState(() => new Set()); // selected row indices

	const inputRef = useRef(null);
	const debounceRef = useRef(null);

	// Load the Bible data the first time the dialog is opened.
	useEffect(() => {
		if (!isOpen) return;
		let cancelled = false;
		setLoading(true);
		ensureBibleLoaded()
			.then(() => {
				if (cancelled) return;
				setReady(true);
				setLoading(false);
			})
			.catch(() => {
				if (cancelled) return;
				setLoading(false);
				setStatus('Failed to load Bible data.');
			});
		return () => { cancelled = true; };
	}, [isOpen]);

	// Focus the search box when opened. preventScroll keeps the page from
	// jumping when the modal mounts.
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus({ preventScroll: true });
		}
	}, [isOpen]);

	// Close on Escape.
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	const runSearch = useCallback((raw) => {
		const bs = getBibleSearch();
		setSelected(new Set()); // a new result set clears any prior selection
		const q = raw.trim();
		if (!q) {
			setRows([]);
			setStatus('');
			return;
		}

		const parsed = bs.parse(q);
		let resultRows = [];

		if (parsed.type === 'ref' && parsed.fuzzy) {
			// Multiple plausible readings — expand each into its verse rows so a
			// query like "jn11" lists John 1:1 first, then all of John 11. A
			// specific-verse candidate yields one row; a whole-chapter candidate
			// yields every verse, and is listed after the specific-verse readings.
			const ordered = [...parsed.candidates].sort((a, b) => {
				const aw = a.verse == null ? 1 : 0; // specific verses before whole chapters
				const bw = b.verse == null ? 1 : 0;
				if (aw !== bw) return aw - bw;
				if (a.chapter !== b.chapter) return a.chapter - b.chapter;
				return (a.verse || 0) - (b.verse || 0);
			});
			const seen = new Set();
			for (const c of ordered) {
				for (const i of bs.lookupReference(c)) {
					if (!seen.has(i)) { seen.add(i); resultRows.push(i); }
				}
			}
			setStatus(
				resultRows.length
					? `${resultRows.length} ${resultRows.length === 1 ? 'result' : 'results'}`
					: 'Reference not found.'
			);
		} else if (parsed.type === 'ref') {
			resultRows = bs.lookupReference(parsed);
			setStatus(
				resultRows.length
					? `${resultRows.length} ${resultRows.length === 1 ? 'result' : 'results'}`
					: 'Reference not found.'
			);
		} else {
			// Word search. English needs at least 2 characters.
			if (parsed.lang === 'en' && parsed.term.replace(/\s+/g, '').length < 2) {
				setRows([]);
				setStatus('Type at least 2 characters to search English text.');
				return;
			}
			const { rows: wr } = bs.wordSearch(parsed.term, parsed.lang, Infinity);
			resultRows = wr;
			// Follow the query language so the user sees what they searched.
			if (parsed.lang !== displayLang) setDisplayLang(parsed.lang);
			setStatus(
				wr.length
					? `${wr.length} ${wr.length === 1 ? 'match' : 'matches'}`
					: 'No results found.'
			);
		}

		setShown(PAGE_SIZE);
		setRows(resultRows);
	}, [displayLang]);

	// Debounced search on query change (once data is ready).
	useEffect(() => {
		if (!isOpen || !ready) return;
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => runSearch(query), 220);
		return () => clearTimeout(debounceRef.current);
	}, [query, ready, isOpen, runSearch]);

	if (!isOpen) return null;

	const bs = getBibleSearch();

	const importRow = (rowIdx) => {
		const row = bs.verses[rowIdx];
		onImport({
			enRef: enRefLabel(row),
			cnRef: cnRefLabel(row),
			enText: row[COL.EN] || '',
			cnText: row[COL.CN] || row[COL.EN] || '',
		});
	};

	// Import every selected verse together, in canonical order, then close.
	const importSelected = () => {
		const ordered = [...selected].sort((a, b) => a - b);
		for (const rowIdx of ordered) importRow(rowIdx);
	};

	const toggleSelect = (rowIdx) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(rowIdx)) next.delete(rowIdx);
			else next.add(rowIdx);
			return next;
		});
	};

	const visibleRows = rows.slice(0, shown);

	const dialog = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-slate-200">
					<div className="flex items-baseline gap-2">
						<h3 className="text-lg font-bold text-slate-800">Import Verse</h3>
						<span className="text-xs text-slate-400">
							powered by{' '}
							<a
								href="https://futureken.github.io/logos-seeker/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 hover:underline"
							>
								Logos Seeker
							</a>
						</span>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-2xl h-9 w-9 flex items-center justify-center rounded-full transition-colors"
						title="Close"
					>
						×
					</button>
				</div>

				{/* Search controls */}
				<div className="p-4 border-b border-slate-200 flex items-center gap-3">
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder='Reference or keyword (e.g. "John 1:1", "约 1:1", "love", "爱")'
						className="flex-grow p-3 border border-slate-200 rounded-lg shadow-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
					/>
					<div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
						{['en', 'cn'].map((l) => (
							<button
								key={l}
								onClick={() => setDisplayLang(l)}
								className={`px-3 py-2 text-sm font-medium transition-colors ${
									displayLang === l
										? 'bg-blue-500 text-white'
										: 'bg-white text-slate-600 hover:bg-slate-100'
								}`}
							>
								{l === 'en' ? 'EN' : '中文'}
							</button>
						))}
					</div>
				</div>

				{/* Status */}
				{(status || loading) && (
					<div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-100">
						{loading ? 'Loading Bible data…' : status}
					</div>
				)}

				{/* Results */}
				<div className="overflow-y-auto flex-grow p-2">
					{!query.trim() && !loading && (
						<p className="p-4 text-sm text-slate-500">
							Type a reference like <code className="bg-slate-100 px-1 rounded">John 1:1</code> or
							a keyword like <code className="bg-slate-100 px-1 rounded">love</code>. Tick the
							checkboxes to import several verses at once. Importing adds each verse to both the
							English and Chinese columns.
						</p>
					)}
					{visibleRows.map((rowIdx) => {
						const row = bs.verses[rowIdx];
						const ref = bs.refLabel(row, displayLang);
						const text = displayLang === 'cn' ? (row[COL.CN] || row[COL.EN]) : row[COL.EN];
						const isSelected = selected.has(rowIdx);
						return (
							<label
								key={rowIdx}
								className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
									isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
								}`}
							>
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() => toggleSelect(rowIdx)}
									className="mt-1.5 h-4 w-4 flex-shrink-0 accent-blue-500 cursor-pointer"
								/>
								<div className="flex-grow min-w-0">
									<div className="text-sm font-semibold text-blue-600 mb-0.5">{ref}</div>
									<div className={`text-slate-700 ${displayLang === 'cn' ? 'leading-relaxed' : ''}`}>
										{text}
									</div>
								</div>
								<button
									onClick={(e) => { e.preventDefault(); importRow(rowIdx); }}
									className="flex-shrink-0 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
									title="Import this verse (English + Chinese)"
								>
									Import
								</button>
							</label>
						);
					})}
					{rows.length > shown && (
						<button
							onClick={() => setShown((s) => s + PAGE_SIZE)}
							className="w-full mt-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
						>
							More results ({rows.length - shown} more)
						</button>
					)}
				</div>

				{/* Batch import footer (only when verses are selected) */}
				{selected.size > 0 && (
					<div className="p-3 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
						<span className="text-sm text-slate-600">{selected.size} selected</span>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setSelected(new Set())}
								className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
							>
								Clear
							</button>
							<button
								onClick={importSelected}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
								title="Import all selected verses (English + Chinese)"
							>
								Import {selected.size} {selected.size === 1 ? 'verse' : 'verses'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(dialog, document.body);
};

export default ImportVerseDialog;
