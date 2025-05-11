import React, { useEffect, useState } from 'react';
import moment from 'moment';

const DatePicker = ({ onDateChange, language }) => {
	const [selectedDate, setSelectedDate] = useState('');

	useEffect(() => {
		// Find the upcoming Sunday (or today if it's Sunday)
		const today = moment();
		const dayOfWeek = today.day(); 
		
		// Calculate the upcoming Sunday
		let upcomingSunday;
		if (dayOfWeek === 0) {
			// Today is Sunday
			upcomingSunday = today;
		} else {
			// Add days needed to reach next Sunday
			upcomingSunday = today.clone().add(7 - dayOfWeek, 'days');
		}
		
		const formattedDate = upcomingSunday.format('YYYY-MM-DD');
		
		// Update internal state
		setSelectedDate(formattedDate);
		
		// Notify parent component
		onDateChange(formattedDate);
	}, []); // Run only once on mount

	const handleDateChange = (e) => {
		const newDate = e.target.value;
		setSelectedDate(newDate);
		onDateChange(newDate); 
	};

	return (
		<div className="relative">
			<input 
				className='date-picker w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 hover:border-blue-300'
				type="date" 
				value={selectedDate}
				onChange={handleDateChange} 
			/>
		</div>
	);
};

export default DatePicker;