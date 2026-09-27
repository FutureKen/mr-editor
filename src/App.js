import React, { useState, useEffect } from 'react';
import DatePicker from './components/DatePicker';
import TitleLine from './components/TitleLine';
import VerseSection, { CLEAR_VERSES_EVENT } from './components/VerseSection';
import ExportButtons from './components/ExportButtons';
import SummaryBox from './components/SummaryBox';
import moment from 'moment';
import { isSplitDay, loadSplitFromDay, saveSplitFromDay, loadLineTitles, saveLineTitles } from './lib/readingLines';
import './index.css';

// Define the LanguageColumn component here or import if moved to separate file
const LanguageColumn = ({ language, sundayDate, daysToShow, startOnSunday, splitFromDay }) => {
	const [lineTitles, setLineTitles] = useState(() => loadLineTitles(language));

	const handleLineTitleChange = (line, value) => {
		const next = { ...lineTitles, [line]: value };
		setLineTitles(next);
		saveLineTitles(language, next);
	};

	const days = Array.from({ length: daysToShow })
		.map((_, index) => (startOnSunday ? index : index + 1))
		.filter(day => day <= 6);
	const hasSplitDays = days.some(day => isSplitDay(day, splitFromDay));

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
			{/* Titles of the two reading lines used on split days */}
			{hasSplitDays && (
				<div className="mb-6 bg-white rounded-xl p-5 border border-slate-200 shadow">
					<label className="block text-sm font-semibold text-slate-700 mb-2">
						{language === 'en' ? 'Reading lines' : '讀經線'}
					</label>
					<div className="flex gap-3">
						<input
							value={lineTitles.ls}
							onChange={(e) => handleLineTitleChange('ls', e.target.value)}
							className="w-1/2 p-2 border border-slate-200 border-l-4 border-l-amber-400 rounded-lg bg-slate-50"
						/>
						<input
							value={lineTitles.eol}
							onChange={(e) => handleLineTitleChange('eol', e.target.value)}
							className="w-1/2 p-2 border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg bg-slate-50"
						/>
					</div>
				</div>
			)}
			{/* Render VerseSection components based on daysToShow and startOnSunday */}
			<div id={`exportContent-${language}`}>
				{days.map(day => {
					if (!isSplitDay(day, splitFromDay)) {
						return (
							<VerseSection
								key={`day-${day}-${language}`}
								day={day}
								sundayDate={sundayDate}
								language={language}
							/>
						);
					}
					// Split day: one section per reading line. "Same as last day"
					// for the second line only makes sense if yesterday was split too.
					return (
						<div key={`day-${day}-split-${language}`} className="mb-6 p-3 rounded-xl bg-slate-100 shadow-lg border border-slate-200">
							<VerseSection
								key={`day-${day}-ls-${language}`}
								day={day}
								sundayDate={sundayDate}
								language={language}
								line="ls"
								lineTitle={lineTitles.ls}
							/>
							<VerseSection
								key={`day-${day}-eol-${language}`}
								day={day}
								sundayDate={sundayDate}
								language={language}
								line="eol"
								lineTitle={lineTitles.eol}
								canCopyPrevDay={isSplitDay(day - 1, splitFromDay)}
							/>
						</div>
					);
				})}
			</div>
			{/* Export buttons for this language */}
			<div className="mt-4">
				<ExportButtons 
					sundayDate={sundayDate} 
					daysToShow={daysToShow}
					startOnSunday={startOnSunday}
					splitFromDay={splitFromDay}
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

	// Day (1 = Mon … 6 = Sat) from which each day has two reading lines; null = off
	const [splitFromDay, setSplitFromDay] = useState(loadSplitFromDay);

	useEffect(() => {
		saveSplitFromDay(splitFromDay);
	}, [splitFromDay]);

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

	// Clear every verse row on the page (both columns, all days) after confirming.
	const handleClearAllVerses = () => {
		if (window.confirm('Clear all verses on the page? This cannot be undone.')) {
			window.dispatchEvent(new CustomEvent(CLEAR_VERSES_EVENT));
		}
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

					<div className="flex items-center gap-2 ml-4">
						<label htmlFor="splitFromDay" className="text-sm text-slate-600">Two reading lines from:</label>
						<select
							id="splitFromDay"
							value={splitFromDay === null ? 'off' : splitFromDay}
							onChange={(e) => setSplitFromDay(e.target.value === 'off' ? null : parseInt(e.target.value, 10))}
							className="border border-slate-300 rounded p-1 text-sm"
							title="Days from this weekday through Saturday get two parallel reading lines (e.g. Life-study and Experience of Life)"
						>
							<option value="off">Off</option>
							{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => (
								<option key={name} value={i + 1}>{name}–Sat</option>
							))}
						</select>
					</div>

					<button
						onClick={handleClearAllVerses}
						className="ml-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium shadow-sm"
						title="Clear all verse rows in both columns for every day"
					>
						Clear All Verses
					</button>
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
					splitFromDay={splitFromDay}
				/>
				<LanguageColumn 
					language="zh-tw" 
					sundayDate={sundayDate} 
					daysToShow={daysToShow}
					startOnSunday={startOnSunday}
					splitFromDay={splitFromDay}
				/>
			</div>
		</div>
	);
};

export default App;
