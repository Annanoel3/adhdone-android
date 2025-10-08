(function (global) {
  "use strict";

  /**
   * ADHDone AI Personalization Helper
   * ---------------------------------
   * This script provides a lightweight client-side orchestrator that the
   * embedded ADHDone web experience can use to:
   *  1. Track reminder interactions and surface adaptive suggestions when a
   *     user skips a task multiple times in a row.
   *  2. Organize "brain dump" entries into actionable groupings using
   *     heuristics or OpenAI (when an API key is supplied).
   *
   * Nothing in this file automatically injects UI – instead, it exposes an API
   * via `window.AdhdoneAI` so the web app can render surfaced insights in a
   * manner that fits the product experience.
   */

  const STORAGE_VERSION = "v1";
  const STORAGE_KEY = `adhdone-ai-state-${STORAGE_VERSION}`;
  const API_KEY_STORAGE = "adhdone-openai-api-key";
  const DEFAULT_MODEL = "gpt-4o-mini";
  const DEFAULT_SYSTEM_PROMPT =
    "You are ADHDone, a compassionate ADHD assistant. Provide structured, " +
    "clear and neurodivergent-friendly guidance with short sentences, " +
    "bullet lists, and optional checkboxes.";

  /**
   * Safely parse JSON values. Returns fallback on error.
   */
  function safeParse(json, fallback) {
    if (!json || typeof json !== "string") {
      return fallback;
    }
    try {
      return JSON.parse(json);
    } catch (_err) {
      return fallback;
    }
  }

  /**
   * Persist a value to localStorage if available. We guard each call so the
   * script also works in restricted contexts (e.g., if localStorage is
   * disabled inside a WKWebView / WebView profile).
   */
  function saveToStorage(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (_err) {
      // Swallow – persistence is a best-effort optimisation.
    }
  }

  function getFromStorage(key, fallback) {
    try {
      if (global.localStorage) {
        return safeParse(global.localStorage.getItem(key), fallback);
      }
    } catch (_err) {
      // ignore and fall through to fallback
    }
    return fallback;
  }

  function getApiKey() {
    try {
      if (global.localStorage) {
        return global.localStorage.getItem(API_KEY_STORAGE) || "";
      }
    } catch (_err) {
      // ignore
    }
    return "";
  }

  function setApiKey(key) {
    try {
      if (global.localStorage) {
        if (!key) {
          global.localStorage.removeItem(API_KEY_STORAGE);
        } else {
          global.localStorage.setItem(API_KEY_STORAGE, key);
        }
      }
    } catch (_err) {
      // ignore – callers can decide whether to surface an error to users.
    }
  }

  const state = Object.assign(
    {
      tasks: {},
      lastSuggestion: {},
      brainDumpHistory: [],
    },
    getFromStorage(STORAGE_KEY, {})
  );

  function persistState() {
    saveToStorage(STORAGE_KEY, state);
  }

  function getTaskState(taskId) {
    const existing = state.tasks[taskId];
    if (existing) {
      return existing;
    }
    const created = {
      history: [],
      consecutiveSkips: 0,
      lastSuggestionTimestamp: 0,
    };
    state.tasks[taskId] = created;
    return created;
  }

  function trackHistory(taskState, entry) {
    const MAX_HISTORY = 50;
    taskState.history.push(entry);
    if (taskState.history.length > MAX_HISTORY) {
      taskState.history.splice(0, taskState.history.length - MAX_HISTORY);
    }
  }

  function buildReminderSummary(taskId, taskState, context) {
    const lastEntries = taskState.history.slice(-5);
    return {
      taskId,
      consecutiveSkips: taskState.consecutiveSkips,
      recentInteractions: lastEntries,
      context: context || {},
    };
  }

  async function callOpenAI({
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.6,
    maxOutputTokens = 600,
    signal,
  }) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("Missing OpenAI API key");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_output_tokens: maxOutputTokens,
        input: messages,
      }),
      signal,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message =
        errorPayload?.error?.message ||
        `OpenAI request failed with status ${response.status}`;
      throw new Error(message);
    }

    const payload = await response.json();
    const text = payload?.output?.[0]?.content?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("OpenAI returned an unexpected response format");
    }
    return text.trim();
  }

  function fallbackReminderSuggestion(summary) {
    const suggestion = {
      taskId: summary.taskId,
      reason: "consecutive-skips",
      message: `You've skipped this task ${summary.consecutiveSkips} times. ` +
        "Try choosing a smaller first step and consider shortening the reminder interval.",
      recommendedAdjustments: {
        suggestedStartStep:
          summary.context?.baselineStep ||
          "Set a 2-minute timer and only prep the very first thing.",
        reminderIntervalMinutes: Math.max(
          15,
          Math.round((summary.context?.reminderIntervalMinutes || 45) * 0.5)
        ),
      },
    };
    return suggestion;
  }

  async function generateReminderAdjustments(summary, options = {}) {
    if (!global.fetch || options.forceFallback) {
      return fallbackReminderSuggestion(summary);
    }

    const userPrompt =
      `Task context: ${summary.context?.description || "(no description)"}\n` +
      `Original reminder interval (minutes): ${
        summary.context?.reminderIntervalMinutes ?? "unknown"
      }\n` +
      `Consecutive skips: ${summary.consecutiveSkips}\n` +
      `Recent interactions: ${summary.recentInteractions
        .map((entry) => `${entry.action} @ ${entry.timestamp}`)
        .join(", "
      )}\n\n` +
      "Suggest a single easy starting step and a new reminder interval. " +
      "Return JSON with keys: message, suggestedStartStep, reminderIntervalMinutes.";

    try {
      const text = await callOpenAI({
        messages: [
          {
            role: "system",
            content: DEFAULT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.4,
        maxOutputTokens: 500,
      });

      const parsed = safeParse(text, null);
      if (!parsed) {
        return Object.assign(fallbackReminderSuggestion(summary), {
          rawResponse: text,
        });
      }
      return {
        taskId: summary.taskId,
        reason: "consecutive-skips",
        message:
          parsed.message ||
          "Let's tweak this reminder with something gentler and more specific.",
        recommendedAdjustments: {
          suggestedStartStep: parsed.suggestedStartStep,
          reminderIntervalMinutes: parsed.reminderIntervalMinutes,
        },
        rawResponse: parsed,
      };
    } catch (error) {
      return Object.assign(fallbackReminderSuggestion(summary), {
        error: error.message,
      });
    }
  }

  function shouldThrottleSuggestion(taskState, nowMs) {
    const ONE_HOUR = 60 * 60 * 1000;
    return nowMs - taskState.lastSuggestionTimestamp < ONE_HOUR;
  }

  async function recordReminderInteraction({
    taskId,
    action,
    timestamp = new Date().toISOString(),
    context = {},
    onSuggestion,
    forceFallback,
  }) {
    if (!taskId || !action) {
      throw new Error("recordReminderInteraction requires a taskId and action");
    }

    const taskState = getTaskState(taskId);
    const actionEntry = {
      action,
      timestamp,
      context,
    };

    if (action === "skip") {
      taskState.consecutiveSkips += 1;
    } else if (action === "complete" || action === "snooze") {
      taskState.consecutiveSkips = 0;
    }

    trackHistory(taskState, actionEntry);
    persistState();

    const summary = buildReminderSummary(taskId, taskState, context);
    const nowMs = Date.now();

    if (taskState.consecutiveSkips >= 3 && !shouldThrottleSuggestion(taskState, nowMs)) {
      const suggestion = await generateReminderAdjustments(summary, {
        forceFallback,
      });
      state.lastSuggestion[taskId] = suggestion;
      taskState.lastSuggestionTimestamp = nowMs;
      persistState();
      if (typeof onSuggestion === "function") {
        onSuggestion(suggestion);
      }
      return suggestion;
    }

    return null;
  }

  function getLastSuggestion(taskId) {
    return state.lastSuggestion?.[taskId] || null;
  }

  function resetTaskHistory(taskId) {
    if (!taskId) return;
    delete state.tasks[taskId];
    delete state.lastSuggestion?.[taskId];
    persistState();
  }

  function fallbackBrainDump(items) {
    const output = {
      categories: {},
      focusRecommendation: "Choose one quick win task that takes under 5 minutes.",
      summary: "",
      rawResponse: null,
    };

    const focusBuckets = [
      { label: "2-minute Wins", matcher: /call|email|text|pay|tidy/i },
      { label: "Prep & Planning", matcher: /plan|prepare|research|outline/i },
      { label: "Deep Work", matcher: /write|design|build|develop|analyze/i },
      { label: "Personal Care", matcher: /cook|exercise|meditate|laundry|clean|rest|self/i },
    ];

    items.forEach((item) => {
      const text = String(item || "").trim();
      if (!text) {
        return;
      }
      const bucket = focusBuckets.find((candidate) => candidate.matcher.test(text));
      const label = bucket ? bucket.label : "Miscellaneous";
      if (!output.categories[label]) {
        output.categories[label] = [];
      }
      output.categories[label].push(text);
    });

    const mostPopulated = Object.entries(output.categories).sort(
      (a, b) => b[1].length - a[1].length
    )[0];
    if (mostPopulated) {
      output.focusRecommendation = `Start with one item from "${mostPopulated[0]}" today.`;
    }
    output.summary = `Organized ${items.length} items into ${
      Object.keys(output.categories).length || 1
    } categories.`;
    return output;
  }

  async function organizeBrainDump(items, options = {}) {
    const normalizedItems = Array.isArray(items) ? items : [];
    state.brainDumpHistory.push({
      items: normalizedItems,
      timestamp: new Date().toISOString(),
    });
    persistState();

    if (!global.fetch || options.forceFallback) {
      return fallbackBrainDump(normalizedItems);
    }

    const prompt =
      "Organize the following brain dump entries into helpful groups for an ADHD user. " +
      "Return JSON with keys: categories (object of array), focusRecommendation, summary." +
      " Keep tone supportive and concrete. Items: " +
      normalizedItems.map((item) => `\n- ${item}`).join("");

    try {
      const text = await callOpenAI({
        messages: [
          {
            role: "system",
            content: DEFAULT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxOutputTokens: 800,
      });
      const parsed = safeParse(text, null);
      if (!parsed) {
        const fallback = fallbackBrainDump(normalizedItems);
        fallback.rawResponse = text;
        return fallback;
      }
      parsed.rawResponse = parsed.rawResponse || text;
      return parsed;
    } catch (error) {
      const fallback = fallbackBrainDump(normalizedItems);
      fallback.error = error.message;
      return fallback;
    }
  }

  const api = {
    setApiKey,
    getApiKey,
    recordReminderInteraction,
    getLastSuggestion,
    resetTaskHistory,
    organizeBrainDump,
    getState() {
      return JSON.parse(JSON.stringify(state));
    },
    /**
     * Expose the raw OpenAI wrapper in case the web experience needs to craft
     * bespoke prompts beyond the built-in helpers.
     */
    async requestOpenAI(options) {
      return callOpenAI(options);
    },
  };

  Object.defineProperty(api, "DEFAULT_SYSTEM_PROMPT", {
    enumerable: true,
    value: DEFAULT_SYSTEM_PROMPT,
  });

  global.AdhdoneAI = Object.freeze(api);
})(typeof window !== "undefined" ? window : this);
