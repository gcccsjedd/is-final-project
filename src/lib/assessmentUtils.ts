// /lib/assessmentUtils.ts
export interface CareerMatch {
  title: string;
  matchPercentage: number;
  strengths: string[];
  growthOpportunity?: string;
  salary?: string;
  industry?: string;
  responsibilities?: string;
  requiredSkills?: string[];
  matchReason?: string;
  icon?: string;
  gradient?: string;
  educationRequired?: string;
  experienceLevel?: string;
  skillsToDevelop?: string[];
  certificationPaths?: string[];
  localCompanies?: string[];
}

export interface AssessmentData {
  match_score: number;
  top_careers: CareerMatch[];
  full_results: {
    recommendations: CareerMatch[];
    alternatePaths?: any[];
    jobLinks?: string[];
    summaryData?: {
      topMatch: number;
      averageMatch: number;
      totalRecommendations: number;
      suggestedNextSteps: string[];
      timelineSuggestions: string[];
    };
    userName?: string;
  };
}

export interface SavedAssessment {
  id: string;
  user_id: string;
  match_score: number;
  top_careers: CareerMatch[];
  full_results: AssessmentData['full_results'];
  date: string;
  time: string;
  created_at: string;
}

export async function saveAssessment(
  supabase: any,
  userId: string,
  assessmentData: AssessmentData,
  userName?: string
): Promise<{ success: boolean; assessmentId?: string; assessment?: SavedAssessment; error?: string }> {
  try {
    console.log('Saving assessment for user:', userId);
    
    const assessmentToSave = {
      user_id: userId,
      match_score: assessmentData.match_score || 0,
      top_careers: assessmentData.top_careers || [],
      full_results: {
        ...assessmentData.full_results,
        userName: userName || 'User'
      },
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      created_at: new Date().toISOString()
    };

    console.log('Assessment data to save:', assessmentToSave);

    const { data, error } = await supabase
      .from('assessments')
      .insert([assessmentToSave])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Assessment saved successfully:', data);
    return { 
      success: true, 
      assessmentId: data.id,
      assessment: data 
    };

  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export async function loadUserAssessments(
  supabase: any,
  userId: string
): Promise<{ 
  assessments: SavedAssessment[]; 
  latestAssessment: SavedAssessment | null; 
  error: string | null 
}> {
  try {
    console.log('Loading assessments for user:', userId);
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }

    console.log('Loaded assessments from Supabase:', data);

    const assessments: SavedAssessment[] = data || [];
    const latestAssessment: SavedAssessment | null = assessments.length > 0 ? assessments[0] : null;

    return {
      assessments,
      latestAssessment,
      error: null
    };

  } catch (error: any) {
    console.error('Error loading assessments:', error);
    return {
      assessments: [],
      latestAssessment: null,
      error: error.message
    };
  }
}

export async function deleteAssessment(
  supabase: any,
  assessmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Deleting assessment:', assessmentId, 'for user:', userId);
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting assessment:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}