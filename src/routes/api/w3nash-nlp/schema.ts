import { z } from 'zod';

// Input schema validation
export const nlpRequestSchema = z.object({
  text: z.string().min(1, "Text input is required").max(5000, "Text exceeds maximum length"),
  operation: z.enum(['summarize', 'analyze-sentiment', 'extract-entities', 'generate-keywords']),
  options: z.object({
    maxLength: z.number().optional(),
    format: z.enum(['json', 'text']).optional().default('json'),
    detailLevel: z.enum(['basic', 'detailed']).optional().default('basic')
  }).optional().default({})
});

// Define the response schema types
export const summarizeResponseSchema = z.object({
  summary: z.string(),
  originalLength: z.number(),
  summaryLength: z.number()
});

export const sentimentResponseSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  analysis: z.string().optional()
});

export const entitiesResponseSchema = z.object({
  entities: z.array(z.object({
    text: z.string(),
    type: z.enum(['person', 'organization', 'location', 'date', 'other']),
    confidence: z.number().min(0).max(1).optional()
  }))
});

export const keywordsResponseSchema = z.object({
  keywords: z.array(z.object({
    text: z.string(),
    relevance: z.number().min(0).max(1)
  }))
});

// Input type inferred from schema
export type NlpRequest = z.infer<typeof nlpRequestSchema>;

// Response types inferred from schemas
export type SummarizeResponse = z.infer<typeof summarizeResponseSchema>;
export type SentimentResponse = z.infer<typeof sentimentResponseSchema>;
export type EntitiesResponse = z.infer<typeof entitiesResponseSchema>;
export type KeywordsResponse = z.infer<typeof keywordsResponseSchema>;

// Union type for all possible responses
export type NlpResponse = 
  | SummarizeResponse
  | SentimentResponse
  | EntitiesResponse
  | KeywordsResponse;
