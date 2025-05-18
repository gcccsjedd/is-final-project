import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { HfInference } from '@huggingface/inference';
import { HUGGINGFACE_TOKEN } from '$env/static/private';

const hf = new HfInference(HUGGINGFACE_TOKEN);

interface TranslationRequest {
    text: string;
    model?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { text, model = "Helsinki-NLP/opus-mt-en-es", sourceLanguage, targetLanguage } = 
            await request.json() as TranslationRequest;

        if (!text) {
            return json({ error: 'Text is required' }, { status: 400 });
        }

        const result = await hf.translation({
            model,
            inputs: text,
            parameters: {
                src_lang: sourceLanguage,
                tgt_lang: targetLanguage,
            }
        });

        return json({
            original: text,
            translation: result.translation_text || result,
            model
        });
    } catch (error) {
        console.error('Error processing translation request:', error);
        return json({ 
            error: 'Translation service error', 
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } 
};