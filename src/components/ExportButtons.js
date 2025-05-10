import React, { useState, useEffect } from 'react';
import moment from 'moment'; // Import moment for date calculation
import { v4 as uuidv4 } from 'uuid'; // Import for default verse structure

// Import pdfmake and vfs_fonts
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from '../fonts/Pingfang';

// Initialize pdfMake with the virtual file system
pdfMake.vfs = pdfFonts;

// Define default font to use
const defaultFont = 'PingFangSC';

// Set up fonts configuration
pdfMake.fonts = {
	PingFangSC: {
		normal: 'PingFangSC-Regular.otf',
		bold: 'PingFangSC-Semibold.otf',
		italics: 'PingFangSC-Regular.otf',
		bolditalics: 'PingFangSC-Semibold.otf'
	}
};

// Helper function to generate a new empty verse (consistent with VerseSection)
const createNewVerse = () => ({ id: uuidv4(), verseReference: "", verseText: "" });

// Helper function to load summary text from local storage
const loadSummaryState = (language) => {
	const storageKey = `summary_${language}`;
	try {
		const savedSummary = localStorage.getItem(storageKey);
		// Return saved summary or default based on language
		if (savedSummary !== null) {
			return savedSummary;
		} else {
			return language === 'en'
				? 'Summary'
				: '摘要';
		}
	} catch (err) {
		// Return default on error
		return language === 'en'
			? 'Summary'
			: '摘要';
	}
};

// Helper function to load title text from local storage
const loadTitleState = (language) => {
	const storageKey = `title_line_${language}`;
	try {
		const savedTitle = localStorage.getItem(storageKey);
		// Return saved title or default based on language
		if (savedTitle !== null) {
			return savedTitle;
		} else {
			return language === 'en' ? 'Announcements' : '報告事項';
		}
	} catch (err) {
		// Return default on error
		return language === 'en' ? 'Announcements' : '報告事項';
	}
};

// Load state for a specific day/language from local storage
const loadSectionState = (day, language) => {
	const storageKey = `verse_${day}_${language}`;
	try {
		const serializedState = localStorage.getItem(storageKey);
		if (serializedState === null) {
			return { book: "", verses: [createNewVerse()], message: "" };
		}
		const parsedState = JSON.parse(serializedState);
		// Ensure verses array exists and has at least one item
		if (!parsedState.verses || parsedState.verses.length === 0) {
			parsedState.verses = [createNewVerse()];
		}
		return parsedState;
	} catch (err) {
		return { book: "", verses: [createNewVerse()], message: "" };
	}
};

// Component now uses sundayDate and language props to fetch data from localStorage
const ExportButtons = ({ sundayDate, daysToShow = 7, startOnSunday = true, language }) => {
	const [pdfInitialized, setPdfInitialized] = useState(true); // Assume initialized
	const [error, setError] = useState(null);

	const generatePDF = (action = 'download') => {
		if (!pdfInitialized) {
			alert('PDF engine is not initialized.');
			return;
		}
		
		try {
			setError(null); // Clear previous errors

			// Determine Title and fetch Summary based on language
			const savedTitleText = loadTitleState(language);
			const sundayDateFormatted = moment(sundayDate).locale(language).format("LL");
			const titleLine = `${sundayDateFormatted} ${savedTitleText}`.trim(); // Construct full title
			const summaryText = loadSummaryState(language);

			const sectionData = [];
			// Only process the selected number of days and start from the correct day
			for (let i = 0; i < daysToShow; i++) {
				const day = startOnSunday ? i : i + 1;
				if (day <= 6) { // Make sure we don't go beyond day 6
					const date = moment(sundayDate).add(day, 'days').locale(language).format("MM/DD (ddd)");
					const sectionState = loadSectionState(day, language);
					sectionData.push({
						date: date,
						book: sectionState.book,
						verses: sectionState.verses,
						message: sectionState.message
					});
				}
			}
			
			// Create document definition using props data
			const docDefinition = {
				pageSize: 'LETTER',
				pageMargins: [40, 40, 40, 40],
				defaultStyle: {
					font: defaultFont,
					fontSize: 11
				},
				content: [
					// Title with underline
					{
						text: titleLine || ' ', // Use prop, provide default
						style: 'title',
						decoration: 'underline',
						decorationStyle: 'solid'
					},
					// Summary section
					{
						text: summaryText || '', // Use prop, provide default
						style: 'summary',
						margin: [0, 3, 0, 3]
					},
					// Bible verse sections from fetched data
					...sectionData.flatMap(section => {
						const contentElements = [
							{
								text: `${section.date || ''} ${section.book || ''}`.trim(),
								style: 'sectionHeader',
								margin: [0, 5, 0, 3]
							}
						];

						// Create a single table for all verses in this section
						if ((section.verses || []).length > 0) {
							const tableBody = [];
							
							// Map over verses within the section
							(section.verses || []).forEach(verse => {
								if (verse.verseReference?.trim() || verse.verseText?.trim()) { // Optional chaining for safety
									tableBody.push([
										{ text: verse.verseReference || '', style: 'verseRef' }, 
										{ text: verse.verseText || '', style: 'verseText' }
									]);
								}
							});
							
							if (tableBody.length > 0) {
								contentElements.push({
									table: {
										widths: ['15%', '85%'],
										body: tableBody
									},
									layout: {
										hLineWidth: function(i, node) { 
											// Only add horizontal lines at the top and bottom of the table
											return (i === 0 || i === node.table.body.length) ? 1 : 0; 
										},
										vLineWidth: function(i, node) { return (i === 1) ? 0 : 1; },
										paddingLeft: function(i) { return 5; },
										paddingRight: function(i) { return 5; },
										paddingTop: function(i) { return 5; },
										paddingBottom: function(i) { return 5; }
									}
								});
							}
						}
						
						// Only include message if it's not empty
						if (section.message && section.message.trim()) {
							contentElements.push({
								text: section.message,
								style: 'message',
								margin: [0, 3, 0, 3]
							});
						}
						
						return contentElements;
					})
				],
				styles: { // Styles remain the same for PDF
					title: {
						fontSize: 14,
						bold: true,
						margin: [0, 0, 0, 5]
					},
					summary: {
						fontSize: 12,
						bold: true,
						margin: [0, 0, 0, 5],
						lineHeight: 1.0
					},
					sectionHeader: {
						fontSize: 12,
						bold: true
					},
					verseRef: {
						fontSize: 12,
						bold: true
					},
					verseText: {
						fontSize: 12
					},
					message: {
						fontSize: 12,
						italics: true
					}
				}
			};
			
			// Generate PDF based on the action
			const pdfDoc = pdfMake.createPdf(docDefinition);
			
			// Define filename based on language
			const filename = language === 'en' ? 'church-announcements-en.pdf' : 'church-announcements-zh.pdf';

			if (action === 'download') {
				pdfDoc.download(filename);
			} else if (action === 'open') {
				pdfDoc.open();
			}
		} catch (err) {
			console.error('Error generating PDF:', err);
			setError('Failed to generate PDF: ' + err.message);
		}
	};

	// Common button styles
	const buttonClass = "px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50";

	// Determine button text based on language
	const downloadButtonText = language === 'en' ? 'Download PDF' : '下載 PDF';
	const openButtonText = language === 'en' ? 'Open PDF' : '打開 PDF';

	return (
		<div className="export-buttons mt-6 flex space-x-3 justify-center">
			{error && <div className="w-full text-center error-message text-red-600 text-sm mb-2">{error}</div>}
			<button
				onClick={() => generatePDF('download')}
				disabled={!pdfInitialized}
				className={buttonClass}
			>
				{downloadButtonText}
			</button>
			<button
				onClick={() => generatePDF('open')}
				disabled={!pdfInitialized}
				className={buttonClass}
			>
				{openButtonText}
			</button>
		</div>
	);
};

export default ExportButtons;
