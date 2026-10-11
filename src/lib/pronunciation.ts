/**
 * श्रुति — संस्कृत एवं वैदिक पाठ के उच्चारण-सहायक उपकरण
 *
 * यह मॉड्यूल निम्न स्थानीय JSON डेटा-संग्रहों का उपयोग करता है:
 * - data/complex-words.json
 * - data/vedic-letters.json
 * - data/mahesvara-sutras.json
 *
 * यह मॉड्यूल स्वयं ध्वनि उत्पन्न नहीं करता।
 * वास्तविक आवाज़ ब्राउज़र की Speech Synthesis सुविधा से आती है।
 * शुद्ध वैदिक स्वराघात या विशेष पाठ-परम्परा के उच्चारण की
 * गारंटी किसी शब्द-सूची से अपने-आप नहीं मिलती।
 */

import complexWordsJson from '../../data/complex-words.json';
import vedicLettersJson from '../../data/vedic-letters.json';
import mahesvaraSutrasJson from '../../data/mahesvara-sutras.json';

export type PronunciationCategory =
  | 'वैदिक'
  | 'मंत्र'
  | 'देवी-स्तोत्र'
  | 'सामान्य-संस्कृत';

export interface PronunciationEntry {
  word: string;
  spokenText: string;
  category: PronunciationCategory;
  note?: string;
}

export interface VedicLetterEntry {
  id: string;
  character: string;
  unicodeCodePoint: string;
  label: string;
  subtype?: string;
  unicodeName?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface VedicLetterGroup {
  id: string;
  title: string;
  category: string;
  scope: string;
  notes?: string;
  items: VedicLetterEntry[];
  [key: string]: unknown;
}

export interface MaheshvaraSutra {
  id: string;
  sequence: number;
  type: string;
  text: string;
  displayText: string;
  speechText: string | null;
  analysis?: Record<string, unknown>;
  sourceRef?: Record<string, unknown>;
  tags?: string[];
  [key: string]: unknown;
}

interface ComplexWordRecord {
  id?: string;
  word: string;
  spokenText?: string | null;
  category?: string;
  variants?: string[] | null;
  notes?: string;
  enabled?: boolean;
  preserveVedicAccents?: boolean;
  confidence?: string;
  sourceStatus?: string;
  textVerification?: string;
  source?: {
    status?: string;
    references?: unknown[];
    reviewerNote?: string;
  };
}

interface ComplexWordsFile {
  schemaVersion: number;
  dataset?: {
    id?: string;
    title?: string;
    version?: string;
  };
  entries: ComplexWordRecord[];
  [key: string]: unknown;
}

interface VedicLettersFile {
  schemaVersion: number;
  dataset?: {
    id?: string;
    title?: string;
    version?: string;
  };
  groups: VedicLetterGroup[];
  pronunciationPolicy?: Record<string, unknown>;
  [key: string]: unknown;
}

interface MaheshvaraSutrasFile {
  schemaVersion: number;
  dataset?: {
    id?: string;
    title?: string;
    version?: string;
    audit?: Record<string, unknown>;
  };
  items: MaheshvaraSutra[];
  [key: string]: unknown;
}

const complexWords =
  complexWordsJson as unknown as ComplexWordsFile;

const vedicLetters =
  vedicLettersJson as unknown as VedicLettersFile;

const mahesvaraSutras =
  mahesvaraSutrasJson as unknown as MaheshvaraSutrasFile;

/**
 * प्रारम्भिक शब्द-सूची।
 * यह सम्पूर्ण संस्कृत या वैदिक शब्दकोश नहीं है।
 */
const BUILT_IN_ENTRIES: PronunciationEntry[] = [
  {
    word: 'ॐ',
    spokenText: 'ओम्',
    category: 'वैदिक',
    note:
      'सामान्य वाचन का विकल्प। जहाँ परम्परा में ओ३म् या दीर्घ स्वर आवश्यक हो, वहाँ मूल पाठ सुरक्षित रखें।',
  },
  {
    word: 'अग्निम्',
    spokenText: 'अग्निम्',
    category: 'वैदिक',
  },
  {
    word: 'ऋत्विजम्',
    spokenText: 'ऋत्विजम्',
    category: 'वैदिक',
  },
  {
    word: 'यज्ञस्य',
    spokenText: 'यज्ञस्य',
    category: 'वैदिक',
  },
  {
    word: 'स्वाहा',
    spokenText: 'स्वाहा',
    category: 'मंत्र',
  },
  {
    word: 'स्वधा',
    spokenText: 'स्वधा',
    category: 'मंत्र',
  },
  {
    word: 'नमः',
    spokenText: 'नमः',
    category: 'मंत्र',
  },
  {
    word: 'त्र्यम्बकम्',
    spokenText: 'त्र्यम्बकम्',
    category: 'वैदिक',
  },
  {
    word: 'महामृत्युञ्जय',
    spokenText: 'महामृत्युञ्जय',
    category: 'मंत्र',
  },
  {
    word: 'दुर्गे',
    spokenText: 'दुर्गे',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'चामुण्डायै',
    spokenText: 'चामुण्डायै',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'महिषासुरमर्दिनि',
    spokenText: 'महिषासुरमर्दिनि',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'ललिता',
    spokenText: 'ललिता',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'सहस्रनाम',
    spokenText: 'सहस्रनाम',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'त्रिपुरसुन्दरी',
    spokenText: 'त्रिपुरसुन्दरी',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'भुवनेश्वरी',
    spokenText: 'भुवनेश्वरी',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'नारायणी',
    spokenText: 'नारायणी',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'चण्डिका',
    spokenText: 'चण्डिका',
    category: 'देवी-स्तोत्र',
  },
  {
    word: 'कात्यायनी',
    spokenText: 'कात्यायनी',
    category: 'देवी-स्तोत्र',
  },
];

/** शब्द-मिलान के लिए Unicode NFC सामान्यीकरण। */
function normalizeWord(word: string): string {
  return word.normalize('NFC').trim();
}

/** JSON की category को ऐप की मान्य श्रेणी में बदलता है। */
function mapCategory(
  category?: string,
): PronunciationCategory {
  const value = (category ?? '').toLowerCase();

  if (
    value.includes('vedic') ||
    value.includes('वैदिक')
  ) {
    return 'वैदिक';
  }

  if (
    value.includes('mantra') ||
    value.includes('मंत्र')
  ) {
    return 'मंत्र';
  }

  if (
    value.includes('stotra') ||
    value.includes('deity') ||
    value.includes('देवी') ||
    value.includes('स्तोत्र')
  ) {
    return 'देवी-स्तोत्र';
  }

  return 'सामान्य-संस्कृत';
}

/**
 * शब्द और JSON में दिये गये वैकल्पिक रूपों को Map में रखता है।
 * JSON में किसी शब्द की प्रविष्टि होने पर वह प्रारम्भिक सूची पर प्राथमिक होगी।
 */
const lexicon = new Map<string, PronunciationEntry>();

const aliasReplacements: Array<{
  alias: string;
  entry: PronunciationEntry;
}> = [];

for (const entry of BUILT_IN_ENTRIES) {
  lexicon.set(normalizeWord(entry.word), { ...entry });
}

for (const record of complexWords.entries ?? []) {
  if (record.enabled === false) {
    continue;
  }

  if (
    typeof record.word !== 'string' ||
    !record.word.trim()
  ) {
    continue;
  }

  const word = normalizeWord(record.word);

  const suppliedSpeechText =
    typeof record.spokenText === 'string'
      ? normalizeWord(record.spokenText)
      : '';

  const spokenText = suppliedSpeechText || word;

  const entry: PronunciationEntry = {
    word,
    spokenText,
    category: mapCategory(record.category),
    ...(record.notes ? { note: record.notes } : {}),
  };

  lexicon.set(normalizeWord(word), entry);

  for (const variant of record.variants ?? []) {
    if (
      typeof variant === 'string' &&
      variant.trim()
    ) {
      const alias = normalizeWord(variant);

      lexicon.set(alias, entry);
      aliasReplacements.push({ alias, entry });
    }
  }
}

/**
 * सामान्यीकरण:
 * - Unicode NFC लागू करता है।
 * - Windows और Mac/Linux के line breaks एकरूप करता है।
 * - वैदिक स्वर-चिह्नों को जानबूझकर नहीं हटाता।
 */
export function normalizeSanskritText(
  text: string,
): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** शब्द की प्रविष्टि उपलब्ध हो तो उसे लौटाता है। */
export function lookupPronunciation(
  word: string,
): PronunciationEntry | undefined {
  return lexicon.get(normalizeWord(word));
}

/** किसी शब्द का वाचन-पाठ लौटाता है; अज्ञात शब्द मूल रूप में रहता है। */
export function getPronunciation(
  word: string,
): string {
  const normalized = normalizeWord(word);

  if (!normalized) {
    return '';
  }

  return (
    lookupPronunciation(normalized)?.spokenText ??
    normalized
  );
}

export const getWordPronunciation = getPronunciation;

export const pronounceWord = getPronunciation;

/** RegExp में विशेष अर्थ रखने वाले चिह्न escape करता है। */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * पूरे पाठ को वाचन के लिए तैयार करता है।
 *
 * ज्ञात शब्दों और स्पष्ट रूप से दर्ज variants का मिलान होता है।
 * अज्ञात शब्द, विराम-चिह्न और वैदिक चिह्न अपने-आप नहीं हटाए जाते।
 */
export function preparePronunciationText(
  text: string,
): string {
  const normalized = normalizeSanskritText(text);

  if (!normalized) {
    return '';
  }

  let result = normalized;

  /**
   * पहले स्पष्ट variants मिलाएँ।
   * इससे "नम:" जैसे विराम-चिह्न वाले रूपों का भी मिलान हो सकता है।
   */
  const aliases = [...aliasReplacements].sort(
    (a, b) => b.alias.length - a.alias.length,
  );

  for (const { alias, entry } of aliases) {
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{M}\\p{N}])${escapeRegExp(alias)}(?![\\p{L}\\p{M}\\p{N}])`,
      'gu',
    );

    result = result.replace(
      pattern,
      entry.spokenText,
    );
  }

  /**
   * देवनागरी अक्षरों, मात्राओं और वैदिक चिह्नों के समूह खोजें।
   * मिलान exact normalized शब्द पर आधारित है।
   */
  const devanagariWord =
    /[\u0900-\u0957\u0960-\u0963\u0971-\u097F\u1CD0-\u1CFF]+/gu;

  return result.replace(
    devanagariWord,
    (word) => getPronunciation(word),
  );
}

export const prepareTextForSpeech =
  preparePronunciationText;

export const pronounceSanskritText =
  preparePronunciationText;

/** पाठ को शब्दों में बाँटता है; मूल पाठ संशोधित नहीं करता। */
export function splitSanskritWords(
  text: string,
): string[] {
  return (
    normalizeSanskritText(text).match(
      /[\p{L}\p{M}\p{N}]+/gu,
    ) ?? []
  );
}

/** क्या किसी शब्द की विशेष उच्चारण-प्रविष्टि उपलब्ध है? */
export function hasPronunciationEntry(
  word: string,
): boolean {
  return lexicon.has(normalizeWord(word));
}

/**
 * प्रारम्भिक शब्द-संग्रह की copy लौटाता है।
 * आन्तरिक Map का प्रत्यक्ष reference बाहर नहीं जाता।
 */
export function getVedicLexicon(): PronunciationEntry[] {
  return Array.from(new Set(lexicon.values())).map(
    (entry) => ({ ...entry }),
  );
}

export const VEDIC_LEXICON: readonly PronunciationEntry[] =
  getVedicLexicon();

export const normalizeForSpeech = normalizeSanskritText;

/** वैदिक वर्ण एवं चिह्न समूहों की copy लौटाता है। */
export function getVedicLetterGroups(): VedicLetterGroup[] {
  return (vedicLetters.groups ?? []).map((group) => ({
    ...group,
    items: (group.items ?? []).map((item) => ({
      ...item,
    })),
  }));
}

/** किसी वर्ण/चिह्न का रिकॉर्ड खोजता है। */
export function lookupVedicLetter(
  character: string,
): VedicLetterEntry | undefined {
  const key = normalizeWord(character);

  for (const group of vedicLetters.groups ?? []) {
    const match = (group.items ?? []).find(
      (item) =>
        normalizeWord(item.character) === key,
    );

    if (match) {
      return { ...match };
    }
  }

  return undefined;
}

/** माहेश्वर सूत्रों को मूल क्रम में लौटाता है। */
export function getMaheshvaraSutras(): MaheshvaraSutra[] {
  return [...(mahesvaraSutras.items ?? [])]
    .sort((a, b) => a.sequence - b.sequence)
    .map((item) => ({
      ...item,
      tags: item.tags ? [...item.tags] : undefined,
      analysis: item.analysis
        ? { ...item.analysis }
        : undefined,
      sourceRef: item.sourceRef
        ? { ...item.sourceRef }
        : undefined,
    }));
}

/**
 * माहेश्वर सूत्रों का पाठ टेक्स्ट बॉक्स में भरने के लिए देता है।
 * speechText null होने पर displayText, और उसके अभाव में text इस्तेमाल होता है।
 */
export function getMaheshvaraSutraText(): string {
  return getMaheshvaraSutras()
    .map(
      (item) =>
        item.displayText?.trim() || item.text,
    )
    .filter(Boolean)
    .join('\n');
}

/** ऐप में वास्तविक डेटा-संग्रहों की स्थिति दिखाने हेतु सारांश। */
export function getPronunciationDatasetSummary() {
  const letterItems = (
    vedicLetters.groups ?? []
  ).flatMap((group) => group.items ?? []);

  const enabledComplexWords = (
    complexWords.entries ?? []
  ).filter(
    (entry) =>
      entry.enabled !== false &&
      typeof entry.word === 'string' &&
      entry.word.trim(),
  );

  return {
    complexWordEntries: enabledComplexWords.length,

    totalComplexWordEntries:
      (complexWords.entries ?? []).length,

    pronunciationEntries:
      Array.from(new Set(lexicon.values())).length,

    vedicLetterGroups:
      (vedicLetters.groups ?? []).length,

    vedicLetterItems: letterItems.length,

    uniqueVedicCharacters: new Set(
      letterItems
        .filter(
          (item) => typeof item.character === 'string',
        )
        .map((item) => normalizeWord(item.character)),
    ).size,

    mahesvaraSutras:
      (mahesvaraSutras.items ?? []).length,

    complexWordsVersion:
      complexWords.dataset?.version ?? 'अज्ञात',

    vedicLettersVersion:
      vedicLetters.dataset?.version ?? 'अज्ञात',

    mahesvaraSutrasVersion:
      mahesvaraSutras.dataset?.version ?? 'अज्ञात',

    speechTested: false,
  };
}
