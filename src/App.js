import React, { useState, useEffect } from 'react';
import DatePicker from './components/DatePicker';
import TitleLine from './components/TitleLine';
import VerseSection from './components/VerseSection';
import ExportButtons from './components/ExportButtons';
import SummaryBox from './components/SummaryBox';
import moment from 'moment';
import './index.css';

// Define the LanguageColumn component here or import if moved to separate file
const LanguageColumn = ({ language, sundayDate, daysToShow, startOnSunday }) => {
	return (
		<div className="language-column w-full lg:w-[48%] bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
			<h2 className="text-xl font-bold mb-4 text-center text-slate-800">{language === 'en' ? 'English' : '中文'}</h2>
			<TitleLine
				date={sundayDate} 
				language={language}
			/>
			<SummaryBox 
				key={`summary-${language}`}
				language={language}
			/>
			{/* Render VerseSection components based on daysToShow and startOnSunday */}
			<div id={`exportContent-${language}`}>
				{Array.from({ length: daysToShow }).map((_, index) => {
					const day = startOnSunday ? index : index + 1;
					if (day <= 6) {
						return (
							<VerseSection 
								key={`day-${day}-${language}`} 
								day={day} 
								sundayDate={sundayDate} 
								language={language} 
							/>
						);
					}
					return null;
				})}
			</div>
			{/* Export buttons for this language */}
			<div className="mt-4">
				<ExportButtons 
					sundayDate={sundayDate} 
					daysToShow={daysToShow}
					startOnSunday={startOnSunday}
					language={language}
				/>
			</div>
		</div>
	);
};

const App = () => {
	// Keep state for the selected Sunday and the *primary* language for export/UI toggle
	const [sundayDate, setSundayDate] = useState(() => {
		// Try to load saved date or default
		const savedDate = localStorage.getItem('sundayDate');
		return savedDate ? moment(savedDate) : moment().day(0); // Default to upcoming Sunday
	});
	
	// Add state for days to show and whether to start on Sunday
	const [daysToShow, setDaysToShow] = useState(() => {
		const saved = localStorage.getItem('daysToShow');
		return saved ? parseInt(saved, 10) : 7; // Default to 7 days
	});
	
	const [startOnSunday, setStartOnSunday] = useState(() => {
		const saved = localStorage.getItem('startOnSunday');
		return saved !== null ? JSON.parse(saved) : true; // Default to true
	});

	// Save date and preferences
	useEffect(() => {
		localStorage.setItem('sundayDate', sundayDate.format('YYYY-MM-DD'));
		localStorage.setItem('daysToShow', daysToShow.toString());
		localStorage.setItem('startOnSunday', JSON.stringify(startOnSunday));
	}, [sundayDate, daysToShow, startOnSunday]);

	// Handler for the DatePicker component
	const handleDateChange = (isoDateString) => {
		setSundayDate(moment(isoDateString));
	};

	return (
		// Use Tailwind for overall layout and responsive grid
		<div className="container mx-auto p-6 font-sans bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
			{/* Header controls */}
			<div className="flex justify-between items-center mb-8 flex-wrap gap-4 bg-white p-4 rounded-xl shadow-md">
				<h1 className="text-2xl font-bold text-slate-800">Weekly Announcements Composer</h1>
				<div className="flex items-center gap-4 flex-wrap">
					<span className="text-sm text-slate-600">Starting Date: </span>
					<DatePicker onDateChange={handleDateChange} />
					
					<div className="flex items-center gap-2 ml-4">
						<label className="text-sm text-slate-600">Number of days:</label>
						<select 
							value={daysToShow}
							onChange={(e) => setDaysToShow(parseInt(e.target.value, 10))}
							className="border border-slate-300 rounded p-1 text-sm"
						>
							{[1, 2, 3, 4, 5, 6, 7].map(num => (
								<option key={num} value={num}>{num}</option>
							))}
						</select>
					</div>
					
					<div className="flex items-center gap-2 ml-4">
						<input 
							type="checkbox" 
							id="startOnSunday"
							checked={startOnSunday}
							onChange={(e) => setStartOnSunday(e.target.checked)}
							className="border border-slate-300 rounded"
						/>
						<label htmlFor="startOnSunday" className="text-sm text-slate-600">
							Start on Sunday
						</label>
					</div>
				</div>
			</div>

			{/* Main content area: Flexbox for side-by-side view */}
			{/* Columns are centered and wrap if needed */}
			<div className="flex justify-center gap-8 flex-wrap">
				<LanguageColumn 
					language="en" 
					sundayDate={sundayDate} 
					daysToShow={daysToShow}
					startOnSunday={startOnSunday}
				/>
				<LanguageColumn 
					language="zh-tw" 
					sundayDate={sundayDate} 
					daysToShow={daysToShow}
					startOnSunday={startOnSunday}
				/>
			</div>
		</div>
	);
};

export default App;
