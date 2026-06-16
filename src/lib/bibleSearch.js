/**
 * bibleSearch.js — shared singleton wrapper around Logos Seeker's BibleSearch.
 *
 * The verse data (~7.8MB) ships inside the logos-seeker npm package. Vite emits
 * the JSON files as static assets (via the `?url` imports below) and we fetch
 * them lazily on first use, indexing them on a single shared instance so the
 * download/index happens only once per page load even when multiple verse
 * sections open the import dialog.
 */

import { BibleSearch, COL } from "logos-seeker";
import versesUrl from "logos-seeker/data/verses.json?url";
import booksUrl from "logos-seeker/data/books.json?url";

export { COL };

let instance = null;
let loadPromise = null;

/** The shared BibleSearch instance (created on first call). */
export function getBibleSearch() {
  if (!instance) instance = new BibleSearch();
  return instance;
}

/**
 * Ensure the Bible data is loaded. Resolves once the shared instance is ready.
 */
export function ensureBibleLoaded() {
  const bs = getBibleSearch();
  if (!loadPromise) {
    loadPromise = (async () => {
      const [vRes, bRes] = await Promise.all([fetch(versesUrl), fetch(booksUrl)]);
      if (!vRes.ok || !bRes.ok) throw new Error("Failed to load Bible data files.");
      bs.setData(await vRes.json(), await bRes.json());
    })().catch((err) => {
      // Reset so a later attempt can retry the load.
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise.then(() => bs);
}

/**
 * Short book-name formatting for imported references.
 *
 * Long English book names are abbreviated; short ones (John, Luke, Acts, …) keep
 * their full name. Books absent from this map are left in full. Adjust an entry
 * here to change how a book is abbreviated.
 */
const EN_ABBR = {
  'Leviticus': 'Lev.',
  'Deuteronomy': 'Deut.',
  'Nehemiah': 'Neh.',
  'Proverbs': 'Prov.',
  'Ecclesiastes': 'Eccl.',
  'Song of Songs': 'Song',
  'Jeremiah': 'Jer.',
  'Lamentations': 'Lam.',
  'Habakkuk': 'Hab.',
  'Zephaniah': 'Zeph.',
  'Zechariah': 'Zech.',
  'Galatians': 'Gal.',
  'Ephesians': 'Eph.',
  'Philippians': 'Phil.',
  'Colossians': 'Col.',
  'Philemon': 'Philem.',
  'Revelation': 'Rev.',
  '1 Chronicles': '1 Chron.',
  '2 Chronicles': '2 Chron.',
  '1 Corinthians': '1 Cor.',
  '2 Corinthians': '2 Cor.',
  '1 Thessalonians': '1 Thes.',
  '2 Thessalonians': '2 Thes.',
};

const bookMeta = (row) => getBibleSearch().bookByIdx.get(row[COL.BOOK]);

/** English reference label: full name for short books, abbreviation for long. */
export function enRefLabel(row) {
  const b = bookMeta(row);
  const name = EN_ABBR[b.en] || b.en;
  return `${name} ${row[COL.CHAP]}:${row[COL.VERSE]}`;
}

/** Chinese reference label using the shortest (single/short char) book name. */
export function cnRefLabel(row) {
  const b = bookMeta(row);
  const names = [b.cn, ...(b.cnAlias || [])].filter(Boolean);
  const short = names.reduce((a, c) => (c.length < a.length ? c : a), names[0]);
  return `${short} ${row[COL.CHAP]}:${row[COL.VERSE]}`;
}
