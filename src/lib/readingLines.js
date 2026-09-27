// Support for splitting a day into two parallel reading lines (e.g. "Life-study"
// and "Experience of Life") from a chosen weekday through Saturday.
//
// The first line ('ls') reuses the regular per-day storage key, so turning the
// split on or off keeps that content. The second line ('eol') is stored under
// its own key.

export const LINES = ['ls', 'eol'];

// Stored as a day index (1 = Mon … 6 = Sat) or 'off'.
export const SPLIT_FROM_DAY_KEY = 'splitFromDay';
export const DEFAULT_SPLIT_FROM_DAY = 3; // Wednesday

export const loadSplitFromDay = () => {
	try {
		const saved = localStorage.getItem(SPLIT_FROM_DAY_KEY);
		if (saved === null) return DEFAULT_SPLIT_FROM_DAY;
		if (saved === 'off') return null;
		const day = parseInt(saved, 10);
		return day >= 1 && day <= 6 ? day : DEFAULT_SPLIT_FROM_DAY;
	} catch {
		return DEFAULT_SPLIT_FROM_DAY;
	}
};

export const saveSplitFromDay = (day) => {
	try {
		localStorage.setItem(SPLIT_FROM_DAY_KEY, day === null ? 'off' : String(day));
	} catch {
		// Ignore write errors
	}
};

export const isSplitDay = (day, splitFromDay) => splitFromDay !== null && day >= splitFromDay;

// Storage key for one day's section; `line` is undefined for a regular day.
export const sectionStorageKey = (day, language, line) =>
	line === 'eol' ? `verse_${day}_${language}_eol` : `verse_${day}_${language}`;

const DEFAULT_LINE_TITLES = {
	'en': { ls: 'Life-study', eol: 'Experience of Life' },
	'zh-tw': { ls: '生命读经线', eol: '生命经历线' },
};

const lineTitlesKey = (language) => `line_titles_${language}`;

export const loadLineTitles = (language) => {
	const defaults = DEFAULT_LINE_TITLES[language] || DEFAULT_LINE_TITLES.en;
	try {
		const saved = localStorage.getItem(lineTitlesKey(language));
		return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
	} catch {
		return defaults;
	}
};

export const saveLineTitles = (language, titles) => {
	try {
		localStorage.setItem(lineTitlesKey(language), JSON.stringify(titles));
	} catch {
		// Ignore write errors
	}
};
