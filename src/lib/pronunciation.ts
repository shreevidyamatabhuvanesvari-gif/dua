/**
 * श्रुति — संस्कृत एवं वैदिक पाठ के उच्चारण-सहायक उपकरण
 *
 * यह फ़ाइल अपने आप में स्वतंत्र है।
 * इसमें किसी अनुपस्थित JSON फ़ाइल का import नहीं है।
 *
 * महत्वपूर्ण:
 * - यह ब्राउज़र की आवाज़ उत्पन्न नहीं करती।
 * - यह Speech Synthesis के लिए पाठ तैयार करने में सहायता करती है।
 * - वैदिक स्वर, पाठ-परंपरा और मंत्रों के विशेष उच्चारण
 *   बिना प्रमाणित स्रोत के अपने-आप निर्धारित नहीं करती।
 */

export type PronunciationCategory =
  | 'वैदिक'
  | 'मंत्र'
  | 'देवी-स्तोत्र'
  | 'सामान्य-संस्कृत';

export interface PronunciationEntry {
  /** मूल देवनागरी शब्द */
  word: string;

  /** वाचन इंजन को दिया जाने वाला पाठ */
  spokenText: string;

  /** शब्द की श्रेणी */
  category: PronunciationCategory;

  /** अतिरिक्त जानकारी */
  note?: string;
}

/**
 * प्रारंभिक शब्द-सूची।
 *
 * यह संपूर्ण वैदिक या संस्कृत शब्दकोश नहीं है।
 * इसमें केवल सावधानीपूर्वक चुनी गई प्रारंभिक प्रविष्टियाँ हैं।
 * नए, सत्यापित शब्द बाद में इसमें जोड़े जा सकते हैं।
 */
const BUILT_IN_ENTRIES: PronunciationEntry[] = [
  {
    word: 'ॐ',
    spokenText: 'ओम्',
    category: 'वैदिक',
    note:
      'सामान्य वाचन के लिए विकल्प। जहाँ परंपरा में ओ३म् या दीर्घ स्वर आवश्यक हो, वहाँ मूल पाठ सुरक्षित रखें।',
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

/**
 * देवनागरी के लिए मानकीकरण।
 *
 * NFC normalization संयुक्त Unicode वर्णों के अलग-अलग
 * रूपों को सामान्य रूप में लाने में सहायता करती है।
 *
 * वैदिक स्वर-चिह्नों को जानबूझकर हटाया नहीं जाता।
 */
export function normalizeSanskritText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** शब्दों के मिलान के लिए सामान्यीकृत कुंजी। */
function normalizeWord(word: string): string {
  return word.normalize('NFC').trim();
}

/** प्रारंभिक शब्द-सूची को खोजने योग्य रूप में रखें। */
const lexicon = new Map<string, PronunciationEntry>(
  BUILT_IN_ENTRIES.map((entry) => [
    normalizeWord(entry.word),
    entry,
  ]),
);

/**
 * शब्द की शब्दकोश-प्रविष्टि लौटाता है।
 * शब्द उपलब्ध न होने पर undefined लौटाता है।
 */
export function lookupPronunciation(
  word: string,
): PronunciationEntry | undefined {
  return lexicon.get(normalizeWord(word));
}

/**
 * किसी एक शब्द का वाचन-पाठ लौटाता है।
 * शब्द उपलब्ध न हो तो मूल शब्द सुरक्षित रहता है।
 */
export function getPronunciation(word: string): string {
  const normalized = normalizeWord(word);

  if (!normalized) {
    return '';
  }

  const entry = lookupPronunciation(normalized);

  return entry?.spokenText ?? normalized;
}

/** वैकल्पिक नाम: किसी एक शब्द का वाचन-पाठ। */
export const getWordPronunciation = getPronunciation;

/** वैकल्पिक नाम: किसी एक शब्द का वाचन-पाठ। */
export const pronounceWord = getPronunciation;

/**
 * पूरे पाठ को वाचन के लिए तैयार करता है।
 *
 * - मूल पंक्तियाँ और विराम-चिह्न सुरक्षित रखता है।
 * - ज्ञात शब्दों पर शब्दकोश के नियम लगाता है।
 * - अज्ञात शब्दों को नहीं हटाता।
 * - मूल पाठ को प्रमाणित वैदिक उच्चारण होने का दावा नहीं करता।
 */
export function preparePronunciationText(text: string): string {
  const normalized = normalizeSanskritText(text);

  if (!normalized) {
    return '';
  }

  /**
   * देवनागरी अक्षरों, मात्राओं और कुछ वैदिक चिह्नों
   * के समूहों को शब्द-मिलान के लिए पहचानें।
   * विराम-चिह्नों को बदलने से बचें।
   */
  const devanagariWord =
    /[\u0900-\u0957\u0960-\u0963\u0971-\u097F\u1CD0-\u1CFF]+/gu;

  return normalized.replace(devanagariWord, (word) => {
    return getPronunciation(word);
  });
}

/** वैकल्पिक नाम: वाचन के लिए पाठ तैयार करना। */
export const prepareTextForSpeech = preparePronunciationText;

/** वैकल्पिक नाम: वाचन के लिए पाठ तैयार करना। */
export const pronounceSanskritText = preparePronunciationText;

/**
 * पाठ को शब्दों में बाँटता है।
 * यह मूल पाठ को संशोधित नहीं करता।
 */
export function splitSanskritWords(text: string): string[] {
  const normalized = normalizeSanskritText(text);

  return normalized.match(
    /[\p{L}\p{M}\p{N}]+/gu,
  ) ?? [];
}

/**
 * किसी शब्द के लिए विशेष शब्दकोश-प्रविष्टि उपलब्ध है या नहीं।
 */
export function hasPronunciationEntry(word: string): boolean {
  return lexicon.has(normalizeWord(word));
}

/**
 * उपलब्ध प्रारंभिक शब्दकोश लौटाता है।
 * लौटाए गए शब्दों की सूची को बदलने के लिए यह फ़ंक्शन
 * आंतरिक Map का सीधा संदर्भ नहीं देता।
 */
export function getVedicLexicon(): PronunciationEntry[] {
  return BUILT_IN_ENTRIES.map((entry) => ({ ...entry }));
}

/** प्रारंभिक शब्द-सूची का सार्वजनिक, केवल-पठन संस्करण। */
export const VEDIC_LEXICON: readonly PronunciationEntry[] =
  BUILT_IN_ENTRIES;

/** सामान्य वैकल्पिक नाम। */
export const normalizeForSpeech = normalizeSanskritText;
