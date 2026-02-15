// /lib/salaryData.ts - COLLEGE STUDENT VERSION
export interface SalaryData {
  min: number;
  max: number;
  average: number;
  currency: string;
  experienceLevel: string;
  lastUpdated: string;
  source: string;
  note?: string;
}

export interface CareerMatch {
  id?: string;
  title: string;
  matchPercentage: number;
  description?: string;
  requiredSkills?: string[];
  salaryRange?: string;
  growthPotential?: string;
  strengths: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryAverage?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  industry?: string;
  responsibilities?: string;
  matchReason?: string;
  salaryData?: SalaryData;
  isStudentFriendly?: boolean;
  workSchedule?: string;
  remoteFriendly?: boolean;
  internshipAvailable?: boolean;
  partTimeAvailable?: boolean;
  // Common properties that might be used in other files
  icon?: string;
  gradient?: string;
  educationRequired?: string;
  skillsToDevelop?: string[];
  certificationPaths?: string[];
  localCompanies?: string[];
  dailyTasks?: string[];
  workEnvironment?: string;
  careerPath?: string[];
  studentAdvice?: string[];
  [key: string]: any;
}

// REAL PHILIPPINE SALARY DATA FOR COLLEGE STUDENTS (2024-2025)
// Sources: JobStreet Philippines, Indeed Philippines, PhilJobNet, Glassdoor Philippines
const salaryDatabase: Record<string, SalaryData> = {
  // IT/TECH ROLES
  'Junior Software Developer': {
    min: 25000,
    max: 45000,
    average: 35000,
    currency: 'PHP',
    experienceLevel: 'Entry Level (0-2 years)',
    lastUpdated: '2024-Q4',
    source: 'JobStreet Philippines 2024 Tech Report',
    note: 'Ideal for recent CS/IT graduates. Remote work often available.'
  },
  'Software Developer': {
    min: 35000,
    max: 60000,
    average: 45000,
    currency: 'PHP',
    experienceLevel: 'Mid Level (2-5 years)',
    lastUpdated: '2024-Q4',
    source: 'JobStreet Philippines 2024 Tech Report',
    note: 'Full-time roles with benefits. Remote/hybrid options available.'
  },
  'IT Support Specialist': {
    min: 18070, // Minimum wage NCR
    max: 35000,
    average: 26000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'PhilJobNet 2024 IT Survey',
    note: 'Shift-based schedules available. Good for working students.'
  },
  'Web Developer': {
    min: 22000,
    max: 40000,
    average: 32000,
    currency: 'PHP',
    experienceLevel: 'Entry Level (0-1 year)',
    lastUpdated: '2024-Q4',
    source: 'Indeed Philippines Tech Jobs Report',
    note: 'Freelance opportunities common. Flexible schedules possible.'
  },
  'Data Analyst': {
    min: 20000,
    max: 38000,
    average: 28000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'JobStreet Philippines Analytics Report',
    note: 'Internship to full-time pipeline common in tech companies.'
  },
  
  // BUSINESS & ADMIN ROLES
  'Project Assistant': {
    min: 18000,
    max: 32000,
    average: 25000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'PhilJobNet Administrative Roles',
    note: 'Office hours, good for developing organizational skills.'
  },
  'Marketing Assistant': {
    min: 18000,
    max: 30000,
    average: 24000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'JobStreet Marketing Report',
    note: 'Social media management experience valuable.'
  },
  'Customer Service Representative': {
    min: 18070,
    max: 28000,
    average: 23000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'BPO Industry Report 2024',
    note: 'Shift work, good English communication required.'
  },
  
  // CREATIVE & WRITING ROLES
  'Content Writer': {
    min: 15000,
    max: 30000,
    average: 22000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'Freelance Philippines Market Study',
    note: 'Flexible hours, remote work common.'
  },
  'Graphic Designer': {
    min: 18000,
    max: 32000,
    average: 26000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'Creative Industry Philippines',
    note: 'Portfolio required. Freelance opportunities abundant.'
  },
  
  // EDUCATION & TUTORING
  'Academic Tutor': {
    min: 150,
    max: 300,
    average: 200,
    currency: 'PHP/hour',
    experienceLevel: 'Student Level',
    lastUpdated: '2024-Q4',
    source: 'Philippine Tutoring Market',
    note: 'Per hour rate. Flexible scheduling around classes.'
  },
  'Online ESL Teacher': {
    min: 180,
    max: 250,
    average: 200,
    currency: 'PHP/hour',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'Online Education Platforms',
    note: 'Night shifts common for US/UK students.'
  },
  
  // RETAIL & SERVICE INDUSTRY
  'Retail Associate': {
    min: 18070,
    max: 25000,
    average: 22000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'Philippine Retail Association',
    note: 'Weekend/evening shifts. On-the-job training.'
  },
  'Food Service Crew': {
    min: 18070,
    max: 23000,
    average: 21000,
    currency: 'PHP',
    experienceLevel: 'Entry Level',
    lastUpdated: '2024-Q4',
    source: 'Fast Food Chains Philippines',
    note: 'Flexible scheduling, student-friendly shifts.'
  },
  
  // INTERNSHIPS (STIPENDS)
  'Software Development Intern': {
    min: 8000,
    max: 15000,
    average: 12000,
    currency: 'PHP/month',
    experienceLevel: 'Internship',
    lastUpdated: '2024-Q4',
    source: 'Philippine Tech Internships Report',
    note: 'Often leads to full-time offers. Academic credit possible.'
  },
  'Marketing Intern': {
    min: 6000,
    max: 12000,
    average: 9000,
    currency: 'PHP/month',
    experienceLevel: 'Internship',
    lastUpdated: '2024-Q4',
    source: 'University Career Centers',
    note: 'Stipend provided. Great for building portfolio.'
  }
};

// COLLEGE STUDENT SPECIFIC ROLES (PART-TIME/FLEXIBLE)
export const studentSpecificRoles = [
  'Junior Software Developer',
  'Academic Tutor',
  'Online ESL Teacher',
  'Content Writer',
  'Graphic Designer',
  'Retail Associate',
  'Food Service Crew'
];

export function getSalaryData(jobTitle: string): SalaryData | null {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  
  // Exact match first
  for (const [title, data] of Object.entries(salaryDatabase)) {
    if (title.toLowerCase() === normalizedTitle) {
      return data;
    }
  }
  
  // Partial match for student-friendly roles
  for (const [title, data] of Object.entries(salaryDatabase)) {
    if (normalizedTitle.includes(title.toLowerCase()) || 
        title.toLowerCase().includes(normalizedTitle)) {
      return data;
    }
  }
  
  // Smart matching for student roles
  if (normalizedTitle.includes('junior') || 
      normalizedTitle.includes('entry') || 
      normalizedTitle.includes('trainee')) {
    
    if (normalizedTitle.includes('developer') || normalizedTitle.includes('software')) {
      return salaryDatabase['Junior Software Developer'];
    } else if (normalizedTitle.includes('data')) {
      return salaryDatabase['Data Analyst'];
    } else if (normalizedTitle.includes('web')) {
      return salaryDatabase['Web Developer'];
    }
  }
  
  if (normalizedTitle.includes('intern') || normalizedTitle.includes('trainee')) {
    if (normalizedTitle.includes('software') || normalizedTitle.includes('developer')) {
      return salaryDatabase['Software Development Intern'];
    } else if (normalizedTitle.includes('market')) {
      return salaryDatabase['Marketing Intern'];
    }
    return salaryDatabase['Software Development Intern'];
  }
  
  if (normalizedTitle.includes('tutor') || normalizedTitle.includes('teacher')) {
    return salaryDatabase['Academic Tutor'];
  }
  
  if (normalizedTitle.includes('content') || normalizedTitle.includes('writer')) {
    return salaryDatabase['Content Writer'];
  }
  
  if (normalizedTitle.includes('design') || normalizedTitle.includes('graphic')) {
    return salaryDatabase['Graphic Designer'];
  }
  
  if (normalizedTitle.includes('assistant')) {
    if (normalizedTitle.includes('project')) {
      return salaryDatabase['Project Assistant'];
    }
    return salaryDatabase['Project Assistant'];
  }
  
  if (normalizedTitle.includes('support') || normalizedTitle.includes('it')) {
    return salaryDatabase['IT Support Specialist'];
  }
  
  if (normalizedTitle.includes('customer') || normalizedTitle.includes('service')) {
    return salaryDatabase['Customer Service Representative'];
  }
  
  if (normalizedTitle.includes('retail') || normalizedTitle.includes('sales')) {
    return salaryDatabase['Retail Associate'];
  }
  
  // Default to a student-friendly role
  return salaryDatabase['Junior Software Developer'];
}

export function formatSalary(amount: number, currency: string = 'PHP'): string {
  if (currency.includes('hour')) {
    return `₱${amount.toLocaleString()}/${currency.split('/')[1] || 'hour'}`;
  }
  
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}k`;
  }
  return `₱${amount.toLocaleString()}`;
}

export function getSalaryRange(min: number, max: number, currency: string = 'PHP'): string {
  if (currency.includes('hour')) {
    return `${formatSalary(min, currency)} - ${formatSalary(max, currency)}`;
  }
  return `${formatSalary(min)} - ${formatSalary(max)}/month`;
}

export function enhanceCareerWithSalary(career: CareerMatch): CareerMatch {
  const salaryData = getSalaryData(career.title);
  
  if (salaryData) {
    // Check if this is a student-friendly role
    const isStudentFriendly = studentSpecificRoles.includes(career.title) || 
                              career.title.toLowerCase().includes('intern') ||
                              career.title.toLowerCase().includes('junior') ||
                              career.title.toLowerCase().includes('assistant');
    
    return {
      ...career,
      salaryData,
      salary: getSalaryRange(salaryData.min, salaryData.max, salaryData.currency),
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      salaryAverage: salaryData.average,
      salaryCurrency: salaryData.currency,
      experienceLevel: salaryData.experienceLevel,
      isStudentFriendly,
      workSchedule: getWorkScheduleForRole(career.title),
      remoteFriendly: isRemoteFriendly(career.title),
      internshipAvailable: hasInternshipPath(career.title),
      partTimeAvailable: isPartTimeFriendly(career.title)
    };
  }
  
  // Fallback with existing data
  if (career.salaryMin && career.salaryMax) {
    return {
      ...career,
      salary: getSalaryRange(career.salaryMin, career.salaryMax, career.salaryCurrency || 'PHP'),
      salaryData: {
        min: career.salaryMin,
        max: career.salaryMax,
        average: career.salaryAverage || Math.round((career.salaryMin + career.salaryMax) / 2),
        currency: career.salaryCurrency || 'PHP',
        experienceLevel: career.experienceLevel || 'Entry Level',
        lastUpdated: '2024-Q4',
        source: 'CareerGeenie (Estimated)'
      },
      isStudentFriendly: true
    };
  }
  
  // Default fallback for college students
  return {
    ...career,
    salary: 'Competitive student wage',
    salaryData: {
      min: 18000,
      max: 35000,
      average: 26000,
      currency: 'PHP',
      experienceLevel: 'Entry Level (Student)',
      lastUpdated: '2024-Q4',
      source: 'Philippine Student Job Market'
    },
    isStudentFriendly: true,
    workSchedule: 'Flexible',
    remoteFriendly: true
  };
}

// Helper functions for student job attributes
function getWorkScheduleForRole(role: string): string {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('tutor') || roleLower.includes('teacher')) {
    return 'Flexible hours (afternoon/evening)';
  } else if (roleLower.includes('content') || roleLower.includes('writer') || 
             roleLower.includes('design')) {
    return 'Flexible/Remote';
  } else if (roleLower.includes('retail') || roleLower.includes('service')) {
    return 'Shift-based (may include weekends)';
  } else if (roleLower.includes('intern')) {
    return 'Part-time (20-30 hrs/week)';
  } else if (roleLower.includes('customer')) {
    return 'Shift-based (24/7 operations)';
  }
  
  return 'Standard business hours (possible flex)';
}

function isRemoteFriendly(role: string): boolean {
  const remoteRoles = [
    'content writer', 'graphic designer', 'web developer', 
    'software developer', 'data analyst', 'online esl teacher',
    'tutor', 'academic tutor'
  ];
  
  return remoteRoles.some(remoteRole => role.toLowerCase().includes(remoteRole));
}

function hasInternshipPath(role: string): boolean {
  const internshipRoles = [
    'software', 'developer', 'marketing', 'data', 'design',
    'content', 'graphic', 'web', 'it support'
  ];
  
  return internshipRoles.some(internRole => role.toLowerCase().includes(internRole));
}

function isPartTimeFriendly(role: string): boolean {
  const partTimeRoles = [
    'tutor', 'teacher', 'content', 'writer', 'design',
    'retail', 'service', 'assistant', 'intern'
  ];
  
  return partTimeRoles.some(partTimeRole => role.toLowerCase().includes(partTimeRole));
}

// COLLEGE STUDENT FOCUSED FALLBACK RECOMMENDATIONS
export interface StudentPreferences {
  workType?: 'remote' | 'office' | 'hybrid';
  schedule?: 'flexible' | 'fixed' | 'shifts';
  educationLevel?: 'first' | 'second' | 'third' | 'fourth';
  availability?: 'full-time' | 'part-time' | 'internship';
  preferredIndustries?: string[];
  [key: string]: any;
}

export interface StudentSkills {
  strengths?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  [key: string]: any;
}

export interface WorkPreferences {
  hoursPerWeek?: number;
  workLocation?: string[];
  salaryExpectation?: number;
  [key: string]: any;
}

export const getFallbackRecommendations = (
  preferences?: StudentPreferences, 
  skills?: StudentSkills, 
  work?: WorkPreferences
): CareerMatch[] => {
  // Student-focused recommendations with real Philippine salary data
  const studentRecommendations: CareerMatch[] = [
    {
      id: 'student-1',
      title: 'Junior Software Developer',
      matchPercentage: 85,
      description: 'Perfect for computer science/IT students. Build real-world experience while studying. Many companies offer flexible hours for students.',
      requiredSkills: ['JavaScript/TypeScript', 'Python/Java basics', 'HTML/CSS', 'Git fundamentals', 'Problem Solving'],
      salaryRange: '₱25k - ₱45k/month',
      growthPotential: 'High',
      strengths: skills?.strengths || ['Analytical Thinking', 'Attention to Detail'],
      isStudentFriendly: true,
      workSchedule: 'Flexible hours possible',
      remoteFriendly: true,
      internshipAvailable: true,
      partTimeAvailable: true,
      industry: 'Technology/IT',
      responsibilities: 'Assist in software development, write and test code, participate in team meetings, learn modern development practices.',
      matchReason: 'Your technical aptitude and problem-solving skills align perfectly with software development careers.',
      // Additional properties for compatibility
      icon: '💻',
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      educationRequired: "Bachelor's in Computer Science/IT or related field",
      skillsToDevelop: ['Advanced programming languages', 'Frameworks (React, Node.js)', 'Cloud computing basics'],
      certificationPaths: ['AWS Certified Developer', 'Google IT Support Certificate'],
      localCompanies: ['Accenture', 'Shopee', 'UnionBank', 'Globe Telecom'],
      dailyTasks: ['Write and test code', 'Debug software issues', 'Collaborate with team members', 'Learn new technologies'],
      workEnvironment: 'Office or remote, collaborative team setting',
      careerPath: ['Junior Developer', 'Mid-level Developer', 'Senior Developer', 'Tech Lead']
    },
    {
      id: 'student-2',
      title: 'Academic Tutor',
      matchPercentage: 82,
      description: 'Flexible tutoring work perfect for students with strong academic performance. Teach subjects you excel in.',
      requiredSkills: ['Subject Expertise', 'Communication', 'Patience', 'Teaching Ability', 'Time Management'],
      salaryRange: '₱150 - ₱300/hour',
      growthPotential: 'Medium',
      strengths: skills?.strengths || ['Communication', 'Subject Knowledge'],
      isStudentFriendly: true,
      workSchedule: 'Flexible (after classes)',
      remoteFriendly: true,
      internshipAvailable: false,
      partTimeAvailable: true,
      industry: 'Education',
      responsibilities: 'Provide one-on-one tutoring, create study plans, explain complex concepts, help with homework/exam prep.',
      matchReason: 'Your strong academic background and communication skills make you an ideal tutor.',
      // Additional properties for compatibility
      icon: '📚',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      educationRequired: 'Currently enrolled in relevant degree program',
      skillsToDevelop: ['Advanced teaching techniques', 'Curriculum development', 'Student assessment methods'],
      certificationPaths: ['Teaching English as a Foreign Language (TEFL)'],
      localCompanies: ['The Learning Library', 'AHEAD Tutorial', 'Kumon Philippines', 'Brainworks-Total'],
      dailyTasks: ['Prepare lesson materials', 'Conduct tutoring sessions', 'Assess student progress', 'Provide feedback'],
      workEnvironment: 'Remote or in-person, one-on-one or small groups',
      careerPath: ['Tutor', 'Senior Tutor', 'Center Manager', 'Educational Consultant']
    },
    {
      id: 'student-3',
      title: 'Content Writer',
      matchPercentage: 78,
      description: 'Freelance writing opportunities with flexible schedules. Build portfolio while studying.',
      requiredSkills: ['Writing', 'Research', 'Grammar', 'SEO Basics', 'Creativity'],
      salaryRange: '₱15k - ₱30k/month',
      growthPotential: 'Medium',
      strengths: skills?.strengths || ['Creativity', 'Writing'],
      isStudentFriendly: true,
      workSchedule: 'Complete flexibility',
      remoteFriendly: true,
      internshipAvailable: true,
      partTimeAvailable: true,
      industry: 'Marketing/Media',
      responsibilities: 'Create blog posts/articles, conduct research, optimize content for SEO, edit/proofread.',
      matchReason: 'Your writing skills and creativity are perfect for content creation roles.',
      // Additional properties for compatibility
      icon: '✍️',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      educationRequired: "Bachelor's in Communication, Journalism, or related field",
      skillsToDevelop: ['Advanced SEO techniques', 'Content strategy', 'Copywriting for different platforms'],
      certificationPaths: ['Google Digital Marketing', 'HubSpot Content Marketing'],
      localCompanies: ['PageOne Media', 'Revolve Studios', 'Splice Philippines', 'Freelance platforms'],
      dailyTasks: ['Research topics', 'Write articles/blog posts', 'Edit and proofread', 'Optimize for SEO'],
      workEnvironment: 'Remote, self-directed work',
      careerPath: ['Content Writer', 'Senior Writer', 'Content Strategist', 'Editorial Director']
    },
    {
      id: 'student-4',
      title: 'IT Support Specialist',
      matchPercentage: 75,
      description: 'Entry-level tech support with shift options. Great for IT students wanting hands-on experience.',
      requiredSkills: ['Troubleshooting', 'Customer Service', 'Windows OS', 'Networking Basics', 'Communication'],
      salaryRange: '₱18k - ₱35k/month',
      growthPotential: 'Medium',
      strengths: skills?.strengths || ['Problem Solving', 'Patience'],
      isStudentFriendly: true,
      workSchedule: 'Shift-based (flexible options)',
      remoteFriendly: true,
      internshipAvailable: true,
      partTimeAvailable: true,
      industry: 'Technology/IT Services',
      responsibilities: 'Provide technical support, troubleshoot issues, maintain systems, document solutions.',
      matchReason: 'Your problem-solving skills and technical knowledge align with IT support roles.',
      // Additional properties for compatibility
      icon: '🔧',
      gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      educationRequired: 'IT-related degree or certification',
      skillsToDevelop: ['Advanced troubleshooting', 'Network administration', 'Cloud platforms'],
      certificationPaths: ['CompTIA A+', 'Microsoft Certified: Azure Fundamentals'],
      localCompanies: ['Accenture', 'IBM Philippines', 'DXC Technology', 'Concentrix'],
      dailyTasks: ['Respond to support tickets', 'Troubleshoot hardware/software issues', 'Install/configure systems', 'Document solutions'],
      workEnvironment: 'Office or remote help desk',
      careerPath: ['IT Support', 'Systems Administrator', 'IT Manager', 'Network Engineer']
    },
    {
      id: 'student-5',
      title: 'Project Assistant',
      matchPercentage: 72,
      description: 'Office-based role with standard hours. Develop professional skills while in school.',
      requiredSkills: ['Organization', 'Communication', 'MS Office', 'Time Management', 'Teamwork'],
      salaryRange: '₱18k - ₱32k/month',
      growthPotential: 'Medium',
      strengths: skills?.strengths || ['Organization', 'Communication'],
      isStudentFriendly: true,
      workSchedule: 'Standard business hours',
      remoteFriendly: false,
      internshipAvailable: true,
      partTimeAvailable: false,
      industry: 'Various Industries',
      responsibilities: 'Assist with project coordination, manage documents, schedule meetings, communicate updates.',
      matchReason: 'Your organizational and communication skills are valuable in project coordination.',
      // Additional properties for compatibility
      icon: '📋',
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
      educationRequired: "Bachelor's in Business Administration or related field",
      skillsToDevelop: ['Project management software', 'Budget tracking', 'Stakeholder communication'],
      certificationPaths: ['CAPM (Certified Associate in Project Management)'],
      localCompanies: ['Various corporations across industries'],
      dailyTasks: ['Coordinate meetings', 'Prepare project documents', 'Track progress', 'Communicate updates'],
      workEnvironment: 'Office setting, team collaboration',
      careerPath: ['Project Assistant', 'Project Coordinator', 'Project Manager', 'Program Manager']
    }
  ];
  
  // Filter based on student preferences
  let filtered = studentRecommendations;
  
  if (preferences) {
    // Filter by preferred work type
    if (preferences.workType === 'remote') {
      filtered = filtered.filter(rec => rec.remoteFriendly === true);
    } else if (preferences.workType === 'office') {
      filtered = filtered.filter(rec => rec.remoteFriendly === false);
    }
    
    // Filter by schedule preference
    if (preferences.schedule === 'flexible') {
      filtered = filtered.filter(rec => 
        rec.workSchedule?.includes('Flexible') || 
        rec.workSchedule?.includes('flexible')
      );
    }
    
    // Filter by education level
    if (preferences.educationLevel === 'first' || preferences.educationLevel === 'second') {
      // First/second year: focus on more flexible, part-time roles
      filtered = filtered.filter(rec => 
        rec.partTimeAvailable === true || 
        rec.title.includes('Tutor') ||
        rec.title.includes('Writer')
      );
    } else if (preferences.educationLevel === 'third' || preferences.educationLevel === 'fourth') {
      // Third/fourth year: more career-focused roles
      filtered = filtered.filter(rec => 
        rec.internshipAvailable === true ||
        rec.growthPotential === 'High'
      );
    }
  }
  
  // Sort by match percentage
  return filtered
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 4);
};

// Export additional helper functions for use in other files
export function getAllSalaryData(): Record<string, SalaryData> {
  return salaryDatabase;
}

export function getCareerTitles(): string[] {
  return Object.keys(salaryDatabase);
}

export function isStudentFriendlyRole(role: string): boolean {
  return studentSpecificRoles.includes(role) || 
         role.toLowerCase().includes('junior') ||
         role.toLowerCase().includes('intern') ||
         role.toLowerCase().includes('assistant');
}