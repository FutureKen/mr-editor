import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid'; // Import UUID


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
				return { book: "", verses: [createNewVerse()], message: "" };
			}
			const parsedState = JSON.parse(serializedState);
			// Ensure verses array exists and has at least one item
			if (!parsedState.verses || parsedState.verses.length === 0) {
				parsedState.verses = [createNewVerse()];
			}
			return parsedState;
		} catch (err) {
			// Initialize with one empty verse on error
			return { book: "", verses: [createNewVerse()], message: "" };
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
	const [sameAsLastDay, setSameAsLastDay] = useState(false);
	const [prevDayMessage, setPrevDayMessage] = useState(loadPrevDayMessage());

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

	// Delete a verse row, ensuring at least one remains
	const deleteVerseRow = (id) => {
		setVerses(currentVerses => {
			if (currentVerses.length <= 1) return currentVerses; // Keep at least one row
			return currentVerses.filter(verse => verse.id !== id);
		});
	};


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
		saveState({ book, verses, message }); // Save verses array
	}, [book, verses, message, storageKey]); // Add storageKey dependency

	const autoResizeTextarea = (e) => {
		e.target.style.height = 'inherit';
		e.target.style.height = `${e.target.scrollHeight}px`;
	};

	// Create a unique ID for checkbox that includes both day and language
	const checkboxId = `sameAsLastDay-${day}-${language}`;

	return (
		<div className="bible-verse-section bg-white rounded-xl p-6 mb-6 shadow-lg border border-slate-200">
			<div className="date-book-container mb-5">
				<div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg shadow-sm bg-slate-50">
					<span className="font-medium text-slate-600 flex-shrink-0">
						{computedDateString || ''} 
					</span>
					<input
						value={book}
						onChange={handleBookChange}
						placeholder="Book Name"
						className="book-input flex-grow p-0 border-0 focus:ring-0 focus:border-transparent bg-transparent transition-all"
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
					{/* Delete Button - only show if more than one verse exists */}
					{verses.length > 1 && (
						<button
							onClick={() => deleteVerseRow(verse.id)}
							className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-xl h-10 w-10 flex items-center justify-center rounded-full transition-colors"
							title="Delete Verse"
						>
							×
						</button>
					)}
				</div>
			))}

			{/* Add Row Button */}
			<button
				onClick={addVerseRow}
				className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center shadow-sm"
			>
				<span className="text-lg mr-1">+</span> Add Row
			</button>

			{/* Message Input */}
			<div className="mt-6">
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-semibold text-slate-700">Message</label>
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
					placeholder="Optional message"
					className="message w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50"
					disabled={sameAsLastDay}
				/>
			</div>
		</div>
	);
};

export default VerseSection;
