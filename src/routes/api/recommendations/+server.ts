// src/routes/api/recommendations/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Groq } from 'groq-sdk';

// Define TypeScript interfaces (keep as is)
interface UserPreferences {
  workTypes: string[];
  salaryExpectation: string;
  workMotivation: string;
  educationLevel: string;
  educationField: string;
  workExperience: string;
  strengths?: string[];
  technicalSkills?: string[];
  learningStyle?: string;
  collaborationPreference?: string;
  timePreference?: string;
  guidancePreference?: string;
  workPace?: string;
  sessionId?: string;
  timestamp?: string;
}

interface CareerMatch {
  id: string;
  title: string;
  matchPercentage: number;
  description: string;
  requiredSkills: string[];
  salaryRange: string;
  growthPotential: string;
  strengths: string[];
  matchReason?: string;
  icon?: string;
  gradient?: string;
  educationRequired?: string;
  experienceLevel?: string;
  skillsToDevelop?: string[];
  certificationPaths?: string[];
  localCompanies?: string[];
  industry?: string;
  responsibilities?: string[];
}

interface AlternatePath {
  id: string;
  title: string;
  description: string;
  timeline: string;
  matchPercentage: number;
  requiredSkills?: string[];
  resources?: string[];
  icon?: string;
  gradient?: string;
}

interface RecommendationResponse {
  recommendations: CareerMatch[];
  alternatePaths: AlternatePath[];
  jobLinks: string[];
  summary: {
    topMatch: number;
    averageMatch: number;
    totalRecommendations: number;
    suggestedNextSteps: string[];
    timelineSuggestions: string[];
    userProfileSummary: string;
  };
}

// IMPORTANT: Use process.env for server-side environment variables
// Vercel automatically provides these from your environment variables dashboard
const GROQ_API_KEY = process.env.GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY;

// Initialize Groq
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// Function to validate API key
function validateApiKey(): boolean {
  console.log('API Key check:', {
    hasKey: !!GROQ_API_KEY,
    keyLength: GROQ_API_KEY?.length,
    firstChars: GROQ_API_KEY?.substring(0, 4) + '...',
    // Don't log the full key for security
  });
  
  if (!GROQ_API_KEY) {
    console.error('API key is missing. Please set GROQ_API_KEY environment variable.');
    return false;
  }
  
  if (GROQ_API_KEY.includes('placeholder') || GROQ_API_KEY === 'your_groq_api_key_here') {
    console.error('Using placeholder API key');
    return false;
  }
  
  return true;
}

// Function to analyze user data with Groq AI (keep as is)
async function analyzeWithGroq(userData: UserPreferences): Promise<any> {
  try {
    // Prepare the prompt for Groq AI
    const prompt = `
      You are a career guidance expert specializing in helping Filipino college students and recent graduates. 
      Analyze the following user profile and provide personalized career recommendations:

      USER PROFILE:
      - Work Types Interest: ${userData.workTypes.join(', ')}
      - Education Level: ${userData.educationLevel} year college student
      - Education Field: ${userData.educationField}
      - Work Experience: ${userData.workExperience}
      - Key Strengths: ${userData.strengths?.join(', ') || 'Not specified'}
      - Technical Skills: ${userData.technicalSkills?.join(', ') || 'Not specified'}
      - Salary Expectation: ${userData.salaryExpectation}
      - Work Motivation: ${userData.workMotivation}
      - Learning Style: ${userData.learningStyle}
      - Collaboration Preference: ${userData.collaborationPreference}
      - Time Preference: ${userData.timePreference}
      - Guidance Preference: ${userData.guidancePreference}
      - Work Pace: ${userData.workPace}

      REQUIREMENTS:
      1. Provide 3-5 career recommendations specifically for entry-level positions in the Philippines
      2. Each recommendation should include:
         - id: "1", "2", etc.
         - title: Job Title
         - matchPercentage: 60-95
         - description: Detailed description...
         - requiredSkills: ["skill1", "skill2"]
         - salaryRange: "₱20,000 - ₱35,000 monthly"
         - growthPotential: "High/Medium/Low"
         - strengths: ["strength1", "strength2"]
         - matchReason: "Why this matches the user..."
         - industry: "Industry name"
         - responsibilities: ["Responsibility 1", "Responsibility 2"]
      
      3. Provide 2-3 alternative career paths with:
         - id: "1", "2", etc.
         - title: Alternative Career
         - description: Description...
         - timeline: "6-12 months"
         - matchPercentage: 55-85
      
      4. Provide a summary including:
         - topMatch: 85
         - averageMatch: 78
         - totalRecommendations: 5
         - suggestedNextSteps: ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
         - timelineSuggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4", "Suggestion 5"]
         - userProfileSummary: "Brief summary of the user's profile"

      IMPORTANT: 
      - Focus on REAL entry-level positions available in the Philippine job market.
      - Consider the user's education level and provide practical, achievable recommendations.
      - Salary ranges should be realistic for entry-level positions in the Philippines.
      - Include both technical and soft skills in requiredSkills.
      - Make matchReason personalized to the user's specific inputs.

      CRITICAL INSTRUCTIONS:
      1. Return ONLY valid JSON, no additional text
      2. Ensure all JSON is properly formatted
      3. Use double quotes for all strings
      4. Do not use markdown code blocks
      5. Escape any special characters in strings

      Format your response as a valid JSON object with the following structure:
      {
        "recommendations": [
          {
            "id": "1",
            "title": "Job Title",
            "matchPercentage": 85,
            "description": "Detailed description...",
            "requiredSkills": ["skill1", "skill2"],
            "salaryRange": "₱20,000 - ₱35,000 monthly",
            "growthPotential": "High",
            "strengths": ["strength1", "strength2"],
            "matchReason": "Why this matches the user...",
            "industry": "Industry name",
            "responsibilities": ["Responsibility 1", "Responsibility 2"]
          }
        ],
        "alternatePaths": [
          {
            "id": "1",
            "title": "Alternative Career",
            "description": "Description...",
            "timeline": "6-12 months",
            "matchPercentage": 75
          }
        ],
        "summary": {
          "topMatch": 85,
          "averageMatch": 78,
          "totalRecommendations": 5,
          "suggestedNextSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
          "timelineSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4", "Suggestion 5"],
          "userProfileSummary": "Brief summary..."
        }
      }

      Your response must start with { and end with }
    `;

    console.log('Sending request to Groq AI...');
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a career guidance expert for Filipino students. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "openai/gpt-oss-120b", // Using the model from your example
      temperature: 0.7, // Lower temperature for more consistent JSON
      max_completion_tokens: 8192,
      top_p: 0.8,
      stream: false, // Set to false for single response
      reasoning_effort: "medium",
      stop: null
    });
    
    let text = chatCompletion.choices[0]?.message?.content || '';
    
    console.log('Received response from Groq AI (first 200 chars):', text.substring(0, 200));
    
    // Clean the response text
    text = text.trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to extract JSON if the response contains other text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    console.log('Cleaned JSON text (first 200 chars):', text.substring(0, 200));
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(text);
      console.log('Successfully parsed JSON response');
      return parsedResponse;
    } catch (parseError: any) {
      console.error('Error parsing Groq AI response:', parseError.message);
      console.log('Attempting to fix JSON...');
      
      // Try to fix common JSON issues
      text = text.replace(/'/g, '"'); // Replace single quotes with double quotes
      text = text.replace(/,\s*}/g, '}'); // Remove trailing commas
      text = text.replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays
      text = text.replace(/True/g, 'true').replace(/False/g, 'false'); // Fix Python booleans
      text = text.replace(/None/g, 'null'); // Fix Python nulls
      
      try {
        const parsedResponse = JSON.parse(text);
        console.log('Successfully parsed after cleaning');
        return parsedResponse;
      } catch (finalError: any) {
        console.error('Failed to parse even after cleaning:', finalError.message);
        console.log('Problematic JSON:', text);
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
  } catch (err: any) {
    console.error('Error calling Groq AI:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Check for specific Groq API errors
    if (err.message?.includes('API key') || err.message?.includes('authentication')) {
      throw new Error('Invalid API key. Please check your Groq API key.');
    }
    
    if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
      throw new Error('API quota exceeded. Please check your Groq usage.');
    }
    
    throw err;
  }
}

// Function to generate job search links (keep as is)
function generateJobLinks(recommendations: CareerMatch[]): string[] {
  const links: string[] = [];
  
  recommendations.forEach(career => {
    const encodedTitle = encodeURIComponent(career.title + ' entry level Philippines');
    
    // Different job platforms
    const platforms = [
      `https://ph.indeed.com/jobs?q=${encodedTitle}&l=Philippines&jt=fulltime&fromage=3`,
      `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}&location=Philippines&f_TPR=r2592000&position=1&pageNum=0`,
      `https://www.jobstreet.com.ph/${career.title.toLowerCase().replace(/ /g, '-')}-jobs`,
      `https://www.kalibrr.com/home/te/${encodedTitle}/philippines`
    ];
    
    // Add 2-3 different platforms
    platforms.slice(0, 3).forEach(platform => {
      links.push(platform);
    });
  });
  
  return links;
}

// Improved validation function (keep as is)
function validateUserData(userData: UserPreferences): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check Preferences section
  if (!userData.workTypes || userData.workTypes.length === 0) {
    errors.push('Work types are required');
  }
  
  if (!userData.salaryExpectation) {
    errors.push('Salary expectation is required');
  }
  
  if (!userData.workMotivation) {
    errors.push('Work motivation is required');
  }
  
  if (!userData.educationLevel) {
    errors.push('Education level is required');
  }
  
  if (!userData.educationField) {
    errors.push('Education field is required');
  }
  
  if (!userData.workExperience) {
    errors.push('Work experience level is required');
  }

  // Check Skills section
  if (!userData.strengths || userData.strengths.length === 0) {
    errors.push('At least one strength is required');
  }
  
  if (!userData.technicalSkills || userData.technicalSkills.length === 0) {
    errors.push('At least one technical skill is required');
  }

  // Check Work Preferences section
  if (!userData.learningStyle) {
    errors.push('Learning style is required');
  }
  
  if (!userData.collaborationPreference) {
    errors.push('Collaboration preference is required');
  }
  
  if (!userData.timePreference) {
    errors.push('Time preference is required');
  }
  
  if (!userData.guidancePreference) {
    errors.push('Guidance preference is required');
  }
  
  if (!userData.workPace) {
    errors.push('Work pace is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Function to enhance recommendations with additional data (keep as is)
function enhanceRecommendations(recommendations: CareerMatch[]): CareerMatch[] {
  const icons = [
    'fa-solid fa-code',
    'fa-solid fa-chart-line',
    'fa-solid fa-users',
    'fa-solid fa-briefcase',
    'fa-solid fa-graduation-cap',
    'fa-solid fa-paintbrush',
    'fa-solid fa-headset',
    'fa-solid fa-calculator',
    'fa-solid fa-pencil-alt',
    'fa-solid fa-wrench'
  ];
  
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-yellow-500 to-amber-500',
    'from-teal-500 to-green-500',
    'from-indigo-500 to-purple-500'
  ];
  
  return recommendations.map((rec, index) => ({
    ...rec,
    icon: icons[index % icons.length],
    gradient: gradients[index % gradients.length],
    skillsToDevelop: rec.requiredSkills?.slice(0, 3) || [],
    certificationPaths: getCertificationPaths(rec.industry || 'General'),
    localCompanies: getLocalCompanies(rec.industry || 'General'),
    educationRequired: rec.educationRequired || getEducationRequired(rec.industry || 'General'),
    experienceLevel: rec.experienceLevel || 'Entry-level'
  }));
}

// Function to enhance alternate paths (keep as is)
function enhanceAlternatePaths(alternatePaths: AlternatePath[]): AlternatePath[] {
  const icons = [
    'fa-solid fa-palette',
    'fa-solid fa-keyboard',
    'fa-solid fa-bullhorn',
    'fa-solid fa-hashtag',
    'fa-solid fa-headset',
    'fa-solid fa-chart-bar'
  ];
  
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-gray-500 to-slate-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-green-500 to-emerald-500',
    'from-amber-500 to-yellow-500'
  ];
  
  return alternatePaths.map((path, index) => ({
    ...path,
    icon: icons[index % icons.length],
    gradient: gradients[index % gradients.length]
  }));
}

// Helper functions for enhancement (keep as is)
function getCertificationPaths(industry: string): string[] {
  const certifications: Record<string, string[]> = {
    'Technology': ['Google IT Support', 'AWS Cloud Practitioner', 'CompTIA A+'],
    'Business': ['Google Project Management', 'HubSpot Marketing', 'Six Sigma Yellow Belt'],
    'Creative': ['Adobe Certified Professional', 'Google UX Design', 'Meta Social Media Marketing'],
    'Healthcare': ['Basic Life Support (BLS)', 'Medical Coding', 'Pharmacy Assistant Certification'],
    'Engineering': ['Autodesk Certified Professional', 'SolidWorks Certification', 'Six Sigma Yellow Belt'],
    'Education': ['Licensure Examination for Teachers (LET)', 'TESDA Trainers Methodology'],
    'Finance': ['Securities and Exchange Commission (SEC) registration', 'Insurance Commission license'],
    'Marketing': ['Google Digital Marketing & E-commerce', 'Meta Blueprint', 'HubSpot Content Marketing']
  };
  
  return certifications[industry] || ['Industry-specific certifications', 'Professional development courses'];
}

function getLocalCompanies(industry: string): string[] {
  const companies: Record<string, string[]> = {
    'Technology': ['Accenture', 'Pointwest', 'IBM Philippines', 'DXC Technology', 'Collabera Digital'],
    'Business': ['BPI', 'SM Group', 'Ayala Corporation', 'Jollibee Foods Corporation', 'San Miguel Corporation'],
    'Creative': ['Advertising Agencies', 'Media Companies', 'Digital Marketing Firms', 'Publishing Houses'],
    'Healthcare': ['St. Luke\'s Medical Center', 'Makati Medical Center', 'Philippine General Hospital', 'Private Clinics'],
    'Engineering': ['Construction firms', 'Engineering consultancies', 'Manufacturing companies', 'Infrastructure companies'],
    'Finance': ['Banks', 'Insurance companies', 'Investment firms', 'Accounting firms'],
    'Marketing': ['Advertising agencies', 'PR firms', 'Digital marketing agencies', 'Market research companies']
  };
  
  return companies[industry] || ['Various local companies', 'International corporations in PH'];
}

function getEducationRequired(industry: string): string {
  const educationMap: Record<string, string> = {
    'Technology': 'Bachelor\'s in Computer Science, IT, or related field',
    'Business': 'Bachelor\'s in Business Administration, Management, or related field',
    'Creative': 'Bachelor\'s in Fine Arts, Multimedia Arts, or related field',
    'Healthcare': 'Relevant diploma or Bachelor\'s degree in health sciences',
    'Engineering': 'Bachelor\'s in Engineering or related technical field',
    'Education': 'Bachelor\'s in Education or related field',
    'Finance': 'Bachelor\'s in Finance, Accounting, or Business',
    'Marketing': 'Bachelor\'s in Marketing, Communications, or Business'
  };
  
  return educationMap[industry] || 'Bachelor\'s degree in relevant field';
}

// Main POST handler
export const POST: RequestHandler = async ({ request }) => {
  console.log('=== API CALL STARTED ===');
  
  try {
    // Validate API key first
    if (!validateApiKey()) {
      console.error('API key validation failed');
      return json(
        {
          error: 'API Configuration Error',
          message: 'Invalid or missing Groq API key. Please check your environment variables.',
          recommendations: [],
          alternatePaths: [],
          jobLinks: [],
          summary: {
            topMatch: 0,
            averageMatch: 0,
            totalRecommendations: 0,
            suggestedNextSteps: [],
            timelineSuggestions: [],
            userProfileSummary: ''
          }
        },
        { status: 500 }
      );
    }

    const userData: UserPreferences = await request.json();
    
    console.log('Received user data for AI analysis:', {
      workTypes: userData.workTypes?.length,
      educationField: userData.educationField,
      educationLevel: userData.educationLevel,
      strengths: userData.strengths?.length,
      skills: userData.technicalSkills?.length,
      workPreferences: {
        learningStyle: userData.learningStyle,
        collaborationPreference: userData.collaborationPreference,
        timePreference: userData.timePreference,
        guidancePreference: userData.guidancePreference,
        workPace: userData.workPace
      }
    });

    // Validate all required fields
    const validation = validateUserData(userData);
    
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return json(
        {
          error: 'Validation failed',
          message: 'Please complete all sections',
          details: validation.errors,
          recommendations: [],
          alternatePaths: [],
          jobLinks: [],
          summary: {
            topMatch: 0,
            averageMatch: 0,
            totalRecommendations: 0,
            suggestedNextSteps: [],
            timelineSuggestions: [],
            userProfileSummary: ''
          }
        },
        { status: 400 }
      );
    }

    console.log('Calling Groq AI for career analysis...');
    
    // Get AI-powered recommendations
    const aiResponse = await analyzeWithGroq(userData);
    
    if (!aiResponse || !aiResponse.recommendations) {
      console.error('Invalid AI response:', aiResponse);
      throw new Error('Invalid response from AI service');
    }
    
    console.log('AI Response received:', {
      recommendationsCount: aiResponse.recommendations?.length,
      alternatePathsCount: aiResponse.alternatePaths?.length
    });
    
    // Enhance recommendations with additional data
    const enhancedRecommendations = enhanceRecommendations(aiResponse.recommendations);
    const enhancedAlternatePaths = enhanceAlternatePaths(aiResponse.alternatePaths || []);
    
    // Generate job links
    const jobLinks = generateJobLinks(enhancedRecommendations);
    
    // Calculate average match if not provided
    const averageMatch = aiResponse.summary?.averageMatch || 
      Math.round(enhancedRecommendations.reduce((sum, r) => sum + r.matchPercentage, 0) / enhancedRecommendations.length);
    
    // Prepare response
    const response: RecommendationResponse = {
      recommendations: enhancedRecommendations,
      alternatePaths: enhancedAlternatePaths,
      jobLinks,
      summary: {
        topMatch: aiResponse.summary?.topMatch || enhancedRecommendations[0]?.matchPercentage || 0,
        averageMatch: averageMatch,
        totalRecommendations: (enhancedRecommendations.length + enhancedAlternatePaths.length),
        suggestedNextSteps: aiResponse.summary?.suggestedNextSteps || [
          "Update your LinkedIn profile to highlight relevant skills",
          "Start building a portfolio of projects or work samples",
          "Network with professionals in your target industry",
          "Consider relevant certifications to enhance your qualifications",
          "Practice interview skills and prepare your resume"
        ],
        timelineSuggestions: aiResponse.summary?.timelineSuggestions || [
          "Complete 1-2 relevant online courses in the next 3 months",
          "Apply for internships or part-time positions this semester",
          "Attend at least 2 career fairs or networking events",
          "Prepare and finalize your resume and cover letter",
          "Schedule informational interviews with professionals in your field"
        ],
        userProfileSummary: aiResponse.summary?.userProfileSummary || 
          `${userData.educationField} student with interests in ${userData.workTypes.slice(0, 2).join(' and ')} seeking entry-level opportunities`
      }
    };

    console.log('Successfully generated AI-powered recommendations:', {
      topMatch: `${response.summary.topMatch}%`,
      recommendations: response.recommendations.map(r => `${r.title} (${r.matchPercentage}%)`),
      totalRecommendations: response.summary.totalRecommendations
    });

    return json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (err: any) {
    console.error('Error generating career recommendations:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Return fallback recommendations if AI fails
    const fallbackRecommendations = getFallbackRecommendations();
    
    return json(
      {
        error: 'AI Service Error',
        message: 'Using fallback recommendations. The AI service encountered an issue.',
        details: err.message || 'Unknown error',
        ...fallbackRecommendations
      },
      {
        status: 200, // Return 200 with fallback data
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

// Fallback function in case AI fails (keep as is)
function getFallbackRecommendations(): RecommendationResponse {
  return {
    recommendations: [
      {
        id: '1',
        title: 'Junior Software Developer',
        matchPercentage: 85,
        description: 'Entry-level position developing software applications. Perfect for recent graduates with coding skills. High demand in the Philippine IT sector with many opportunities in BPO and tech companies.',
        requiredSkills: ['JavaScript', 'Python', 'HTML/CSS', 'Git', 'Problem Solving', 'Team Collaboration'],
        salaryRange: '₱25,000 - ₱45,000 monthly',
        growthPotential: 'High',
        strengths: ['Analytical Thinking', 'Attention to Detail', 'Problem Solving', 'Adaptability'],
        matchReason: 'Your technical skills and structured work preference align well with software development roles that are in high demand in the Philippines.',
        industry: 'Technology',
        responsibilities: ['Develop and maintain software applications', 'Write clean and efficient code', 'Debug and troubleshoot issues', 'Collaborate with cross-functional teams', 'Participate in code reviews'],
        icon: 'fa-solid fa-code',
        gradient: 'from-blue-500 to-cyan-500',
        educationRequired: "Bachelor's in Computer Science, Information Technology, or related field",
        experienceLevel: 'Entry-level (0-2 years)',
        skillsToDevelop: ['TypeScript', 'React/Next.js', 'Cloud Computing (AWS/Azure)', 'REST APIs'],
        certificationPaths: ['AWS Cloud Practitioner', 'Google IT Automation with Python', 'Microsoft Certified: Azure Fundamentals'],
        localCompanies: ['Accenture Philippines', 'Pointwest Technologies', 'IBM Philippines', 'DXC Technology', 'Collabera Digital']
      },
      {
        id: '2',
        title: 'Data Analyst Trainee',
        matchPercentage: 78,
        description: 'Beginner role focused on analyzing data, creating reports, and providing insights. Growing field in the Philippines with applications across various industries including finance, retail, and technology.',
        requiredSkills: ['Microsoft Excel', 'SQL', 'Data Analysis', 'Statistical Analysis', 'Communication Skills', 'Attention to Detail'],
        salaryRange: '₱20,000 - ₱35,000 monthly',
        growthPotential: 'High',
        strengths: ['Analytical Thinking', 'Attention to Detail', 'Communication', 'Problem Solving'],
        matchReason: 'Your analytical mindset and interest in data-driven work make you suitable for data analysis roles that are increasingly important in today\'s business environment.',
        industry: 'Technology & Business',
        responsibilities: ['Collect and analyze datasets', 'Create reports and dashboards', 'Identify trends and patterns', 'Present findings to stakeholders', 'Ensure data accuracy and quality'],
        icon: 'fa-solid fa-chart-line',
        gradient: 'from-purple-500 to-indigo-500',
        educationRequired: "Bachelor's in Statistics, Mathematics, Computer Science, Business Analytics, or related field",
        experienceLevel: 'Entry-level (0-1 year)',
        skillsToDevelop: ['Python/R for data analysis', 'Power BI/Tableau', 'Data Visualization', 'Machine Learning Basics'],
        certificationPaths: ['Google Data Analytics Professional Certificate', 'Microsoft Power BI Data Analyst', 'Tableau Desktop Specialist'],
        localCompanies: ['Concentrix Philippines', 'Telus International Philippines', 'JP Morgan Chase Philippines', 'Wells Fargo Philippines', 'Shopee Philippines']
      },
      {
        id: '3',
        title: 'Digital Marketing Assistant',
        matchPercentage: 72,
        description: 'Entry-level role in online marketing, social media management, and content creation. Perfect for creative individuals interested in the digital space with opportunities in various industries.',
        requiredSkills: ['Social Media Management', 'Content Creation', 'Basic Analytics', 'Communication Skills', 'Creativity', 'Adaptability'],
        salaryRange: '₱18,000 - ₱30,000 monthly',
        growthPotential: 'Medium to High',
        strengths: ['Creativity', 'Communication', 'Adaptability', 'Teamwork'],
        matchReason: 'Your creative interests and communication skills align well with digital marketing roles that are essential for modern businesses.',
        industry: 'Marketing & Communications',
        responsibilities: ['Assist with digital marketing campaigns', 'Manage social media accounts', 'Create engaging content', 'Monitor campaign performance', 'Conduct market research'],
        icon: 'fa-solid fa-bullhorn',
        gradient: 'from-pink-500 to-rose-500',
        educationRequired: "Bachelor's in Marketing, Communications, Multimedia Arts, or related field",
        experienceLevel: 'Entry-level (0-1 year)',
        skillsToDevelop: ['SEO/SEM', 'Google Analytics', 'Content Marketing Strategy', 'Email Marketing'],
        certificationPaths: ['Google Digital Marketing & E-commerce Certificate', 'Meta Blueprint Certification', 'HubSpot Content Marketing Certification'],
        localCompanies: ['Advertising Agencies', 'E-commerce Companies', 'Media Companies', 'Startups', 'Corporate Marketing Departments']
      }
    ],
    alternatePaths: [
      {
        id: '1',
        title: 'Project Coordinator',
        description: 'Support role in project management, team coordination, and documentation. Good entry point for those interested in business and management careers.',
        timeline: '6-12 months of experience or training',
        matchPercentage: 70,
        requiredSkills: ['Organization', 'Communication', 'Time Management', 'Microsoft Office'],
        resources: ['Google Project Management Certificate', 'CAPM (Certified Associate in Project Management) preparation'],
        icon: 'fa-solid fa-calendar-check',
        gradient: 'from-green-500 to-emerald-500'
      },
      {
        id: '2',
        title: 'Technical Support Specialist',
        description: 'Customer-facing technical role helping users with hardware and software issues. Develops both technical and communication skills.',
        timeline: '3-6 months of training',
        matchPercentage: 65,
        requiredSkills: ['Troubleshooting', 'Customer Service', 'Technical Knowledge', 'Patience'],
        resources: ['Google IT Support Certificate', 'CompTIA A+ Certification', 'Microsoft Technology Associate'],
        icon: 'fa-solid fa-headset',
        gradient: 'from-orange-500 to-red-500'
      },
      {
        id: '3',
        title: 'Content Writer/Creator',
        description: 'Role focused on creating written or visual content for websites, blogs, and social media. Ideal for those with strong communication and creativity skills.',
        timeline: '3-6 months portfolio building',
        matchPercentage: 68,
        requiredSkills: ['Writing Skills', 'Research', 'Creativity', 'SEO Basics'],
        resources: ['HubSpot Content Marketing Course', 'Copywriting courses', 'SEO fundamentals training'],
        icon: 'fa-solid fa-pen-fancy',
        gradient: 'from-yellow-500 to-amber-500'
      }
    ],
    jobLinks: [
      'https://ph.indeed.com/jobs?q=Junior+Software+Developer+entry+level&l=Philippines&jt=fulltime&fromage=3',
      'https://ph.indeed.com/jobs?q=Data+Analyst+trainee&l=Philippines&jt=fulltime',
      'https://www.linkedin.com/jobs/search/?keywords=entry%20level%20developer&location=Philippines&f_TPR=r2592000',
      'https://www.jobstreet.com.ph/digital-marketing-assistant-jobs',
      'https://www.kalibrr.com/home/te/software-developer-entry-level/philippines'
    ],
    summary: {
      topMatch: 85,
      averageMatch: 75,
      totalRecommendations: 6,
      suggestedNextSteps: [
        'Update your LinkedIn profile with relevant skills and projects',
        'Create a portfolio showcasing your work (GitHub for developers, writing samples for writers)',
        'Network with professionals in your target industry through LinkedIn and local events',
        'Research and apply for relevant certifications to enhance your qualifications',
        'Practice common interview questions and prepare your elevator pitch'
      ],
      timelineSuggestions: [
        'Complete 1-2 relevant online courses in the next 3 months',
        'Apply for at least 5 internships or entry-level positions this semester',
        'Attend 2-3 career fairs or networking events in the next month',
        'Prepare and get feedback on your resume from career services',
        'Schedule informational interviews with 3 professionals in your field'
      ],
      userProfileSummary: 'Career-focused student seeking entry-level opportunities with a mix of technical and creative interests'
    }
  };
}

// GET handler for API status
export const GET: RequestHandler = async () => {
  const apiKeyValid = validateApiKey();
  
  // Test the API key with a simple request if valid
  let apiTestResult = 'Not tested';
  if (apiKeyValid) {
    try {
      const testCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Hello, respond with 'OK' if you're working."
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_completion_tokens: 10,
        top_p: 0.8,
        stream: false,
        reasoning_effort: "low"
      });
      
      apiTestResult = 'Connected successfully';
    } catch (error: any) {
      apiTestResult = `Connection failed: ${error.message}`;
    }
  }
  
  return json({
    message: 'CareerGeenie AI Recommendation API',
    status: apiKeyValid ? 'Operational' : 'API Key Required',
    apiTest: apiTestResult,
    endpoints: {
      POST: '/api/recommendations - Submit user data for AI-powered career recommendations',
      GET: '/api/recommendations - API status'
    },
    features: [
      'AI-powered career matching using Groq AI',
      'Personalized recommendations based on user profile',
      'Philippine job market focus',
      'Realistic salary ranges for entry-level positions',
      'Practical next steps and timeline suggestions'
    ],
    aiModel: 'GPT-OSS-120B (Groq)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    note: apiKeyValid ? 
      'API key is configured' : 
      `Please configure GROQ_API_KEY in environment variables. Current: ${GROQ_API_KEY ? 'Present but invalid' : 'Missing'}`
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};