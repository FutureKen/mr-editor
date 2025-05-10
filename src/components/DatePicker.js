import React from 'react';

const DatePicker = ({ onDateChange, language }) => {
	const handleDateChange = (e) => {
		// Format the date before sending it up to the parent component
		// Using ISO 8601 format (YYYY-MM-DD) for consistency internally
		const selectedDate = e.target.value; // Keep as YYYY-MM-DD
		onDateChange(selectedDate); 
	};

	return (
		<div className="relative">
			<input 
				className='date-picker w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 hover:border-blue-300'
				type="date" 
				onChange={handleDateChange} 
			/>
		</div>
	);
};

export default DatePicker;
