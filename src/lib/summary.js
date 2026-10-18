// Summary content is stored as HTML (from the rich text editor) under
// `summary_${language}`. Older saves are plain text; those are converted on load.

const escapeHtml = (text) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The PDF used to print the whole summary in bold, so converted plain text stays bold.
export const plainTextToHtml = (text) =>
	text
		.split('\n')
		.map(line => (line.trim() ? `<p><strong>${escapeHtml(line)}</strong></p>` : '<p></p>'))
		.join('');

const looksLikeHtml = (value) => /^\s*<(p|ol|ul|h[1-6]|blockquote)[\s>]/i.test(value);

export const defaultSummaryHtml = (language) => (language === 'en'
	? '<ol><li><p><strong>Come pray together in one accord for the saints and gospel warfare, every Tues. evening 8:00 - 9:30pm</strong></p></li><li><p><strong>This week\'s reading material: </strong></p></li></ol>'
	: '<ol><li><p><strong>每週二晚上 8:00-9:30 為聖徒和福音的爭戰同心合意地來在一起禱告</strong></p></li><li><p><strong>本週讀經進度: </strong></p></li></ol>');

export const summaryStorageKey = (language) => `summary_${language}`;

export const loadSummaryHtml = (language) => {
	try {
		const saved = localStorage.getItem(summaryStorageKey(language));
		if (saved === null) return defaultSummaryHtml(language);
		return looksLikeHtml(saved) ? saved : plainTextToHtml(saved);
	} catch {
		return defaultSummaryHtml(language);
	}
};

export const saveSummaryHtml = (language, html) => {
	try {
		localStorage.setItem(summaryStorageKey(language), html);
	} catch {
		// Ignore write errors
	}
};
