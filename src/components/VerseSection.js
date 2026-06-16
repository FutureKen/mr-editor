import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import ImportVerseDialog from './ImportVerseDialog';

// Custom event used to broadcast an imported verse to every VerseSection for a
// given day, so a single import populates both the English and Chinese columns.
const IMPORT_EVENT = 'mr-import-verse';

// Custom event used to clear the verse rows of every VerseSection on the page
// (both columns, all days) in one action.
export const CLEAR_VERSES_EVENT = 'mr-clear-verses';


const VerseSection = ({ day, sundayDate, /*message, onMessageChange, */language }) => {

	const storageKey = `verse_${day}_${language}`;
	const prevDayStorageKey = day > 0 ? `verse_${day-1}_${language}` : null;

	// Helper function to generate a new empty verse
	const createNewVerse = () => ({ id: uuidv4(), verseReference: "", verseText: "" });

	// Load state from local storage
	const loadState = () => {
		try {
			const serializedState = localStorage.getItem(storageKey);
			if (serializedState === null) {
				// Initialize with one empty verse if nothing is saved
				return { book: "", verses: [createNewVerse()], message: "", sameAsLastDay: false };
			}
			const parsedState = JSON.parse(serializedState);
			// Ensure verses array exists and has at least one item
			if (!parsedState.verses || parsedState.verses.length === 0) {
				parsedState.verses = [createNewVerse()];
			}
			return parsedState;
		} catch (err) {
			// Initialize with one empty verse on error
			return { book: "", verses: [createNewVerse()], message: "", sameAsLastDay: false };
		}
	};

	// Load previous day message
	const loadPrevDayMessage = () => {
		if (!prevDayStorageKey) return "";
		try {
			const prevDayData = localStorage.getItem(prevDayStorageKey);
			if (prevDayData) {
				const { message: prevMessage } = JSON.parse(prevDayData);
				return prevMessage || "";
			}
		} catch (err) {
			console.error("Error loading previous day's message:", err);
		}
		return "";
	};

	// Save state to local storage
	const saveState = (state) => {
		try {
			const serializedState = JSON.stringify(state);
			localStorage.setItem(storageKey, serializedState);
		} catch {
			// Ignore write errors
		}
	};

	// Load state from local storage
	const savedState = loadState();

	// Initialize state with loaded state from local storage
	const [book, setBook] = useState(savedState.book);
	const [verses, setVerses] = useState(savedState.verses); // State for verses array
	const [computedDateString, setComputedDateString] = useState(""); // State for the formatted date string only
	const [message, setMessage] = useState(savedState.message);
	const [sameAsLastDay, setSameAsLastDay] = useState(savedState.sameAsLastDay || false);
	const [prevDayMessage, setPrevDayMessage] = useState(loadPrevDayMessage());
	const [importOpen, setImportOpen] = useState(false);

	const handleBookChange = (e) => {
		setBook(e.target.value); // Directly set the book name
	}

	// Update specific verse field
	const handleVerseChange = (id, field, value) => {
		setVerses(currentVerses =>
			currentVerses.map(verse =>
				verse.id === id ? { ...verse, [field]: value } : verse
			)
		);
	};

	// Add a new verse row
	const addVerseRow = () => {
		setVerses(currentVerses => [...currentVerses, createNewVerse()]);
	};

	// Delete a verse row; if it's the last one, clear its content instead
	const deleteVerseRow = (id) => {
		setVerses(currentVerses => {
			if (currentVerses.length <= 1) {
				return [{ ...currentVerses[0], verseReference: "", verseText: "" }];
			}
			return currentVerses.filter(verse => verse.id !== id);
		});
	};


	// Append an imported verse, reusing a trailing empty row if there is one.
	const appendImportedVerse = (reference, text) => {
		setVerses(currentVerses => {
			const newVerse = { id: uuidv4(), verseReference: reference, verseText: text };
			const last = currentVerses[currentVerses.length - 1];
			if (last && !last.verseReference.trim() && !last.verseText.trim()) {
				return [...currentVerses.slice(0, -1), newVerse];
			}
			return [...currentVerses, newVerse];
		});
	};

	// Broadcast the chosen verse to every VerseSection for this day so both the
	// English and Chinese columns receive their respective text in one click.
	const handleImport = ({ enRef, cnRef, enText, cnText }) => {
		window.dispatchEvent(new CustomEvent(IMPORT_EVENT, {
			detail: {
				day,
				byLanguage: {
					'en': { reference: enRef, text: enText },
					'zh-tw': { reference: cnRef, text: cnText },
				},
			},
		}));
		setImportOpen(false);
	};

	// Listen for imported verses targeting this day and add the matching
	// language's text to this section.
	useEffect(() => {
		const handler = (e) => {
			const detail = e.detail || {};
			if (String(detail.day) !== String(day)) return;
			const payload = detail.byLanguage && detail.byLanguage[language];
			if (!payload) return;
			appendImportedVerse(payload.reference, payload.text);
		};
		window.addEventListener(IMPORT_EVENT, handler);
		return () => window.removeEventListener(IMPORT_EVENT, handler);
	}, [day, language]);

	// Reset this section's verse rows when a page-wide clear is broadcast.
	useEffect(() => {
		const handler = () => setVerses([createNewVerse()]);
		window.addEventListener(CLEAR_VERSES_EVENT, handler);
		return () => window.removeEventListener(CLEAR_VERSES_EVENT, handler);
	}, []);

	const handleMessageChange = (e) => {
		if (!sameAsLastDay) {
			setMessage(e.target.value);
		}
	}

	const handleSameAsLastDayChange = (e) => {
		const checked = e.target.checked;
		setSameAsLastDay(checked);
		
		if (checked) {
			setMessage(prevDayMessage);
		}
	};

	// Regularly check for previous day message updates
	useEffect(() => {
		if (!prevDayStorageKey) return;

		// Initial load of previous day message
		setPrevDayMessage(loadPrevDayMessage());
		
		// Set up polling interval to check for changes to previous day's message
		const intervalId = setInterval(() => {
			const newPrevDayMessage = loadPrevDayMessage();
			setPrevDayMessage(newPrevDayMessage);
			
			// If we're using the previous day's message, update our message
			if (sameAsLastDay) {
				setMessage(newPrevDayMessage);
			}
		}, 1000); // Check every second
		
		return () => clearInterval(intervalId);
	}, [prevDayStorageKey, sameAsLastDay]);

	// Update message when sameAsLastDay changes or prevDayMessage changes
	useEffect(() => {
		if (sameAsLastDay) {
			setMessage(prevDayMessage);
		}
	}, [sameAsLastDay, prevDayMessage]);

	useEffect(() => {
		if (sundayDate) {
			const date = moment(sundayDate);  // Convert sundayDate into a moment object
			date.add(parseInt(day), 'days');
			date.locale(language);
			const formattedDate = date.format("MM/DD (ddd)"); // Format using the globally set locale
			setComputedDateString(formattedDate);
		}
	}, [sundayDate, day, language]);

	// Save state to local storage whenever state changes
	useEffect(() => {
		saveState({ book, verses, message, sameAsLastDay }); // Save verses array
	}, [book, verses, message, sameAsLastDay, storageKey]); // Add storageKey dependency

	const autoResizeTextarea = (e) => {
		e.target.style.height = 'inherit';
		e.target.style.height = `${e.target.scrollHeight}px`;
	};

	// Create a unique ID for checkbox that includes both day and language
	const checkboxId = `sameAsLastDay-${day}-${language}`;

	return (
		<div className="bible-verse-section bg-white rounded-xl p-6 mb-6 shadow-lg border border-slate-200">
			<div className="date-book-container mb-5">
				<div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg shadow-sm bg-slate-200">
					<span className="font-medium text-slate-600 flex-shrink-0">
						{computedDateString || ''} 
					</span>
					<input
						value={book}
						onChange={handleBookChange}
						placeholder="Book Name"
						className="book-input flex-grow p-0 border-0 focus:ring-0 focus:border-transparent bg-slate-50 transition-all"
					/>
				</div>
			</div>

			{/* Render multiple verses */}
			{verses.map((verse, index) => (
				<div key={verse.id} className="verse-row mb-4 flex items-start space-x-2">
					<div className="flex-grow">
						<div className="verse w-full flex flex-row overflow-hidden rounded-lg shadow-sm">
							<div className="verse-ref w-1/4 bg-slate-50 border border-slate-200">
								<textarea
									value={verse.verseReference}
									onChange={(e) => {
										handleVerseChange(verse.id, 'verseReference', e.target.value);
										autoResizeTextarea(e);
									}}
									placeholder="Ref"
									className="w-full p-3 border-0 bg-transparent resize-none overflow-hidden focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
									rows="1"
									onFocus={autoResizeTextarea}
									onInput={autoResizeTextarea}
								/>
							</div>
							<div className="verse-text w-3/4 bg-slate-50 border border-slate-200 border-l-0">
								<textarea
									value={verse.verseText}
									onChange={(e) => {
										handleVerseChange(verse.id, 'verseText', e.target.value);
										autoResizeTextarea(e);
									}}
									placeholder="Text"
									className="w-full p-3 border-0 bg-transparent resize-none overflow-hidden focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
									rows="1"
									onFocus={autoResizeTextarea}
									onInput={autoResizeTextarea}
								/>
							</div>
						</div>
					</div>
					{/* Delete Button */}
					<button
						onClick={() => deleteVerseRow(verse.id)}
						className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-xl h-10 w-10 flex items-center justify-center rounded-full transition-colors"
						title="Delete Verse"
					>
						×
					</button>
				</div>
			))}

			{/* Add Row / Import Buttons */}
			<div className="mt-3 flex items-center gap-2">
				<button
					onClick={addVerseRow}
					className="h-8 w-8 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
					title="Add verse row"
				>
					<span className="text-lg leading-none">+</span>
				</button>
				<button
					onClick={() => setImportOpen(true)}
					className="h-8 w-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
					title="Search and import a verse (English + Chinese)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="h-4 w-4"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
						/>
					</svg>
				</button>
			</div>

			<ImportVerseDialog
				isOpen={importOpen}
				onClose={() => setImportOpen(false)}
				onImport={handleImport}
			/>

			{/* Message Input */}
			<div className="mt-6">
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-semibold text-slate-700">{language === 'en' ? 'Message' : '信息'}</label>
					{day > 0 && (
						<div className="flex items-center">
							<input
								type="checkbox"
								id={checkboxId}
								checked={sameAsLastDay}
								onChange={handleSameAsLastDayChange}
								className="mr-2"
								disabled={day === 0}
							/>
							<label htmlFor={checkboxId} className="text-sm text-slate-600">
								Same as last day
							</label>
						</div>
					)}
				</div>
				<input
					value={message}
					onChange={handleMessageChange}
					placeholder="message"
					className={`message w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${sameAsLastDay ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75' : 'bg-slate-50'}`}
					disabled={sameAsLastDay}
				/>
			</div>
		</div>
	);
};

export default VerseSection;
