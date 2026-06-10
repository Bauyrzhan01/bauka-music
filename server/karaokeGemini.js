const fs = require('fs');
const path = require('path');
const { MUSIC_DIR, AUDIO_EXT } = require('../scripts/scan-music');
const { parseLyricsLines } = require('../utils/autoLyricsTimings.cjs');
const { normalizeLyricsTimings } = require('../utils/normalizeLyricsTimings.cjs');
const { parseModelJson } = require('../utils/parseModelJson.cjs');
const { updateTrackMeta } = require('./musicCatalog');
const { getTrackDurationSec } = require('./karaokeAuto');

const MAX_INLINE_BYTES = 18 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 180000;
const DEFAULT_MODEL = 'gemini-2.5-flash';

/** Модели с отдельной квотой free tier (пробуются по очереди при 429/quota). */
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

const MIME_BY_EXT = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ''
  );
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getModelsToTry() {
  const primary = getGeminiModel();
  const list = [primary];
  FALLBACK_MODELS.forEach((model) => {
    if (!list.includes(model)) {
      list.push(model);
    }
  });
  return list;
}

function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

function getGeminiConfig() {
  return {
    configured: isGeminiConfigured(),
    model: getGeminiModel(),
    fallbackModels: FALLBACK_MODELS.filter((m) => m !== getGeminiModel()),
  };
}

function readTrackAudio(filename) {
  const safeName = path.basename(filename);
  const ext = path.extname(safeName).toLowerCase();
  if (!AUDIO_EXT.has(ext)) {
    throw new Error('Неверный аудиофайл');
  }

  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    throw new Error('Формат не поддерживается для ИИ');
  }

  const filePath = path.join(MUSIC_DIR, safeName);
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_INLINE_BYTES) {
    throw new Error(
      'Файл слишком большой для Gemini (макс. ~18 МБ). Сожмите MP3 или разбейте трек.'
    );
  }

  const data = fs.readFileSync(filePath);
  return {
    safeName,
    mimeType,
    base64: data.toString('base64'),
    sizeMb: stat.size / (1024 * 1024),
  };
}

function buildKaraokePrompt(lines, durationSec) {
  const numbered = lines
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n');

  return `You are a professional karaoke timing engineer. Listen to the attached audio.

Lyric lines (exactly ${lines.length} lines, in performance order):
${numbered}

Track duration: about ${Math.round(durationSec)} seconds.

For each line, determine the second when the vocalist STARTS singing that line (not when the line ends).

Requirements:
- Return exactly ${lines.length} numbers in lyricsTimings
- Values in seconds, >= 0, non-decreasing
- Align to what you HEAR in the audio, not text length guesses
- Account for instrumental intro before line 1
- Last line start must be before track end

Output ONLY valid JSON:
{"lyricsTimings":[0.0,12.34,...]}`;
}

function parseRetrySeconds(message) {
  const match = String(message).match(/retry in ([\d.]+)s/i);
  return match ? Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 500, 60000) : 0;
}

function isQuotaOrRateError(status, message) {
  return (
    status === 429 ||
    /quota|rate.?limit|resource_exhausted|free_tier|limit:\s*0/i.test(message)
  );
}

function formatQuotaHelp(model) {
  return (
    `Квота Gemini исчерпана для модели «${model}» (бесплатный тариф).\n` +
    'Что сделать:\n' +
    '1) В .env укажите GEMINI_MODEL=gemini-2.5-flash-lite и перезапустите npm start\n' +
    '2) Подождите сутки — лимиты обновляются\n' +
    '3) Включите биллинг: https://ai.google.dev/gemini-api/docs/rate-limits\n' +
    '4) Пока используйте «Автосинхронизация» (без API)'
  );
}

function formatGeminiError(status, bodyText, model) {
  let message = '';
  try {
    const data = JSON.parse(bodyText);
    message = data.error?.message || data.message || '';
  } catch {
    message = bodyText?.slice(0, 500) || '';
  }

  if (message && /API key/i.test(message)) {
    return 'Неверный GEMINI_API_KEY. Проверьте ключ в .env и перезапустите npm start';
  }

  if (isQuotaOrRateError(status, message)) {
    const retryMs = parseRetrySeconds(message);
    if (retryMs > 0 && retryMs < 120000 && !/limit:\s*0/i.test(message)) {
      return `Лимит запросов (${model}). Повтор через ~${Math.ceil(retryMs / 1000)} с`;
    }
    return formatQuotaHelp(model);
  }

  if (message) {
    return message;
  }

  return `Gemini API ошибка (${status})`;
}

async function callGeminiModel(model, audioBase64, mimeType, prompt) {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.15,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });

  const text = await response.text();
  if (!response.ok) {
    const err = new Error(formatGeminiError(response.status, text, model));
    err.status = response.status;
    err.isQuota = isQuotaOrRateError(response.status, text);
    err.retryMs = parseRetrySeconds(text);
    throw err;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Некорректный ответ Gemini');
  }

  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini заблокировал запрос: ${blockReason}`);
  }

  const parts = data.candidates?.[0]?.content?.parts;
  const replyText = parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('');

  if (!replyText) {
    const finish = data.candidates?.[0]?.finishReason;
    throw new Error(
      finish
        ? `Gemini не вернул текст (${finish})`
        : 'Gemini не вернул результат'
    );
  }

  return replyText;
}

async function callGemini(audioBase64, mimeType, prompt) {
  if (!getGeminiApiKey()) {
    throw new Error(
      'Добавьте GEMINI_API_KEY в файл .env в корне проекта и перезапустите npm start'
    );
  }

  const models = getModelsToTry();
  const failures = [];

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];

    try {
      const replyText = await callGeminiModel(
        model,
        audioBase64,
        mimeType,
        prompt
      );
      return { replyText, modelUsed: model };
    } catch (error) {
      failures.push({ model, message: error.message });

      if (error.isQuota && error.retryMs > 0 && error.retryMs < 90000) {
        await sleep(error.retryMs);
        try {
          const replyText = await callGeminiModel(
            model,
            audioBase64,
            mimeType,
            prompt
          );
          return { replyText, modelUsed: model };
        } catch (retryErr) {
          failures.push({ model: `${model} (retry)`, message: retryErr.message });
        }
      }

      const hasMore = i < models.length - 1;
      if (error.isQuota && hasMore) {
        continue;
      }

      if (!hasMore) {
        break;
      }
    }
  }

  const tried = failures.map((f) => f.model).join(', ');
  throw new Error(
    `${formatQuotaHelp(getGeminiModel())}\n\nПробовали модели: ${tried}`
  );
}

function extractTimingsFromModel(text, lineCount, durationSec) {
  const parsed = parseModelJson(text);
  const raw =
    parsed.lyricsTimings ?? parsed.timings ?? parsed.times ?? parsed;

  return normalizeLyricsTimings(raw, lineCount, durationSec);
}

async function aiSyncKaraoke(filename, description, options = {}) {
  const lines = parseLyricsLines(description);
  if (!lines.length) {
    throw new Error('Добавьте текст песни (каждая строка с новой строки)');
  }

  const durationSec = await getTrackDurationSec(filename);
  const { mimeType, base64 } = readTrackAudio(filename);
  const prompt = buildKaraokePrompt(lines, durationSec);

  const { replyText, modelUsed } = await callGemini(base64, mimeType, prompt);
  const lyricsTimings = extractTimingsFromModel(
    replyText,
    lines.length,
    durationSec
  );

  let saved = false;
  if (options.save) {
    await updateTrackMeta(filename, { description, lyricsTimings });
    saved = true;
  }

  return {
    source: 'gemini',
    model: modelUsed,
    lines: lines.length,
    durationSec: Math.round(durationSec * 100) / 100,
    lyricsTimings,
    saved,
  };
}

module.exports = {
  aiSyncKaraoke,
  isGeminiConfigured,
  getGeminiConfig,
};
