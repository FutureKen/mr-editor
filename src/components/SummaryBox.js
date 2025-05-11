import React, { useState, useEffect } from 'react';

const SummaryBox = ({ language }) => {

	// Define language-specific default text
	const defaultText = language === 'en' 
		? "1. Come pray together in one accord for the saints and gospel warfare, every Tues. evening 8:00 - 9:30pm\n2. This week's reading material: "
		: "1. 每週二晚上 8:00-9:30 為聖徒和福音的爭戰同心合意地來在一起禱告\n2. 本週讀經進度: ";

	// Construct language-specific storage key
	const storageKey = `summary_${language}`;

	// Load state from local storage or use default
	const loadState = () => {
		try {
			const savedSummary = localStorage.getItem(storageKey);
			return savedSummary !== null ? savedSummary : defaultText;
		} catch (err) {
			return defaultText; // Return default on error
		}
	};

	const [summary, setSummary] = useState(loadState);

	// Save state to local storage
	const saveState = (value) => {
		try {
			localStorage.setItem(storageKey, value);
		} catch {
			// Ignore write errors
		}
	};

	const handleSummaryChange = (e) => {
		setSummary(e.target.value);
		saveState(e.target.value); // Save on change
		autoResizeTextarea(e.target);
	};

	// Auto-resize textarea height
	const autoResizeTextarea = (element) => {
		element.style.height = 'inherit';
		element.style.height = `${element.scrollHeight}px`;
	};

	// Initial resize on mount and language change
	useEffect(() => {
		// Use a unique ID based on language to select the correct textarea
		const textarea = document.getElementById(`summary-textarea-${language}`);
		if (textarea) {
			autoResizeTextarea(textarea);
		}
	}, [language, summary]); // Rerun if language or summary changes to ensure correct initial size

	// Update summary if loaded state changes (e.g., due to language switch in parent)
	useEffect(() => {
		setSummary(loadState());
	}, [language]); // Depend on language

	return (
		<div className="summary-box mb-6 bg-white rounded-xl p-5 border border-slate-200 shadow">
			<label htmlFor={`summary-textarea-${language}`} className="block text-sm font-semibold text-slate-700 mb-2">
				{language === 'en' ? 'Summary' : '本週總結'}
			</label>
			<textarea
				id={`summary-textarea-${language}`} // Unique ID for each textarea
				value={summary}
				onChange={handleSummaryChange}
				placeholder={language === 'en' ? "This week's summary" : "輸入本週總結"}
				className="w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden transition-all bg-slate-50"
				rows="3"
			/>
		</div>
	);
};

export default SummaryBox;
