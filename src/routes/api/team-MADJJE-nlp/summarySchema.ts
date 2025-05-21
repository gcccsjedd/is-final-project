import { z } from 'zod';

// Define the input schema using Zod
export const summarizeInputSchema = z.object({
  text: z.string()
    .min(10, { message: "Text must be at least 10 characters long" })
    .max(50000, { message: "Text cannot exceed 50,000 characters" })
});

// Infer the type from the schema
export type SummarizeInput = z.infer<typeof summarizeInputSchema>;

// Define the output schema
export const summarizeOutputSchema = z.object({
  summary: z.array(z.string()),
  mainIdea: z.string(),
  originalLength: z.number(),
  summaryLength: z.number(),
  model: z.string()
});

// Infer the output type
export type SummarizeOutput = z.infer<typeof summarizeOutputSchema>;

/**
 * Validates the input against the schema
 * @param data The input data to validate
 * @returns A validation result object
 */
export function validateSummarizeInput(data: unknown): {
  valid: boolean;
  data: SummarizeInput | null;
  errors: string | null;
} {
  try {
    const validData = summarizeInputSchema.parse(data);
    return {
      valid: true,
      data: validData,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        valid: false,
        data: null,
        errors: errorMessages
      };
    }
    
    return {
      valid: false,
      data: null,
      errors: 'Unknown validation error'
    };
  }
}

// Create an error response
export function createErrorResponse(error: string, details?: string): {
  error: string;
  details?: string;
} {
  return {
    error,
    ...(details && { details })
  };
}