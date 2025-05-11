import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/dist/locale/zh-tw'; // Import the Chinese locale data

const TitleLine = ({ date, language }) => {
	const storageKey = `title_line_${language}`;
	const defaultTitle = language === 'en' ? 'Announcements' : '報告事項';

	// Load state from local storage
	const loadState = () => {
		try {
			const savedTitle = localStorage.getItem(storageKey);
			return savedTitle !== null ? savedTitle : defaultTitle;
		} catch (err) {
			return defaultTitle;
		}
	};

	const [titleText, setTitleText] = useState(loadState);
	const [formattedDate, setFormattedDate] = useState('');

	// Save state to local storage
	const saveState = (value) => {
		try {
			localStorage.setItem(storageKey, value);
		} catch {
			// Ignore write errors
		}
	};

	useEffect(() => {
		if (date) {
			const momentDate = moment(date);
			momentDate.locale(language);
			const formattedDate = momentDate.format("LL"); // Use the LL format
			setFormattedDate(formattedDate);
		}
	}, [date, language]);

	// Effect to update title if language changes
	useEffect(() => {
		setTitleText(loadState());
	}, [language]); // Re-load when language changes

	const handleInputChange = (e) => {
		const newTitle = e.target.value;
		setTitleText(newTitle); 
		saveState(newTitle); // Save the new title
	};

	return (
		<div className="title-line mb-6">
			<label htmlFor={`title-input-${language}`} className="block text-sm font-semibold text-slate-700 mb-2">
				{language === 'en' ? 'Date & Title' : '日期與主題'}
			</label>
			<div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg shadow-sm bg-slate-50 text-lg hover:border-blue-300">
				<span className="font-medium text-slate-600 flex-shrink-0">
					{formattedDate || ''}
				</span>
				<input
					id={`title-input-${language}`}
					type="text"
					value={titleText}
					onChange={handleInputChange}
					placeholder={language === 'en' ? "This week's subject" : "輸入主題"}
					className="flex-grow p-0 border-0 focus:ring-0 focus:border-transparent bg-transparent transition-all"
				/>
			</div>
		</div>
	);
};

export default TitleLine;
