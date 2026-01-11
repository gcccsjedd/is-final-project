// src/lib/errorHandler.ts
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

export function handleAssessmentError(error: any): string {
  if (error instanceof AssessmentError) {
    return error.message;
  }
  
  if (error?.message?.includes('permission')) {
    return 'Permission denied. Please check your database permissions.';
  }
  
  if (error?.message?.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}