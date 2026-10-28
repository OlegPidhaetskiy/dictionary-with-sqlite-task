import * as SQLite from "expo-sqlite";

export const database = SQLite.openDatabase("dictionary.db");

const WORD_FIELDS = [
  "word",
  "phonetics",
  "audio",
  "partOfSpeech",
  "meaning",
  "image",
  "sourceUrl",
  "status",
  "dateForgets",
  "dateTotallyForgets",
  "forgettingSpan",
];

function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function init() {
  const wordsTable = execute(
    `CREATE TABLE IF NOT EXISTS words (
      word TEXT PRIMARY KEY NOT NULL,
      phonetics TEXT,
      audio TEXT,
      partOfSpeech TEXT,
      meaning TEXT,
      image TEXT,
      sourceUrl TEXT,
      status INTEGER,
      dateForgets INTEGER,
      dateTotallyForgets INTEGER,
      forgettingSpan INTEGER
    )`
  );
  const themeTable = execute(
    `CREATE TABLE IF NOT EXISTS theme (
      id INTEGER PRIMARY KEY NOT NULL,
      isDark INTEGER NOT NULL
    )`
  );
  return Promise.all([wordsTable, themeTable]);
}

function toValues(word) {
  return WORD_FIELDS.map((field) => word[field] ?? null);
}

export function addWord(word) {
  return execute(
    `INSERT OR REPLACE INTO words (${WORD_FIELDS.join(", ")})
     VALUES (${WORD_FIELDS.map(() => "?").join(", ")})`,
    toValues(word)
  );
}

export function updateWord(word) {
  const fields = WORD_FIELDS.filter((field) => field !== "word");
  return execute(
    `UPDATE words SET ${fields.map((field) => `${field} = ?`).join(", ")}
     WHERE word = ?`,
    [...fields.map((field) => word[field] ?? null), word.word]
  );
}

export function deleteWord(wordText) {
  return execute("DELETE FROM words WHERE word = ?", [wordText]);
}

export async function getWords() {
  const result = await execute("SELECT * FROM words");
  const words = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    const word = {};
    for (const field of WORD_FIELDS) {
      if (row[field] !== null && row[field] !== undefined) {
        word[field] = row[field];
      }
    }
    words.push(word);
  }
  return words;
}

export async function getTheme() {
  const result = await execute("SELECT isDark FROM theme WHERE id = 1");
  if (result.rows.length === 0) return true; // dark is the default theme
  return result.rows.item(0).isDark === 1;
}

export function setTheme(isDark) {
  return execute("INSERT OR REPLACE INTO theme (id, isDark) VALUES (1, ?)", [
    isDark ? 1 : 0,
  ]);
}
