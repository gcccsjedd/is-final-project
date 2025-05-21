import schema from './schema.json';

interface NlpRequest {
  text: string;
  task: 'sentiment' | 'summarize' | 'classify' | 'detect-language' | 'extract-keywords';
  options?: {
    maxLength?: number;
    minLength?: number;
    categories?: string[];
    keywordCount?: number;
  };
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateNlpRequest(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid request format' };
  }
  
  const requestData = data as Partial<NlpRequest>;

  if (!requestData.text || typeof requestData.text !== 'string') {
    return { isValid: false, error: 'Text is required and must be a string' };
  }

  if (requestData.text.length < schema.properties.text.minLength || 
      requestData.text.length > schema.properties.text.maxLength) {
    return { 
      isValid: false, 
      error: `Text must be between ${schema.properties.text.minLength} and ${schema.properties.text.maxLength} characters` 
    };
  }

  if (!requestData.task || !schema.properties.task.enum.includes(requestData.task)) {
    return { 
      isValid: false, 
      error: `Task must be one of: ${schema.properties.task.enum.join(', ')}` 
    };
  }

  if (requestData.options) {
    if (requestData.task === 'summarize') {
      const { maxLength, minLength } = requestData.options;
      
      if (maxLength !== undefined && (
          typeof maxLength !== 'number' || 
          maxLength < schema.properties.options.properties.maxLength.minimum || 
          maxLength > schema.properties.options.properties.maxLength.maximum
      )) {
        return { 
          isValid: false, 
          error: `maxLength must be between ${schema.properties.options.properties.maxLength.minimum} and ${schema.properties.options.properties.maxLength.maximum}` 
        };
      }
      
      if (minLength !== undefined && (
          typeof minLength !== 'number' || 
          minLength < schema.properties.options.properties.minLength.minimum || 
          minLength > schema.properties.options.properties.minLength.maximum
      )) {
        return { 
          isValid: false, 
          error: `minLength must be between ${schema.properties.options.properties.minLength.minimum} and ${schema.properties.options.properties.minLength.maximum}` 
        };
      }
    }
    
    if (requestData.task === 'classify') {
      const { categories } = requestData.options;
      
      if (categories !== undefined && !Array.isArray(categories)) {
        return {
          isValid: false,
          error: 'Categories must be an array of strings'
        };
      }
      
      if (categories && categories.some(c => typeof c !== 'string')) {
        return {
          isValid: false,
          error: 'All categories must be strings'
        };
      }
    }
    
    if (requestData.task === 'extract-keywords') {
      const { keywordCount } = requestData.options;
      
      if (keywordCount !== undefined && (
          typeof keywordCount !== 'number' ||
          keywordCount < schema.properties.options.properties.keywordCount.minimum ||
          keywordCount > schema.properties.options.properties.keywordCount.maximum
      )) {
        return {
          isValid: false,
          error: `keywordCount must be between ${schema.properties.options.properties.keywordCount.minimum} and ${schema.properties.options.properties.keywordCount.maximum}`
        };
      }
    }
  }

  return { isValid: true };
}

export type { NlpRequest }; 