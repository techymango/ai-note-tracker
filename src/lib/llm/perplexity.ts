import type { Settings } from '../../types';
import { JSON_FIX_PROMPT, ANALYSIS_PROMPTS } from './prompts';
import type { AIMode } from '../../types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface PerplexityOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: object;
    disable_search?: boolean;
}

export async function callPerplexity(
    messages: PerplexityMessage[],
    settings: Settings,
    options: PerplexityOptions = {}
): Promise<string> {
    const apiKey = settings.apiKey || import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
        throw new Error('Perplexity API Key is missing. Please add it in Settings.');
    }

    const payload = {
        model: settings.model || 'sonar-pro',
        messages,
        temperature: options.temperature ?? 0.2,
        top_p: 0.9,
        stream: false,
        // Only include response_format if explicitly provided and valid
        ...(options.response_format ? { response_format: options.response_format } : {}),
        // Perplexity specific: disable_search for connect flow
        ...(options.disable_search !== undefined ? { return_citations: false, search_domain_filter: ['-'] } : {}),
        // Note: 'disable_search' param might slightly vary by provider version, 
        // but PRD says "Set disable_search: true". 
        // However, the official Perplexity API param is `return_citations` or `search_domain_filter` sometimes, 
        // but let's stick to the user's PRD requirement of key "disable_search" if the API supports it,
        // or simulate it. 
        // The user said: "Set disable_search: true ... use this request structure ... disable_search: false".
        // So I will send strictly "disable_search" as a key.
        disable_search: options.disable_search ?? false,
    };

    try {
        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    } catch (error: any) {
        console.error('Perplexity Call Failed:', error);
        throw error;
    }
}

export async function callPerplexityJSON<T>(
    messages: PerplexityMessage[],
    settings: Settings,
    attempt = 1
): Promise<T> {
    // First attempt
    try {
        // Remove unsupported response_format: { type: 'json_object' } causing 400 error.
        // Rely on strict system prompt for JSON output.
        const content = await callPerplexity(messages, settings, {
            disable_search: true
        });
        return JSON.parse(content) as T;
    } catch (error) {
        if (attempt === 1) {
            console.warn('JSON Parse failed, retrying with correction prompt...');

            const fixedMessages = [
                ...messages,
                { role: 'user', content: JSON_FIX_PROMPT }
            ] as PerplexityMessage[];

            // Retry without response_format
            const content = await callPerplexity(fixedMessages, settings, {
                disable_search: true
            });
            return JSON.parse(content) as T;
        }
        throw error;
    }
}

export async function generateTitle(content: string, settings: Settings): Promise<string> {
    if (!content || content.length < 10) return "Untitled";

    const messages: PerplexityMessage[] = [
        { role: 'system', content: 'You are a precise summarizer. Generate a title for the provided text. MAXIMUM 2 words. Return ONLY the title text. No quotes. No preamble.' },
        { role: 'user', content }
    ];

    try {
        const title = await callPerplexity(messages, settings, {
            temperature: 0.1, // Deterministic
            disable_search: true
        });
        const cleanTitle = title.replace(/['"]/g, '').trim();
        const words = cleanTitle.split(/\s+/).slice(0, 2).join(' ');
        return words.length > 20 ? words.slice(0, 20) : words;
    } catch (e) {
        console.error("Title generation failed", e);
        return "Untitled";
    }
}

export async function runAnalysis(
    notesContent: string,
    mode: AIMode,
    settings: Settings
): Promise<string> {
    const systemPrompt = ANALYSIS_PROMPTS[mode];

    const messages: PerplexityMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: notesContent }
    ];

    try {
        return await callPerplexity(messages, settings, {
            temperature: 0.3,
            disable_search: true
        });
    } catch (e) {
        console.error("Analysis failed", e);
        throw e;
    }
}
