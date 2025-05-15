// src/lib/schemas/schema.ts
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Agent (Summarizer) Types
export interface SummaryRequest {
    text: string;
}

export interface SummaryResponse {
    summary: string;
}

// Sample API Types
export interface SampleResponse {
    message: string;
    timestamp: string;
    endpoints: ApiEndpoint[];
    note: string;
}

export interface ApiEndpoint {
    path: string;
    method: string;
    description: string;
    example_request: object;
    example_response: object;
}

// Environment Variables Type
export interface AppConfig {
    OPENROUTER_API_KEY?: string;
    OPENROUTER_REFERER?: string;
    OPENROUTER_SITE_NAME?: string;
}