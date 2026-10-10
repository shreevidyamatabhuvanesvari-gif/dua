import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent } from 'react';

type ReadStatus = 'ready' | 'reading' | 'paused' | 'completed';
type SpeechLanguage = 'hi-IN' | 'sa-IN';

const SAMPLE_TEXT =
  'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम्।\nहोतारं रत्नधातमम्॥';

/**
 * पाठ को वाचन की अलग-अलग पंक्तियों में बाँटता है।
 * देवनागरी अक्षरों और वैदिक चिह्नों को बदलता नहीं है।
 */
function splitTextIntoLines(value: string): string[] {
  const physicalLines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (physicalLines.length === 1) {
    return physicalLines[0]
      .split(/(?<=[।॥.!?])\s+/u)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return physicalLines;
}

/**
 * चुनी गई भाषा के अनुकूल ब्राउज़र वाणी खोजता है।
 * संस्कृत वाणी न मिलने पर हिंदी या अन्य उपलब्ध वाणी मिल सकती है।
 */
function chooseVoice(
  language: SpeechLanguage,
  voices: SpeechSynthesisVoice[],
  selectedVoiceURI: string,
): SpeechSynthesisVoice | undefined {
  if (selectedVoiceURI) {
    const selected = voices.find(
      (voice) => voice.voiceURI === selectedVoiceURI,
    );

    if (selected) return selected;
  }

  const languageCode = language.slice(0, 2).toLowerCase();

  return (
    voices.find(
      (voice) => voice.lang.toLowerCase() === language.toLowerCase(),
    ) ??
    voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith(`${languageCode}-`),
    ) ??
    (language === 'sa-IN'
      ? voices.find((voice) =>
          voice.lang.toLowerCase().startsWith('hi-'),
        )
      : undefined) ??
    voices.find((voice) => voice.default) ??
    voices[0]
  );
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<ReadStatus>('ready');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [message, setMessage] = useState(
    'वीडियो चुनें और संस्कृत या हिंदी पाठ लिखें अथवा पेस्ट करें।',
  );
  const [language, setLanguage] = useState<SpeechLanguage>('hi-IN');
  const [rate, setRate] = useState(0.85);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const readingRef = useRef(false);
  const sessionRef = useRef(0);
  const linesRef = useRef<string[]>([]);

  const lines = useMemo(
    () => splitTextIntoLines(text),
    [text],
  );

  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  /**
   * उपलब्ध ब्राउज़र वाणियों की सूची लोड करता है।
   */
  useEffect(() => {
    if (!speechSupported) return;

    const refreshVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    refreshVoices();

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      refreshVoices,
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        refreshVoices,
      );
    };
  }, [speechSupported]);

  /**
   * ऐप बंद होने पर चल रहे वाचन और स्थानीय वीडियो URL की सफाई।
   */
  useEffect(() => {
    return () => {
      readingRef.current = false;
      sessionRef.current += 1;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  /**
   * पाठ या वीडियो में बदलाव से पहले पुराना वाचन रोकता है।
   */
  const stopForContentChange = useCallback(() => {
    readingRef.current = false;
    sessionRef.current += 1;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setStatus('ready');
    setCurrentLineIndex(0);

    if (videoRef.current) {
      videoRef.current.loop = false;
      videoRef.current.pause();
    }
  }, []);

  const handleTextChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    stopForContentChange();
    setText(event.currentTarget.value);
    setMessage(
      'पाठ बदला गया है। वाचन शुरू करने पर पंक्तियाँ क्रम से पढ़ी जाएँगी।',
    );
  };

  /**
   * स्थानीय वीडियो फ़ाइल चुनने और लोड करने का कार्य।
   */
  const handleVideoUpload = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const looksLikeVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|webm|ogg|mov|m4v|avi)$/i.test(file.name);

    if (!looksLikeVideo) {
      setMessage('कृपया समर्थित वीडियो फ़ाइल चुनें।');
      input.value = '';
      return;
    }

    stopForContentChange();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);

    objectUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setVideoName(file.name);
    setMessage(`वीडियो तैयार है: ${file.name}`);

    input.value = '';
  };

  /**
   * TXT या MD फ़ाइल से पाठ पढ़ता है।
   */
  const handleTextFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const content = await file.text();

      stopForContentChange();
      setText(content);
      setMessage(`पाठ फ़ाइल लोड हुई: ${file.name}`);
    } catch (error) {
      console.error('पाठ फ़ाइल पढ़ने में त्रुटि:', error);

      setMessage(
        'पाठ फ़ाइल पढ़ी नहीं जा सकी। कृपया UTF-8 TXT फ़ाइल आज़माएँ।',
      );
    } finally {
      input.value = '';
    }
  };

  /**
   * सभी पंक्तियों का वाचन पूरा होने पर स्थिति अपडेट करता है।
   */
  const finishReading = useCallback(() => {
    readingRef.current = false;
    setStatus('completed');
    setMessage('सभी पंक्तियों का वाचन पूरा हुआ।');

    if (videoRef.current) {
      videoRef.current.loop = false;
      videoRef.current.pause();
    }
  }, []);

  /**
   * एक पंक्ति पढ़ता है और उसके पूरा होने पर अगली पंक्ति शुरू करता है।
   * sessionId पुराने वाचन की घटनाओं को नए वाचन में हस्तक्षेप करने से रोकता है।
   */
  const speakLine = useCallback(
    (lineIndex: number, sessionId: number) => {
      if (
        sessionRef.current !== sessionId ||
        !readingRef.current
      ) {
        return;
      }

      const currentLines = linesRef.current;

      if (lineIndex >= currentLines.length) {
        finishReading();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(
        currentLines[lineIndex],
      );

      const voice = chooseVoice(
        language,
        voices,
        selectedVoiceURI,
      );

      utterance.rate = rate;
      utterance.lang = voice?.lang || language;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (sessionRef.current === sessionId) {
          setCurrentLineIndex(lineIndex);
        }
      };

      utterance.onend = () => {
        if (
          sessionRef.current !== sessionId ||
          !readingRef.current
        ) {
          return;
        }

        const nextIndex = lineIndex + 1;

        if (nextIndex < linesRef.current.length) {
          setCurrentLineIndex(nextIndex);

          // अगली पंक्ति तभी शुरू होती है जब वर्तमान पंक्ति पूरी हो जाती है।
          window.setTimeout(() => {
            speakLine(nextIndex, sessionId);
          }, 80);
        } else {
          finishReading();
        }
      };

      utterance.onerror = (event) => {
        if (
          sessionRef.current !== sessionId ||
          !readingRef.current
        ) {
          return;
        }

        readingRef.current = false;
        sessionRef.current += 1;

        setStatus('ready');
        setMessage(
          `वाचन रुक गया (${event.error || 'अज्ञात त्रुटि'})। उपलब्ध वाणी जाँचकर फिर प्रयास करें।`,
        );

        if (videoRef.current) {
          videoRef.current.loop = false;
          videoRef.current.pause();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('वाचन शुरू करने में त्रुटि:', error);

        readingRef.current = false;
        sessionRef.current += 1;
        setStatus('ready');
        setMessage('वाचन शुरू नहीं हो पाया। कृपया फिर प्रयास करें।');
      }
    },
    [
      finishReading,
      language,
      rate,
      selectedVoiceURI,
      voices,
    ],
  );

  /**
   * नया वाचन शुरू करता है।
   */
  const startReading = () => {
    if (!speechSupported) {
      setMessage(
        'इस ब्राउज़र में टेक्स्ट-टू-स्पीच उपलब्ध नहीं है। किसी आधुनिक ब्राउज़र में खोलें।',
      );
      return;
    }

    const preparedLines = splitTextIntoLines(text);

    if (preparedLines.length === 0) {
      setMessage(
        'पहले संस्कृत या हिंदी पाठ लिखें अथवा TXT फ़ाइल लोड करें।',
      );
      return;
    }

    sessionRef.current += 1;
    const sessionId = sessionRef.current;

    readingRef.current = false;
    window.speechSynthesis.cancel();

    linesRef.current = preparedLines;
    readingRef.current = true;

    setCurrentLineIndex(0);
    setStatus('reading');

    const chosenVoice = chooseVoice(
      language,
      voices,
      selectedVoiceURI,
    );

    if (
      language === 'sa-IN' &&
      chosenVoice &&
      !chosenVoice.lang.toLowerCase().startsWith('sa-')
    ) {
      setMessage(
        'अलग संस्कृत वाणी नहीं मिली। उपलब्ध वाणी से प्रयास होगा; शुद्ध वैदिक स्वर और उच्चारण की गारंटी नहीं है।',
      );
    } else {
      setMessage(
        'वाचन चल रहा है। अगली पंक्ति वर्तमान पंक्ति पूरी होने पर शुरू होगी।',
      );
    }

    const video = videoRef.current;

    if (video && videoUrl) {
      video.loop = true;

      void video.play().catch((error: unknown) => {
        console.warn('वीडियो अपने-आप नहीं चल पाया:', error);

        if (sessionRef.current === sessionId) {
          setMessage(
            'वाचन शुरू है। वीडियो चलाने के लिए वीडियो का प्ले बटन दबाएँ।',
          );
        }
      });
    }

    speakLine(0, sessionId);
  };

  const pauseReading = () => {
    if (!speechSupported || status !== 'reading') return;

    window.speechSynthesis.pause();
    setStatus('paused');
    setMessage(
      'वाचन रोका गया है। वीडियो चलता रह सकता है। जारी रखने के लिए बटन दबाएँ।',
    );
  };

  const resumeReading = () => {
    if (!speechSupported || status !== 'paused') return;

    window.speechSynthesis.resume();
    setStatus('reading');
    setMessage('वाचन फिर से जारी है।');
  };

  const stopReading = () => {
    readingRef.current = false;
    sessionRef.current += 1;

    if (speechSupported) {
      window.speechSynthesis.cancel();
    }

    setStatus('ready');
    setCurrentLineIndex(0);

    if (videoRef.current) {
      videoRef.current.loop = false;
      videoRef.current.pause();
    }

    setMessage('वाचन रोक दिया गया।');
  };

  const loadSample = () => {
    stopForContentChange();
    setText(SAMPLE_TEXT);
    setMessage(
      'उदाहरण पाठ भरा गया। वाचन शुरू करने के लिए बटन दबाएँ।',
    );
  };

  const clearText = () => {
    stopForContentChange();
    setText('');
    setMessage('पाठ साफ़ कर दिया गया।');
  };

  const removeVideo = () => {
    stopForContentChange();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setVideoUrl('');
    setVideoName('');
    setMessage('वीडियो हटा दिया गया।');
  };

  const progress =
    lines.length > 0 && status !== 'ready'
      ? Math.min(
          currentLineIndex + (status === 'completed' ? 1 : 0),
          lines.length,
        )
      : 0;

  const displayedProgress =
    lines.length === 0
      ? 0
      : status === 'completed'
        ? lines.length
        : status === 'ready'
          ? 0
          : Math.min(currentLineIndex + 1, lines.length);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            श्रु
          </div>

          <div>
            <p className="eyebrow">वैदिक वीडियो वाचन स्टूडियो</p>
            <h1>श्रुति</h1>
          </div>
        </div>

        <div className="header-status">
          <span
            className={`status-dot status-dot--${status}`}
            aria-hidden="true"
          />

          <span>
            {status === 'reading'
              ? 'वाचन जारी'
              : status === 'paused'
                ? 'वाचन रुका'
                : status === 'completed'
                  ? 'वाचन पूरा'
                  : 'तैयार'}
          </span>
        </div>
      </header>

      <section className="welcome-strip" aria-label="ऐप का परिचय">
        <div>
          <p className="eyebrow">स्थानीय रूप से काम करें</p>
          <h2>पाठ को सुनें, पंक्ति-दर-पंक्ति</h2>
          <p>
            अपना वीडियो और पाठ जोड़ें। वाचन ब्राउज़र की उपलब्ध
            वाणी का उपयोग करता है; बाहरी वाचन API की आवश्यकता
            नहीं है।
          </p>
        </div>

        <div className="welcome-symbol" aria-hidden="true">
          ॐ
        </div>
      </section>

      <section className="studio-layout">
        <div className="panel video-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">01 / दृश्य</p>
              <h2>वीडियो स्टूडियो</h2>
            </div>

            <span className="mini-tag">9:16 पोर्ट्रेट</span>
          </div>

          <div
            className={`video-frame${videoUrl ? ' video-frame--loaded' : ''}`}
          >
            {videoUrl ? (
              <video
                ref={videoRef}
                className="studio-video"
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                muted={isVideoMuted}
                loop={status === 'reading' || status === 'paused'}
                aria-label="अपलोड किया गया वीडियो"
                onError={() => {
                  setMessage(
                    'वीडियो चल नहीं पाया। फ़ाइल का फ़ॉर्मेट जाँचकर दूसरी वीडियो चुनें।',
                  );
                }}
              />
            ) : (
              <div className="video-empty-state">
                <div className="video-empty-icon" aria-hidden="true">
                  ▶
                </div>

                <strong>आपका वीडियो यहाँ दिखाई देगा</strong>

                <span>
                  MP4, WebM या ब्राउज़र द्वारा समर्थित वीडियो चुनें
                </span>
              </div>
            )}
          </div>

          <div className="video-actions">
            <label className="button button--primary file-pick-button">
              <span aria-hidden="true">＋</span>
              वीडियो चुनें

              <input
                className="visually-hidden-input"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
              />
            </label>

            <button
              className="button button--secondary"
              type="button"
              onClick={() => setIsVideoMuted((muted) => !muted)}
              aria-pressed={!isVideoMuted}
              disabled={!videoUrl}
            >
              {isVideoMuted
                ? 'वीडियो आवाज़ चालू करें'
                : 'वीडियो म्यूट करें'}
            </button>

            {videoUrl && (
              <button
                className="button button--secondary"
                type="button"
                onClick={removeVideo}
              >
                वीडियो हटाएँ
              </button>
            )}
          </div>

          <p className="file-meta">
            {videoName || 'अभी कोई वीडियो नहीं चुना गया'}
            {videoUrl
              ? ' · वाचन के दौरान वीडियो दोहराया जा सकता है'
              : ''}
          </p>
        </div>

        <div className="panel text-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 / पाठ</p>
              <h2>वाचन-पाठ</h2>
            </div>

            <span className="mini-tag">संस्कृत · हिंदी</span>
          </div>

          <label className="field-label" htmlFor="reading-text">
            अपना पाठ लिखें या पेस्ट करें
          </label>

          <textarea
            id="reading-text"
            className="reading-textarea"
            value={text}
            onChange={handleTextChange}
            placeholder={
              'यहाँ संस्कृत या हिंदी पाठ लिखें…\nहर नई पंक्ति अलग वाचन इकाई होगी।'
            }
            spellCheck={false}
            rows={9}
          />

          <div className="text-tools">
            <label className="button button--secondary file-pick-button">
              TXT फ़ाइल जोड़ें

              <input
                className="visually-hidden-input"
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleTextFileUpload}
              />
            </label>

            <button
              className="text-button"
              type="button"
              onClick={loadSample}
            >
              उदाहरण भरें
            </button>

            <button
              className="text-button"
              type="button"
              onClick={clearText}
            >
              पाठ साफ़ करें
            </button>
          </div>

          <div className="settings-grid">
            <div className="setting-control">
              <label
                className="field-label"
                htmlFor="speech-language"
              >
                वाचन भाषा
              </label>

              <select
                id="speech-language"
                className="select-control"
                value={language}
                onChange={(event) => {
                  setLanguage(
                    event.target.value as SpeechLanguage,
                  );
                  setSelectedVoiceURI('');
                }}
                disabled={
                  status === 'reading' || status === 'paused'
                }
              >
                <option value="hi-IN">हिंदी</option>
                <option value="sa-IN">
                  संस्कृत (यदि उपलब्ध हो)
                </option>
              </select>
            </div>

            <div className="setting-control">
              <label
                className="field-label"
                htmlFor="speech-voice"
              >
                उपलब्ध ब्राउज़र वाणी
              </label>

              <select
                id="speech-voice"
                className="select-control"
                value={selectedVoiceURI}
                onChange={(event) =>
                  setSelectedVoiceURI(event.target.value)
                }
                disabled={
                  status === 'reading' || status === 'paused'
                }
              >
                <option value="">स्वचालित चयन</option>

                {voices.map((voice) => (
                  <option
                    key={voice.voiceURI}
                    value={voice.voiceURI}
                  >
                    {voice.name} ({voice.lang})
                    {voice.default ? ' · डिफ़ॉल्ट' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rate-control">
            <div className="rate-label-row">
              <label
                className="field-label"
                htmlFor="speech-rate"
              >
                वाचन गति
              </label>

              <output htmlFor="speech-rate">
                {rate.toFixed(2)}×
              </output>
            </div>

            <input
              id="speech-rate"
              className="range-control"
              type="range"
              min="0.6"
              max="1.2"
              step="0.05"
              value={rate}
              onChange={(event) =>
                setRate(Number(event.target.value))
              }
              disabled={
                status === 'reading' || status === 'paused'
              }
            />

            <div className="range-ends">
              <span>धीमा</span>
              <span>तेज़</span>
            </div>
          </div>

          <div className="reading-controls">
            {status === 'reading' ? (
              <button
                className="button button--primary"
                type="button"
                onClick={pauseReading}
              >
                वाचन रोकें
              </button>
            ) : status === 'paused' ? (
              <button
                className="button button--primary"
                type="button"
                onClick={resumeReading}
              >
                वाचन जारी रखें
              </button>
            ) : (
              <button
                className="button button--primary"
                type="button"
                onClick={startReading}
                disabled={!speechSupported}
              >
                {status === 'completed'
                  ? 'फिर से वाचन शुरू करें'
                  : 'वाचन शुरू करें'}
              </button>
            )}

            <button
              className="button button--secondary"
              type="button"
              onClick={stopReading}
              disabled={status === 'ready'}
            >
              वाचन बंद करें
            </button>
          </div>

          {!speechSupported && (
            <p className="inline-warning">
              इस ब्राउज़र में वाणी सुविधा उपलब्ध नहीं है।
            </p>
          )}
        </div>
      </section>

      <section
        className="panel progress-panel"
        aria-labelledby="progress-heading"
      >
        <div className="panel-heading progress-heading-row">
          <div>
            <p className="eyebrow">03 / प्रगति</p>
            <h2 id="progress-heading">
              पंक्ति-दर-पंक्ति वाचन
            </h2>
          </div>

          <span className="progress-count">
            {displayedProgress} / {lines.length} पंक्तियाँ
          </span>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="वाचन प्रगति"
          aria-valuemin={0}
          aria-valuemax={lines.length || 1}
          aria-valuenow={progress}
        >
          <div
            className="progress-fill"
            style={{
              width: `${
                lines.length
                  ? (progress / lines.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        {lines.length > 0 ? (
          <ol className="line-list">
            {lines.map((line, index) => {
              const isCurrent =
                index === currentLineIndex &&
                (status === 'reading' || status === 'paused');

              const isDone =
                status === 'completed' ||
                (status !== 'ready' &&
                  index < currentLineIndex);

              return (
                <li
                  className={`line-item${
                    isCurrent ? ' line-item--current' : ''
                  }${isDone ? ' line-item--done' : ''}`}
                  key={`${index}-${line}`}
                >
                  <span className="line-number">
                    {isDone
                      ? '✓'
                      : String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="line-content">{line}</span>

                  <span className="line-state">
                    {isCurrent
                      ? status === 'paused'
                        ? 'रुका हुआ'
                        : 'अब पढ़ा जा रहा है'
                      : isDone
                        ? 'पूरा'
                        : 'प्रतीक्षा में'}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty-lines-state">
            पाठ जोड़ते ही यहाँ आपकी वाचन-पंक्तियाँ दिखाई देंगी।
          </div>
        )}
      </section>

      <footer className="app-footer">
        <div
          className="message-indicator"
          aria-live="polite"
          role="status"
        >
          {message}
        </div>

        <p>
          पाठ आपके डिवाइस पर रहता है। उच्चारण और उपलब्ध
          वाणियाँ ब्राउज़र तथा डिवाइस के अनुसार बदल सकती हैं।
        </p>
      </footer>
    </main>
  );
}
