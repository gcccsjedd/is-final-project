<!-- Dashboard.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { supabase } from '../lib/supabase';
  import { loadUserAssessments, deleteAssessment as deleteAssessmentUtil, type SavedAssessment } from '../lib/assessmentUtils';
  
  // REMOVED: import jsPDF from 'jspdf';
  // REMOVED: import html2canvas from 'html2canvas';
  
  // Types
  interface CareerMatch {
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
    // New fields for detailed explanations
    description?: string;
    dailyTasks?: string[];
    workEnvironment?: string;
    careerPath?: string[];
    typicalDay?: string;
    challenges?: string[];
    benefits?: string[];
  }

  interface Assessment extends SavedAssessment {
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

  interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
  }

  export let userName = '';
  export let onLogout: () => void;

  // Light theme color palette
  const colors = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#f59e0b',
    secondaryLight: '#fbbf24',
    accent: '#ec4899',
    accentLight: '#f472b6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceLight: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8'
  };

  // Reactive state
  let sidebarOpen = true;
  let showSettingsMenu = false;
  let showDeleteConfirm = false;
  let assessmentToDelete: string | null = null;
  let showProfileUpload = false;
  let showEditProfile = false;
  let isLoading = false;
  let error = '';
  let success = '';
  let showResumeModal = false;
  let isGeneratingPDF = false;
  
  // NEW: Career Details Modal State
  let showCareerDetails = false;
  let selectedCareer: CareerMatch | null = null;
  let careerDetailsLoading = false;

  // User data
  let userProfile: UserProfile | null = null;
  let assessments: Assessment[] = [];
  let latestAssessment: Assessment | null = null;

  // Pagination for assessment history
  let currentAssessmentPage = 1;
  let assessmentsPerPage = 5;
  let totalAssessmentPages = 1;

  // Form state
  let editProfileData = {
    first_name: '',
    last_name: '',
    phone: '',
    profile_picture: ''
  };

  // Resume data - FIXED: Added location field for education
  let resumeData = {
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    skills: [] as string[],
    experiences: [] as Array<{
      title: string;
      company: string;
      location: string;
      startDate: string;
      endDate: string;
      current: boolean;
      description: string;
    }>,
    education: [] as Array<{
      degree: string;
      institution: string;
      location: string; // This field is now editable
      graduationDate: string;
      gpa: string;
    }>,
    certifications: [] as Array<{
      name: string;
      issuer: string;
      date: string;
    }>
  };

  let newSkill = '';
  
  // FIXED: Added location field to newExperience
  let newExperience = {
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  };
  
  // FIXED: Added location field to newEducation
  let newEducation = {
    degree: '',
    institution: '',
    location: '',
    graduationDate: '',
    gpa: ''
  };
  
  let newCertification = {
    name: '',
    issuer: '',
    date: ''
  };

  // Career descriptions database
  const careerDescriptions = {
    'Software Developer': {
      description: 'Software developers design, build, and maintain computer programs and applications. They solve problems through code and create solutions that power businesses, entertainment, and daily life.',
      dailyTasks: [
        'Writing and testing code for new applications',
        'Debugging and fixing issues in existing software',
        'Collaborating with designers and product managers',
        'Reviewing code from other developers',
        'Documenting software functionality',
        'Participating in planning meetings'
      ],
      workEnvironment: 'Typically office-based or remote, working in teams using Agile methodologies. Regular collaboration with cross-functional teams.',
      careerPath: ['Junior Developer', 'Mid-level Developer', 'Senior Developer', 'Tech Lead', 'Engineering Manager', 'CTO'],
      typicalDay: 'Start with stand-up meeting, work on coding tasks, attend planning sessions, review pull requests, test features, and document work.',
      challenges: [
        'Keeping up with rapidly changing technologies',
        'Managing complex codebases',
        'Debugging difficult issues',
        'Balancing speed with code quality'
      ],
      benefits: [
        'High demand and competitive salaries',
        'Creative problem-solving opportunities',
        'Remote work flexibility',
        'Continuous learning environment'
      ]
    },
    'Data Scientist': {
      description: 'Data scientists analyze and interpret complex data to help organizations make better decisions. They use statistics, machine learning, and programming to extract insights from data.',
      dailyTasks: [
        'Cleaning and preparing data for analysis',
        'Building predictive models',
        'Creating data visualizations',
        'Writing reports on findings',
        'Collaborating with business teams',
        'Researching new analytical methods'
      ],
      workEnvironment: 'Office or remote settings, often in tech companies, finance, healthcare, or consulting firms. Work involves both independent analysis and team collaboration.',
      careerPath: ['Data Analyst', 'Junior Data Scientist', 'Data Scientist', 'Senior Data Scientist', 'Lead Data Scientist', 'Director of Data Science'],
      typicalDay: 'Analyze datasets, build models, create visualizations, meet with stakeholders, present findings, and research new techniques.',
      challenges: [
        'Dealing with messy or incomplete data',
        'Explaining technical concepts to non-technical stakeholders',
        'Keeping up with rapidly evolving AI/ML field'
      ],
      benefits: [
        'High earning potential',
        'Impact on business decisions',
        'Varied and interesting problems',
        'Strong job market demand'
      ]
    },
    'UX Designer': {
      description: 'UX (User Experience) designers create meaningful and relevant experiences for users of digital products. They focus on the overall feel of the product and user satisfaction.',
      dailyTasks: [
        'Conducting user research and interviews',
        'Creating wireframes and prototypes',
        'Testing designs with real users',
        'Collaborating with developers and product managers',
        'Analyzing user feedback',
        'Designing user flows and interfaces'
      ],
      workEnvironment: 'Creative office spaces or remote work, often in tech companies, agencies, or product teams. Collaborative environment with regular user testing.',
      careerPath: ['UX Designer', 'Senior UX Designer', 'UX Lead', 'Head of UX', 'Director of Product Design'],
      typicalDay: 'User research sessions, design workshops, creating prototypes, usability testing, and team sync meetings.',
      challenges: [
        'Balancing user needs with business goals',
        'Proving design value with metrics',
        'Keeping up with design trends and tools'
      ],
      benefits: [
        'Creative and user-focused work',
        'Seeing real impact on products',
        'Collaborative team environment',
        'Good work-life balance'
      ]
    },
    'Project Manager': {
      description: 'Project managers plan, execute, and oversee projects to ensure they are completed on time, within budget, and meet objectives. They coordinate teams and resources.',
      dailyTasks: [
        'Creating project plans and timelines',
        'Managing project budgets',
        'Coordinating team members',
        'Tracking project progress',
        'Communicating with stakeholders',
        'Risk management and problem-solving'
      ],
      workEnvironment: 'Varied environments including offices, construction sites, or remote settings across industries like tech, construction, healthcare, and consulting.',
      careerPath: ['Project Coordinator', 'Project Manager', 'Senior Project Manager', 'Program Manager', 'Director of Project Management'],
      typicalDay: 'Team meetings, progress tracking, stakeholder updates, risk assessment, budget review, and planning sessions.',
      challenges: [
        'Managing scope creep',
        'Dealing with conflicting priorities',
        'Keeping teams motivated and on track'
      ],
      benefits: [
        'Variety of projects and industries',
        'Leadership opportunities',
        'Visible impact on organization success'
      ]
    },
    'Marketing Manager': {
      description: 'Marketing managers develop and implement strategies to promote products or services. They analyze market trends, oversee campaigns, and manage marketing teams.',
      dailyTasks: [
        'Developing marketing strategies',
        'Managing advertising campaigns',
        'Analyzing market research',
        'Budget planning and management',
        'Overseeing content creation',
        'Measuring campaign performance'
      ],
      workEnvironment: 'Office-based or remote, often in corporate settings, agencies, or tech companies. Fast-paced environment with regular campaign launches.',
      careerPath: ['Marketing Coordinator', 'Marketing Specialist', 'Marketing Manager', 'Senior Marketing Manager', 'Marketing Director', 'CMO'],
      typicalDay: 'Campaign planning, team meetings, performance analysis, budget reviews, and strategy sessions.',
      challenges: [
        'Proving ROI on marketing spend',
        'Keeping up with digital marketing trends',
        'Managing multiple campaigns simultaneously'
      ],
      benefits: [
        'Creative and strategic work',
        'Direct impact on business growth',
        'Diverse career opportunities',
        'Fast-paced environment'
      ]
    }
  };

  // Initialize dashboard
  onMount(async () => {
    await loadUserData();
    await loadAssessments();
    
    // Load from localStorage as fallback
    if (!latestAssessment) {
      await loadLatestAssessmentFromLocalStorage();
    }
    
    // Initialize resume data after everything is loaded
    initializeResumeData();
    
    // Set initial sidebar state based on screen size
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', checkScreenSize);
  });

  // Check screen size for responsive sidebar
  function checkScreenSize() {
    if (window.innerWidth < 1024) {
      sidebarOpen = false; // Auto-close sidebar on mobile
    } else {
      sidebarOpen = true; // Auto-open sidebar on desktop
    }
  }

  // Enhanced logout function
  async function handleLogout() {
    try {
      isLoading = true;
      
      // Clear any ongoing states
      showSettingsMenu = false;
      
      // Sign out from Supabase
      const { error: logoutError } = await supabase.auth.signOut();
      
      if (logoutError) {
        throw logoutError;
      }
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Show success message
      success = 'Logging out...';
      
      // If parent provided a logout handler, use it
      if (onLogout && typeof onLogout === 'function') {
        // Small delay to show success message
        setTimeout(() => {
          onLogout();
        }, 500);
      } else {
        // Fallback: redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
      
    } catch (err: any) {
      console.error('Logout error:', err);
      error = 'Logout failed: ' + (err.message || 'Unknown error');
      isLoading = false;
      
      // Try fallback redirect anyway
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }

  // Load latest assessment from localStorage as fallback
  async function loadLatestAssessmentFromLocalStorage() {
    try {
      const stored = localStorage.getItem('latestAssessment');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loading from localStorage:', parsed);
        
        if (!parsed) return;
        
        const topCareers = parsed.top_careers || parsed.full_results?.recommendations || [];
        const fullResults = parsed.full_results || {};
        const matchScore = parsed.match_score || 0;
        
        latestAssessment = {
          id: parsed.id || 'local-' + Date.now(),
          user_id: parsed.user_id || 'local-user',
          date: parsed.date || new Date().toISOString().split('T')[0],
          time: parsed.time || new Date().toLocaleTimeString(),
          match_score: matchScore,
          top_careers: topCareers,
          full_results: {
            recommendations: topCareers,
            summaryData: fullResults.summaryData || {
              topMatch: matchScore,
              averageMatch: 0,
              totalRecommendations: topCareers.length,
              suggestedNextSteps: [
                'Update your resume with relevant skills',
                'Network with professionals in your field',
                'Consider relevant certifications'
              ],
              timelineSuggestions: [
                'Focus on developing relevant skills (1-3 months)',
                'Build a professional network (3-6 months)',
                'Gain practical experience (6-12 months)'
              ]
            },
            userName: fullResults.userName || userName || 'User'
          },
          created_at: parsed.created_at || new Date().toISOString()
        };
        
        // Add to assessments array if not already there
        const exists = assessments.some(a => a.id === latestAssessment?.id);
        if (!exists && latestAssessment) {
          assessments = [latestAssessment, ...assessments];
          updateAssessmentPagination();
        }
        
        // Clear localStorage after loading
        localStorage.removeItem('latestAssessment');
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
  }

  // Load user profile from Supabase
  async function loadUserData() {
    try {
      isLoading = true;
      error = '';

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error('No user logged in');
      }

      // Try to get existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating new one...');
        
        // If profile doesn't exist, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
              last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
              email: user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Still set userProfile with basic info even if insert fails
          userProfile = {
            id: user.id,
            first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
            last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          userProfile = newProfile;
        }
      } else if (profileError) {
        throw profileError;
      } else {
        userProfile = profile;
      }

      if (userProfile) {
        editProfileData = {
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
          profile_picture: userProfile.profile_picture || ''
        };
      }

    } catch (err: any) {
      console.error('Error loading user data:', err);
      error = 'Failed to load user profile: ' + err.message;
      
      // Set basic user info even if there's an error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userProfile = {
          id: user.id,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    } finally {
      isLoading = false;
    }
  }

  // Initialize resume data with user profile and assessment
  function initializeResumeData() {
    if (!userProfile) return;
    
    resumeData.email = userProfile.email || '';
    resumeData.phone = userProfile.phone || '';
    resumeData.location = 'Your Location';
    resumeData.linkedin = 'linkedin.com/in/yourprofile';
    resumeData.portfolio = 'yourportfolio.com';
    
    // Clear existing skills before generating new ones
    resumeData.skills = [];
    
    // Generate skills based on assessment results
    if (latestAssessment) {
      generateSkillsFromAssessment();
    }
    
    // Generate professional summary based on assessment
    if (latestAssessment) {
      const topCareer = latestAssessment.top_careers?.[0];
      if (topCareer) {
        resumeData.summary = `Results-driven professional with strong alignment to ${topCareer.title} role. ${getExperienceLevelDescription(topCareer.experienceLevel ?? '')} Demonstrated strengths in ${topCareer.strengths?.slice(0, 3).join(', ') || 'relevant technical and interpersonal skills'}. Seeking opportunities to leverage expertise in ${topCareer.industry || 'the industry'} with a ${latestAssessment.match_score}% career match based on comprehensive assessment. Committed to ${getCareerGoal(topCareer.title)}`;
      } else {
        resumeData.summary = `Professional with strong career alignment based on comprehensive assessment. Achieved ${latestAssessment.match_score}% career match score. Seeking opportunities to leverage skills and experience in a suitable role.`;
      }
    } else {
      resumeData.summary = 'Experienced professional seeking new career opportunities. Skilled in various domains with a proven track record of success.';
    }
    
    // Add sample experience if none exists
    if (resumeData.experiences.length === 0) {
      // Generate relevant experience based on career
      const careerTitle = latestAssessment?.top_careers?.[0]?.title || 'Professional';
      resumeData.experiences = [{
        title: getRelevantJobTitle(careerTitle),
        company: 'Your Company',
        location: 'City, State', // FIXED: Added location field
        startDate: '2020-01',
        endDate: 'Present',
        current: true,
        description: getJobDescription(careerTitle)
      }];
    }
    
    // Add sample education if none exists - FIXED: Added location field
    if (resumeData.education.length === 0) {
      resumeData.education = [{
        degree: getRelevantDegree(latestAssessment?.top_careers?.[0]?.title ?? ''),
        institution: 'Your University',
        location: 'City, State', // This is now editable
        graduationDate: '2019-05',
        gpa: '3.5'
      }];
    }
    
    // Add certifications from assessment if available
    if (latestAssessment) {
      const topCareer = latestAssessment.top_careers?.[0];
      if (topCareer?.certificationPaths && topCareer.certificationPaths.length > 0) {
        resumeData.certifications = topCareer.certificationPaths.slice(0, 2).map((cert, index) => ({
          name: cert,
          issuer: 'Relevant Certifying Body',
          date: '2023'
        }));
      } else {
        // Suggest relevant certifications based on career
        resumeData.certifications = getRelevantCertifications(latestAssessment.top_careers?.[0]?.title).map(cert => ({
          name: cert,
          issuer: 'Certifying Organization',
          date: '2022'
        }));
      }
    } else {
      resumeData.certifications = [{
        name: 'Professional Certification',
        issuer: 'Certifying Organization',
        date: '2022'
      }];
    }
  }

  // Helper functions for resume generation
  function getExperienceLevelDescription(level: string): string {
    if (!level) return 'Skilled in ';
    
    const levelLower = level.toLowerCase();
    if (levelLower.includes('senior')) return 'Senior-level professional skilled in ';
    if (levelLower.includes('junior') || levelLower.includes('entry')) return 'Early-career professional skilled in ';
    if (levelLower.includes('mid')) return 'Mid-level professional skilled in ';
    return 'Skilled in ';
  }

  function getCareerGoal(careerTitle: string): string {
    const titleLower = (careerTitle || '').toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer')) {
      return 'delivering high-quality software solutions and driving technical innovation';
    } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
      return 'leveraging data insights to drive business decisions and optimize performance';
    } else if (titleLower.includes('design')) {
      return 'creating intuitive user experiences and visually compelling designs';
    } else if (titleLower.includes('manager')) {
      return 'leading teams to achieve organizational goals and deliver exceptional results';
    } else if (titleLower.includes('medical') || titleLower.includes('health')) {
      return 'providing excellent patient care and contributing to healthcare improvements';
    }
    return 'contributing to organizational success and professional growth';
  }

  function getRelevantJobTitle(careerTitle: string): string {
    const titleLower = (careerTitle || '').toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer')) {
      return 'Software Developer';
    } else if (titleLower.includes('data')) {
      return 'Data Analyst';
    } else if (titleLower.includes('design')) {
      return 'UX Designer';
    } else if (titleLower.includes('manager')) {
      return 'Project Manager';
    } else if (titleLower.includes('medical') || titleLower.includes('health')) {
      return 'Healthcare Professional';
    } else if (titleLower.includes('market')) {
      return 'Marketing Specialist';
    }
    return 'Professional Role';
  }

  function getJobDescription(careerTitle: string): string {
    const titleLower = (careerTitle || '').toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer')) {
      return 'Developed and maintained software applications using modern technologies.\nCollaborated with cross-functional teams to deliver features on schedule.\nImplemented best practices for code quality and testing.\nParticipated in code reviews and contributed to architectural decisions.';
    } else if (titleLower.includes('data')) {
      return 'Analyzed complex datasets to extract actionable insights for business decisions.\nCreated data visualizations and reports for stakeholders.\nDeveloped predictive models to improve business outcomes.\nCleaned and processed data for analysis using statistical methods.';
    } else if (titleLower.includes('design')) {
      return 'Designed user interfaces and experiences for digital products.\nConducted user research and usability testing to inform design decisions.\nCreated wireframes, prototypes, and design specifications.\nCollaborated with developers to ensure design implementation fidelity.';
    } else if (titleLower.includes('manager')) {
      return 'Led project teams to deliver successful outcomes within budget and timeline.\nManaged stakeholder communications and expectations.\nDeveloped project plans, tracked progress, and mitigated risks.\nCoordinated resources and facilitated team collaboration.';
    } else if (titleLower.includes('medical') || titleLower.includes('health')) {
      return 'Provided high-quality patient care following established protocols.\nDocumented patient information and treatment plans accurately.\nCollaborated with healthcare team members for comprehensive care.\nMaintained up-to-date knowledge of medical best practices.';
    }
    return 'Responsible for key duties and achievements in this role.\nManaged projects and collaborated with teams.\nImproved processes and increased efficiency.';
  }

  function getRelevantDegree(careerTitle: string): string {
    const titleLower = (careerTitle || '').toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('software')) {
      return "Bachelor of Science in Computer Science";
    } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
      return "Bachelor of Science in Data Science";
    } else if (titleLower.includes('design')) {
      return "Bachelor of Fine Arts in Design";
    } else if (titleLower.includes('medical') || titleLower.includes('health') || titleLower.includes('nurse')) {
      return "Bachelor of Science in Nursing";
    } else if (titleLower.includes('business') || titleLower.includes('manager')) {
      return "Bachelor of Business Administration";
    } else if (titleLower.includes('finance') || titleLower.includes('account')) {
      return "Bachelor of Science in Finance";
    }
    return "Bachelor's Degree in Relevant Field";
  }

  function getRelevantCertifications(careerTitle: string): string[] {
    const titleLower = (careerTitle || '').toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer')) {
      return ['AWS Certified Developer', 'Google Professional Cloud Developer'];
    } else if (titleLower.includes('data')) {
      return ['Google Data Analytics Professional', 'Microsoft Certified: Azure Data Scientist'];
    } else if (titleLower.includes('design')) {
      return ['Google UX Design Professional', 'Adobe Certified Professional'];
    } else if (titleLower.includes('project') || titleLower.includes('manager')) {
      return ['Project Management Professional (PMP)', 'Certified ScrumMaster'];
    } else if (titleLower.includes('medical') || titleLower.includes('health')) {
      return ['Basic Life Support (BLS) Certification', 'Certified Medical Assistant'];
    }
    return ['Professional Certification'];
  }

  // Helper function to get industry-specific skills
  function getIndustrySpecificSkills(industry: string): string[] {
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('tech') || industryLower.includes('software')) {
      return ['Agile Methodology', 'Scrum', 'Version Control', 'Code Review'];
    } else if (industryLower.includes('health') || industryLower.includes('medical')) {
      return ['Medical Ethics', 'Patient Privacy', 'HIPAA', 'Clinical Documentation'];
    } else if (industryLower.includes('finance') || industryLower.includes('banking')) {
      return ['Financial Regulation', 'Compliance', 'Risk Management', 'Investment Strategies'];
    } else if (industryLower.includes('education')) {
      return ['Curriculum Development', 'Instructional Design', 'Student Assessment', 'Classroom Management'];
    } else if (industryLower.includes('manufacturing')) {
      return ['Quality Control', 'Process Improvement', 'Safety Protocols', 'Supply Chain'];
    } else if (industryLower.includes('retail')) {
      return ['Customer Service', 'Sales Techniques', 'Inventory Management', 'Merchandising'];
    }
    
    return [];
  }

  // Load assessments from Supabase with proper history
  async function loadAssessments() {
    try {
      isLoading = true;
      error = '';

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const { assessments: assessmentData, latestAssessment: latest, error: assessmentError } = 
        await loadUserAssessments(supabase, user.id);

      if (assessmentError) {
        console.error('Assessment load error:', assessmentError);
        // Don't throw - just show empty state
        assessments = [];
        latestAssessment = null;
        updateAssessmentPagination();
        return;
      }

      assessments = assessmentData as Assessment[] || [];
      latestAssessment = latest as Assessment | null;
      updateAssessmentPagination();
      
    } catch (err: any) {
      console.error('Error loading assessments:', err);
      error = 'Failed to load assessments: ' + err.message;
      assessments = [];
      latestAssessment = null;
      updateAssessmentPagination();
    } finally {
      isLoading = false;
    }
  }

  // Update assessment pagination
  function updateAssessmentPagination() {
    totalAssessmentPages = Math.ceil(assessments.length / assessmentsPerPage);
    if (currentAssessmentPage > totalAssessmentPages && totalAssessmentPages > 0) {
      currentAssessmentPage = totalAssessmentPages;
    }
  }

  // Get paginated assessments for history
  function getPaginatedAssessments() {
    const startIndex = (currentAssessmentPage - 1) * assessmentsPerPage;
    const endIndex = startIndex + assessmentsPerPage;
    return assessments.slice(startIndex, endIndex);
  }

  // Delete specific assessment
  async function deleteAssessment(assessmentId: string) {
    try {
      isLoading = true;
      error = '';

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const result = await deleteAssessmentUtil(supabase, assessmentId, user.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      await loadAssessments();
      
      success = 'Assessment deleted successfully!';

      setTimeout(() => {
        success = '';
      }, 3000);

    } catch (err: any) {
      console.error('Error deleting assessment:', err);
      error = 'Failed to delete assessment: ' + err.message;
    } finally {
      isLoading = false;
      showDeleteConfirm = false;
      assessmentToDelete = null;
    }
  }

  // Confirm delete assessment
  function confirmDeleteAssessment(assessmentId: string) {
    assessmentToDelete = assessmentId;
    showDeleteConfirm = true;
  }

  // Cancel delete
  function cancelDelete() {
    showDeleteConfirm = false;
    assessmentToDelete = null;
  }

  async function startNewAssessment() {
    try {
      isLoading = true;
      success = 'Starting new assessment...';
      
      // Clear any existing assessment data
      localStorage.removeItem('latestAssessment');
      localStorage.removeItem('latestAssessmentResults');
      
      // Add a small delay to show the success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set a flag to indicate we're starting a new assessment
      localStorage.setItem('startNewAssessment', 'true');
      
      // Redirect to home page - App.svelte will detect the flag and redirect to preferences
      window.location.href = '/';
      
    } catch (err: any) {
      console.error('Error starting new assessment:', err);
      error = 'Failed to start new assessment: ' + err.message;
      isLoading = false;
    }
  }

  // Toggle sidebar
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function handleSidebarKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSidebar();
    }
  }

  // Toggle settings menu
  function toggleSettingsMenu() {
    showSettingsMenu = !showSettingsMenu;
  }

  function handleSettingsKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSettingsMenu();
    }
  }

  // Generate Resume function
  function openResumeGenerator() {
    if (!latestAssessment) {
      error = 'Please complete an assessment first to generate a resume';
      setTimeout(() => error = '', 3000);
      return;
    }
    showResumeModal = true;
    // Refresh skills based on latest assessment when opening modal
    if (latestAssessment) {
      generateSkillsFromAssessment();
    }
  }

  // Generate skills based on assessment results
  function generateSkillsFromAssessment() {
    if (!latestAssessment) return;
    
    const topCareer = latestAssessment.top_careers?.[0];
    if (!topCareer) return;
    
    const careerTitle = topCareer.title || '';
    const industry = topCareer.industry || '';
    const experienceLevel = topCareer.experienceLevel || '';
    
    let suggestedSkills: string[] = [];
    
    // Remove any existing skills before generating new ones
    resumeData.skills = [];
    
    // Define skill sets for different career fields
    const skillSets = {
      // Technology/Software Development
      'software': [
        'JavaScript/TypeScript', 'Python', 'Java', 'C++', 'React/Vue/Angular',
        'Node.js', 'Git/GitHub', 'REST APIs', 'Database Design', 'Agile/Scrum',
        'Testing/Debugging', 'System Architecture', 'Cloud Computing', 'DevOps',
        'CI/CD', 'Microservices', 'Containerization', 'Problem Solving', 'Code Review'
      ],
      
      // Data Science/Analytics
      'data': [
        'Python/R', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistical Modeling',
        'Data Visualization', 'Pandas/NumPy', 'TensorFlow/PyTorch', 'Big Data',
        'Data Cleaning', 'Predictive Modeling', 'Business Intelligence', 'Tableau/Power BI',
        'Data Mining', 'Statistical Analysis', 'Research Skills', 'Critical Thinking'
      ],
      
      // Design/UX
      'design': [
        'UI/UX Design', 'Figma/Adobe XD', 'Wireframing', 'Prototyping', 'User Research',
        'Design Systems', 'Visual Design', 'Typography', 'Color Theory', 'Illustration',
        'User Testing', 'Information Architecture', 'Interaction Design', 'Accessibility',
        'Responsive Design', 'Creative Thinking', 'Collaboration', 'Presentation Skills'
      ],
      
      // Business/Management
      'business': [
        'Project Management', 'Strategic Planning', 'Leadership', 'Team Management',
        'Budgeting/Financial Analysis', 'Market Research', 'Business Development',
        'Stakeholder Management', 'Communication', 'Negotiation', 'Problem Solving',
        'Data-Driven Decision Making', 'Process Improvement', 'Risk Management',
        'Change Management', 'Performance Metrics', 'Customer Relations'
      ],
      
      // Healthcare/Medical
      'healthcare': [
        'Patient Care', 'Medical Terminology', 'Clinical Procedures', 'Emergency Response',
        'Medical Documentation', 'Healthcare Protocols', 'Patient Assessment',
        'Treatment Planning', 'Medical Equipment', 'HIPAA Compliance', 'Anatomy/Physiology',
        'Pharmaceutical Knowledge', 'Laboratory Techniques', 'Medical Ethics',
        'Team Collaboration', 'Attention to Detail', 'Empathy', 'Stress Management'
      ],
      
      // Marketing/Sales
      'marketing': [
        'Digital Marketing', 'SEO/SEM', 'Social Media Marketing', 'Content Strategy',
        'Email Marketing', 'Marketing Analytics', 'Brand Management', 'Market Research',
        'Copywriting', 'CRM Systems', 'Sales Funnel Optimization', 'Customer Acquisition',
        'Conversion Rate Optimization', 'Public Relations', 'Advertising', 'Event Planning'
      ],
      
      // Finance/Accounting
      'finance': [
        'Financial Analysis', 'Accounting Principles', 'Budgeting/Forecasting',
        'Financial Modeling', 'Risk Assessment', 'Tax Compliance', 'Auditing',
        'Investment Analysis', 'Financial Reporting', 'Excel Advanced', 'QuickBooks',
        'GAAP/IFRS', 'Cash Flow Management', 'Portfolio Management', 'Regulatory Compliance'
      ]
    };
    
    // Determine which skill set to use based on career title and industry
    let selectedSkillSet: string[] = [];
    
    // Check career title for keywords
    const titleLower = careerTitle.toLowerCase();
    const industryLower = (industry || '').toLowerCase();
    
    if (titleLower.includes('developer') || titleLower.includes('engineer') || 
        titleLower.includes('programmer') || titleLower.includes('software') ||
        titleLower.includes('tech') || titleLower.includes('it')) {
      selectedSkillSet = skillSets.software;
    } else if (titleLower.includes('data') || titleLower.includes('analyst') || 
               titleLower.includes('scientist') || titleLower.includes('machine learning')) {
      selectedSkillSet = skillSets.data;
    } else if (titleLower.includes('design') || titleLower.includes('ux') || 
               titleLower.includes('ui') || titleLower.includes('creative')) {
      selectedSkillSet = skillSets.design;
    } else if (titleLower.includes('manager') || titleLower.includes('director') || 
               titleLower.includes('business') || titleLower.includes('operations')) {
      selectedSkillSet = skillSets.business;
    } else if (titleLower.includes('medical') || titleLower.includes('health') || 
               titleLower.includes('nurse') || titleLower.includes('doctor') ||
               titleLower.includes('therapist')) {
      selectedSkillSet = skillSets.healthcare;
    } else if (titleLower.includes('market') || titleLower.includes('sales') || 
               titleLower.includes('advertising')) {
      selectedSkillSet = skillSets.marketing;
    } else if (titleLower.includes('finance') || titleLower.includes('account') || 
               titleLower.includes('banking')) {
      selectedSkillSet = skillSets.finance;
    } else {
      // Default to a mix of general skills
      selectedSkillSet = [
        'Communication', 'Problem Solving', 'Teamwork', 'Time Management',
        'Adaptability', 'Critical Thinking', 'Attention to Detail', 'Leadership',
        'Project Management', 'Customer Service', 'Analytical Skills', 'Creativity',
        'Organization', 'Research Skills', 'Presentation Skills'
      ];
    }
    
    // Adjust skills based on experience level
    if (experienceLevel && (experienceLevel.toLowerCase().includes('senior') || 
        experienceLevel.toLowerCase().includes('lead') || 
        experienceLevel.toLowerCase().includes('manager'))) {
      // Add leadership and advanced skills
      suggestedSkills = [
        ...selectedSkillSet.filter(skill => !skill.toLowerCase().includes('basic')),
        'Strategic Planning',
        'Team Leadership',
        'Mentoring',
        'Process Optimization',
        'Stakeholder Management',
        'Budget Management',
        'Decision Making',
        'Cross-functional Collaboration'
      ];
    } else if (experienceLevel && (experienceLevel.toLowerCase().includes('junior') || 
               experienceLevel.toLowerCase().includes('entry'))) {
      // Focus on fundamental and learning skills
      suggestedSkills = [
        ...selectedSkillSet.filter(skill => 
          skill.toLowerCase().includes('basic') || 
          skill.toLowerCase().includes('fundamental') ||
          !skill.toLowerCase().includes('advanced') &&
          !skill.toLowerCase().includes('senior') &&
          !skill.toLowerCase().includes('leadership')
        ).slice(0, 10),
        'Eagerness to Learn',
        'Adaptability',
        'Attention to Detail',
        'Time Management',
        'Communication',
        'Team Collaboration'
      ];
    } else {
      // Mid-level - balanced mix
      suggestedSkills = selectedSkillSet;
    }
    
    // Add career-specific required skills
    if (topCareer.requiredSkills && topCareer.requiredSkills.length > 0) {
      suggestedSkills = [...suggestedSkills, ...topCareer.requiredSkills];
    }
    
    // Add strengths as skills (but filter out duplicates)
    if (topCareer.strengths && topCareer.strengths.length > 0) {
      const uniqueStrengths = topCareer.strengths.filter(
        strength => !suggestedSkills.some(skill => 
          skill.toLowerCase().includes(strength.toLowerCase()) || 
          strength.toLowerCase().includes(skill.toLowerCase())
        )
      );
      suggestedSkills = [...suggestedSkills, ...uniqueStrengths];
    }
    
    // Add industry-specific skills
    if (industry) {
      const industrySkills = getIndustrySpecificSkills(industry);
      suggestedSkills = [...suggestedSkills, ...industrySkills];
    }
    
    // Remove duplicates (case insensitive) and limit to 15 skills
    const uniqueSkills = [];
    const seenSkills = new Set();
    
    for (const skill of suggestedSkills) {
      const lowerSkill = skill.toLowerCase();
      if (!seenSkills.has(lowerSkill) && uniqueSkills.length < 15) {
        seenSkills.add(lowerSkill);
        uniqueSkills.push(skill);
      }
    }
    
    resumeData.skills = uniqueSkills;
  }

  // Add skill to resume
  function addSkill() {
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      resumeData.skills = [...resumeData.skills, newSkill.trim()];
      newSkill = '';
    }
  }

  function removeSkill(index: number) {
    resumeData.skills = resumeData.skills.filter((_, i) => i !== index);
  }

  // Add experience to resume - FIXED: This function now works properly
  function addExperience() {
    if (newExperience.title.trim() && newExperience.company.trim()) {
      resumeData.experiences = [...resumeData.experiences, { ...newExperience }];
      // Reset the form after adding
      newExperience = {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      };
    }
  }

  function removeExperience(index: number) {
    resumeData.experiences = resumeData.experiences.filter((_, i) => i !== index);
  }

  // Add education to resume - FIXED: This function now works properly
  function addEducation() {
    if (newEducation.degree.trim() && newEducation.institution.trim()) {
      resumeData.education = [...resumeData.education, { ...newEducation }];
      // Reset the form after adding
      newEducation = {
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: ''
      };
    }
  }

  function removeEducation(index: number) {
    resumeData.education = resumeData.education.filter((_, i) => i !== index);
  }

  // Add certification to resume - FIXED: This function now works properly
  function addCertification() {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      resumeData.certifications = [...resumeData.certifications, { ...newCertification }];
      // Reset the form after adding
      newCertification = {
        name: '',
        issuer: '',
        date: ''
      };
    }
  }

  function removeCertification(index: number) {
    resumeData.certifications = resumeData.certifications.filter((_, i) => i !== index);
  }

  // Generate PDF Resume using browser's print functionality
  async function generatePDFResume() {
    try {
      isGeneratingPDF = true;
      error = '';

      const resumeElement = document.getElementById('printable-resume');
      if (!resumeElement) {
        throw new Error('Resume content not found');
      }

      // Create a print-friendly version
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }

      // Generate print-friendly HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resume - ${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 40px;
                    line-height: 1.6;
                }
                
                .resume-print {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .resume-header-section {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #6366f1;
                }
                
                .resume-name {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 10px;
                    font-family: 'Poppins', sans-serif;
                }
                
                .resume-contact {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 15px;
                    font-size: 14px;
                    color: #475569;
                }
                
                .resume-contact span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .career-match-badge {
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .badge-label {
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .badge-value {
                    font-size: 20px;
                    font-weight: 700;
                }
                
                .badge-career {
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .resume-section-print {
                    margin-bottom: 24px;
                    page-break-inside: avoid;
                }
                
                .section-title-print {
                    font-size: 18px;
                    font-weight: 600;
                    color: #4f46e5;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .section-content-print {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #475569;
                }
                
                .skills-grid-print {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .skill-item-print {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                }
                
                .experience-item-print {
                    margin-bottom: 16px;
                    page-break-inside: avoid;
                }
                
                .experience-header-print {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 4px;
                }
                
                .experience-title-print {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .experience-date-print {
                    font-size: 12px;
                    color: #64748b;
                    white-space: nowrap;
                }
                
                .experience-company-print {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 8px;
                    font-style: italic;
                }
                
                .experience-description-print {
                    font-size: 14px;
                    color: #475569;
                    line-height: 1.5;
                }
                
                .experience-description-print p {
                    margin-bottom: 4px;
                }
                
                .education-item-print {
                    margin-bottom: 16px;
                }
                
                .education-header-print {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 4px;
                }
                
                .education-degree-print {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .education-date-print {
                    font-size: 12px;
                    color: #64748b;
                    white-space: nowrap;
                }
                
                .education-institution-print {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 4px;
                }
                
                .education-details-print {
                    font-size: 14px;
                    color: #64748b;
                }
                
                .certifications-list-print {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .certification-item-print {
                    font-size: 14px;
                    color: #475569;
                }
                
                .assessment-footer-print {
                    margin-top: 32px;
                    padding-top: 16px;
                    border-top: 1px dashed #e2e8f0;
                    font-size: 12px;
                    color: #94a3b8;
                    text-align: center;
                }
                
                .footer-note-print {
                    margin-bottom: 8px;
                    font-style: italic;
                }
                
                .footer-date-print {
                    color: #cbd5e1;
                }
                
                @media print {
                    body {
                        padding: 20px;
                    }
                    
                    .resume-print {
                        max-width: 100%;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .section-title-print {
                        page-break-after: avoid;
                    }
                    
                    .experience-item-print,
                    .education-item-print {
                        page-break-inside: avoid;
                    }
                }
                
                @page {
                    margin: 20mm;
                    size: A4;
                }
            </style>
        </head>
        <body>
            <div class="resume-print">
                ${resumeElement.outerHTML}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                };
            <\/script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      // Generate filename
      const userName = `${userProfile?.first_name || 'User'}_${userProfile?.last_name || ''}`.replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Resume_${userName}_${dateStr}.pdf`;

      success = 'Opening print dialog for resume...';
      setTimeout(() => success = '', 3000);

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      error = 'Failed to generate PDF: ' + err.message;
      setTimeout(() => error = '', 3000);
    } finally {
      isGeneratingPDF = false;
    }
  }

  // NEW: View career details with comprehensive information
  async function viewCareerDetails(career: CareerMatch) {
    try {
      careerDetailsLoading = true;
      selectedCareer = career;
      
      // Enhance career data with detailed descriptions if available
      const careerKey = career.title as keyof typeof careerDescriptions;
      if (careerDescriptions[careerKey]) {
        selectedCareer = {
          ...career,
          ...careerDescriptions[careerKey]
        };
      } else {
        // Generate generic description based on career title
        selectedCareer.description = `${career.title} is a professional role that ${generateGenericDescription(career.title)}`;
        selectedCareer.dailyTasks = generateGenericDailyTasks(career.title);
        selectedCareer.workEnvironment = generateGenericWorkEnvironment(career.title);
        selectedCareer.careerPath = generateGenericCareerPath(career.title);
      }
      
      showCareerDetails = true;
    } catch (err) {
      console.error('Error loading career details:', err);
      error = 'Failed to load career details';
      setTimeout(() => error = '', 3000);
    } finally {
      careerDetailsLoading = false;
    }
  }

  // Helper function to generate generic descriptions
  function generateGenericDescription(title: string): string {
    if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
      return 'involves designing, building, and maintaining software solutions. Professionals in this field use programming skills to create applications and systems that solve problems and improve efficiency.';
    } else if (title.toLowerCase().includes('manager')) {
      return 'involves leading teams, overseeing projects, and ensuring organizational goals are met. This role requires strong leadership, communication, and strategic planning skills.';
    } else if (title.toLowerCase().includes('analyst')) {
      return 'involves examining data, identifying patterns, and providing insights to support decision-making. Professionals in this field help organizations understand trends and make data-driven choices.';
    } else if (title.toLowerCase().includes('designer')) {
      return 'focuses on creating visually appealing and functional designs. This role combines creativity with technical skills to develop products, interfaces, or experiences that meet user needs.';
    } else if (title.toLowerCase().includes('marketing')) {
      return 'involves promoting products or services, analyzing market trends, and developing strategies to reach target audiences. This role combines creativity with analytical thinking.';
    } else {
      return 'is a professional position that requires specific skills and expertise. Success in this role depends on a combination of technical knowledge, soft skills, and industry experience.';
    }
  }

  function generateGenericDailyTasks(title: string): string[] {
    if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
      return [
        'Writing and testing code',
        'Debugging software issues',
        'Collaborating with team members',
        'Attending planning meetings',
        'Documenting code and processes'
      ];
    } else if (title.toLowerCase().includes('manager')) {
      return [
        'Leading team meetings',
        'Planning and organizing projects',
        'Monitoring progress and performance',
        'Communicating with stakeholders',
        'Problem-solving and decision-making'
      ];
    } else {
      return [
        'Completing assigned tasks',
        'Collaborating with colleagues',
        'Attending meetings',
        'Reporting on progress',
        'Continuing professional development'
      ];
    }
  }

  function generateGenericWorkEnvironment(title: string): string {
    if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
      return 'Office-based or remote work, often in tech companies or organizations with digital products. Collaborative environment with regular team interactions.';
    } else if (title.toLowerCase().includes('manager')) {
      return 'Office environment with team leadership responsibilities. May involve travel and regular meetings with different departments or clients.';
    } else {
      return 'Professional office environment with standard business hours. May involve hybrid or remote work options depending on the organization.';
    }
  }

  function generateGenericCareerPath(title: string): string[] {
    return [
      'Entry-level position',
      'Mid-level specialist',
      'Senior professional',
      'Team lead or supervisor',
      'Management or director role'
    ];
  }

  // Add function to generate skills for a specific career
  function generateSkillsForCareer(career: CareerMatch) {
    // Temporarily set this career as the top career for skill generation
    const originalCareer = latestAssessment?.top_careers?.[0];
    
    if (latestAssessment) {
      // Create a temporary assessment with this career as top match
      const tempAssessment = {
        ...latestAssessment,
        top_careers: [career, ...(latestAssessment.top_careers || []).filter(c => c.title !== career.title)]
      };
      
      // Save original and set temp
      const originalLatest = latestAssessment;
      latestAssessment = tempAssessment;
      
      // Generate skills
      generateSkillsFromAssessment();
      
      // Restore original
      latestAssessment = originalLatest;
      
      // Open resume modal
      showResumeModal = true;
      
      success = `Skills generated for ${career.title} career path`;
      setTimeout(() => success = '', 3000);
    }
  }

  // Close career details modal
  function closeCareerDetails() {
    showCareerDetails = false;
    selectedCareer = null;
  }

  // Update user profile
  async function updateProfile() {
    try {
      if (!userProfile) return;

      isLoading = true;
      error = '';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: editProfileData.first_name,
          last_name: editProfileData.last_name,
          phone: editProfileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      userProfile.first_name = editProfileData.first_name;
      userProfile.last_name = editProfileData.last_name;
      userProfile.phone = editProfileData.phone;
      
      success = 'Profile updated successfully!';
      showEditProfile = false;

      setTimeout(() => {
        success = '';
      }, 3000);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      error = 'Failed to update profile: ' + err.message;
      setTimeout(() => error = '', 3000);
    } finally {
      isLoading = false;
    }
  }

  // Format date for display
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Unknown date';
    }
  }

  // Format time for display
  function formatTime(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Unknown time';
    }
  }

  // Format short date
  function formatShortDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return '--';
    }
  }

  // Close settings menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.settings-menu') && !target.closest('.settings-trigger')) {
      showSettingsMenu = false;
    }
    if (!target.closest('.career-details-modal') && !target.closest('.career-card-trigger')) {
      showCareerDetails = false;
    }
  }

  // Add click outside listener
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="dashboard-page">
  <!-- Background Elements -->
  <div class="background-elements">
    <div class="bg-gradient"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
  </div>

  <!-- Toast Notifications -->
  {#if error}
    <div class="toast error" transition:fade>
      <div class="toast-icon">
        <i class="fa-solid fa-exclamation-circle"></i>
      </div>
      <span class="toast-message">{error}</span>
      <button 
        class="toast-close" 
        on:click={() => error = ''} 
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { error = ''; } }} 
        aria-label="Dismiss error message"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  {/if}

  {#if success}
    <div class="toast success" transition:fade>
      <div class="toast-icon">
        <i class="fa-solid fa-check-circle"></i>
      </div>
      <span class="toast-message">{success}</span>
      <button 
        class="toast-close" 
        on:click={() => success = ''} 
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { success = ''; } }} 
        aria-label="Dismiss success message"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm && assessmentToDelete}
    <div class="modal-overlay" transition:fade>
      <div class="modal delete-confirm-modal" transition:scale>
        <div class="modal-header">
          <h3>Delete Assessment</h3>
          <button 
            class="modal-close" 
            on:click={cancelDelete}
            aria-label="Close modal"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-confirm-content">
            <i class="fa-solid fa-trash-can"></i>
            <h4>Are you sure?</h4>
            <p>This assessment will be permanently deleted. This action cannot be undone.</p>
          </div>
          <div class="form-actions">
            <button 
              type="button" 
              class="btn-secondary" 
              on:click={cancelDelete}
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn-danger" 
              on:click={() => deleteAssessment(assessmentToDelete!)}
              disabled={isLoading}
              aria-label="{isLoading ? 'Deleting...' : 'Delete assessment'}"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- NEW: Career Details Modal -->
  {#if showCareerDetails && selectedCareer}
    <div class="modal-overlay career-details-overlay" transition:fade>
      <div class="modal career-details-modal" transition:scale>
        <div class="modal-header">
          <div class="career-modal-title">
            <div class="career-match-badge-small">
              <span class="match-badge-value">{selectedCareer.matchPercentage || selectedCareer.matchPercentage || 'N/A'}% Match</span>
            </div>
            <h3>{selectedCareer.title}</h3>
          </div>
          <button 
            class="modal-close" 
            on:click={closeCareerDetails}
            aria-label="Close career details"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div class="modal-body career-details-body">
          {#if careerDetailsLoading}
            <div class="loading-spinner-small">
              <div class="spinner"></div>
              <p>Loading career details...</p>
            </div>
          {:else}
            <div class="career-details-content">
              <!-- Career Overview -->
              <div class="career-section">
                <h4><i class="fa-solid fa-info-circle"></i> Career Overview</h4>
                <p class="career-description-text">{selectedCareer.description || 'No description available.'}</p>
                
                <div class="career-quick-facts">
                  {#if selectedCareer.industry}
                    <div class="quick-fact">
                      <i class="fa-solid fa-industry"></i>
                      <span class="fact-label">Industry:</span>
                      <span class="fact-value">{selectedCareer.industry}</span>
                    </div>
                  {/if}
                  {#if selectedCareer.experienceLevel}
                    <div class="quick-fact">
                      <i class="fa-solid fa-chart-line"></i>
                      <span class="fact-label">Level:</span>
                      <span class="fact-value">{selectedCareer.experienceLevel}</span>
                    </div>
                  {/if}
                  {#if selectedCareer.salary}
                    <div class="quick-fact">
                      <i class="fa-solid fa-money-bill-wave"></i>
                      <span class="fact-label">Salary Range:</span>
                      <span class="fact-value">{selectedCareer.salary}</span>
                    </div>
                  {/if}
                  {#if selectedCareer.educationRequired}
                    <div class="quick-fact">
                      <i class="fa-solid fa-graduation-cap"></i>
                      <span class="fact-label">Education:</span>
                      <span class="fact-value">{selectedCareer.educationRequired}</span>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Daily Tasks & Responsibilities -->
              <div class="career-section">
                <h4><i class="fa-solid fa-tasks"></i> Daily Tasks & Responsibilities</h4>
                {#if selectedCareer.dailyTasks && selectedCareer.dailyTasks.length > 0}
                  <ul class="tasks-list">
                    {#each selectedCareer.dailyTasks as task}
                      <li><i class="fa-solid fa-check-circle"></i> {task}</li>
                    {/each}
                  </ul>
                {:else if selectedCareer.responsibilities}
                  <p class="responsibilities-text">{selectedCareer.responsibilities}</p>
                {:else}
                  <p class="no-info">No daily tasks information available.</p>
                {/if}
              </div>

              <!-- Required Skills -->
              <div class="career-section">
                <h4><i class="fa-solid fa-tools"></i> Required Skills</h4>
                {#if selectedCareer.requiredSkills && selectedCareer.requiredSkills.length > 0}
                  <div class="skills-container">
                    {#each selectedCareer.requiredSkills as skill}
                      <span class="skill-tag-detail">{skill}</span>
                    {/each}
                  </div>
                {:else if selectedCareer.strengths && selectedCareer.strengths.length > 0}
                  <div class="skills-container">
                    {#each selectedCareer.strengths as strength}
                      <span class="skill-tag-detail">{strength}</span>
                    {/each}
                  </div>
                {:else}
                  <p class="no-info">No skills information available.</p>
                {/if}
              </div>

              <!-- Work Environment -->
              {#if selectedCareer.workEnvironment}
                <div class="career-section">
                  <h4><i class="fa-solid fa-building"></i> Work Environment</h4>
                  <p class="environment-text">{selectedCareer.workEnvironment}</p>
                </div>
              {/if}

              <!-- Career Path -->
              {#if selectedCareer.careerPath && selectedCareer.careerPath.length > 0}
                <div class="career-section">
                  <h4><i class="fa-solid fa-route"></i> Career Path & Progression</h4>
                  <div class="career-path-timeline">
                    {#each selectedCareer.careerPath as step, index}
                      <div class="path-step">
                        <div class="step-number">{index + 1}</div>
                        <div class="step-content">
                          <div class="step-title">{step}</div>
                          {#if index === 0}
                            <div class="step-duration">Entry-level (0-2 years)</div>
                          {:else if index === 1}
                            <div class="step-duration">Mid-level (2-5 years)</div>
                          {:else if index === 2}
                            <div class="step-duration">Senior (5-8 years)</div>
                          {:else if index === 3}
                            <div class="step-duration">Lead/Manager (8+ years)</div>
                          {:else}
                            <div class="step-duration">Executive/Strategic</div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Skills to Develop -->
              {#if selectedCareer.skillsToDevelop && selectedCareer.skillsToDevelop.length > 0}
                <div class="career-section">
                  <h4><i class="fa-solid fa-lightbulb"></i> Skills to Develop</h4>
                  <div class="skills-container">
                    {#each selectedCareer.skillsToDevelop as skill}
                      <span class="skill-tag-develop">{skill}</span>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Certifications -->
              {#if selectedCareer.certificationPaths && selectedCareer.certificationPaths.length > 0}
                <div class="career-section">
                  <h4><i class="fa-solid fa-certificate"></i> Recommended Certifications</h4>
                  <ul class="certifications-list">
                    {#each selectedCareer.certificationPaths as cert}
                      <li><i class="fa-solid fa-award"></i> {cert}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Match Reasons -->
              {#if selectedCareer.matchReason}
                <div class="career-section match-reason-section">
                  <h4><i class="fa-solid fa-thumbs-up"></i> Why This Career Matches You</h4>
                  <div class="match-reason-content">
                    <div class="match-reason-icon">
                      <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="match-reason-text">{selectedCareer.matchReason}</p>
                  </div>
                </div>
              {/if}

              <!-- Action Buttons -->
              <div class="career-action-buttons">
                <button class="btn-primary" on:click={() => generateSkillsForCareer(selectedCareer!)}>
                  <i class="fa-solid fa-file-lines"></i> Generate Resume for This Career
                </button>
                <button class="btn-secondary" on:click={closeCareerDetails}>
                  <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Fixed Sidebar -->
  <aside class="sidebar {sidebarOpen ? 'open' : 'closed'}">
    <!-- Sidebar Header - Always show logo and toggle -->
    <div class="sidebar-header">
      <div class="logo-container">
        <img src="/logo1-Photoroom.png" alt="CareerGeenie" class="logo-image" />
        {#if sidebarOpen}
          <span class="brand-name">CareerGeenie</span>
        {/if}
      </div>
      <button 
        class="sidebar-toggle" 
        on:click={toggleSidebar}
        on:keydown={handleSidebarKeydown}
        aria-label="{sidebarOpen ? 'Close sidebar' : 'Open sidebar'}"
      >
        <i class="fa-solid {sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}"></i>
      </button>
    </div>

    <!-- Content that only shows when sidebar is open -->
    {#if sidebarOpen}
      <!-- New Assessment Button at the top of sidebar -->
      <div class="new-assessment-sidebar">
        <button 
          class="new-assessment-btn-sidebar"
          on:click={startNewAssessment}
          aria-label="Create new assessment"
          disabled={isLoading}
        >
          <i class="fa-solid fa-plus"></i>
          <span>{isLoading ? 'Loading...' : 'New Assessment'}</span>
        </button>
      </div>

      <!-- Assessment History Navigation -->
      <nav class="assessment-history-nav" aria-label="Assessment history navigation">
        <div class="nav-section">
          <div class="nav-section-title">Assessment History</div>
          {#if getPaginatedAssessments().length > 0}
            {#each getPaginatedAssessments() as assessment, index}
              <div class="nav-item-wrapper">
                <button 
                  class="nav-item"
                  on:click={() => {
                    latestAssessment = assessment;
                  }}
                  aria-label="View {assessment.top_careers[0]?.title || 'Untitled Assessment'} assessment"
                >
                  <div class="nav-icon">
                    <i class="fa-solid {index === 0 && currentAssessmentPage === 1 ? 'fa-star' : 'fa-file-alt'}"></i>
                  </div>
                  <div class="nav-content">
                    <span class="nav-title">
                      {assessment.top_careers[0]?.title || assessment.full_results?.recommendations[0]?.title || 'Untitled Assessment'}
                    </span>
                    <span class="nav-subtitle">
                      {formatShortDate(assessment.date || assessment.created_at)} • {assessment.match_score}%
                    </span>
                  </div>
                </button>
                {#if !(index === 0 && currentAssessmentPage === 1)}
                  <button 
                    class="nav-item-delete"
                    on:click={() => confirmDeleteAssessment(assessment.id)}
                    aria-label="Delete this assessment"
                    title="Delete assessment"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                {/if}
              </div>
            {/each}
            
            <!-- Pagination Controls - Only show if more than one page -->
            {#if totalAssessmentPages > 1}
              <div class="assessment-pagination">
                <button 
                  class="pagination-btn {currentAssessmentPage === 1 ? 'disabled' : ''}"
                  on:click={() => currentAssessmentPage > 1 && currentAssessmentPage--}
                  disabled={currentAssessmentPage === 1}
                  aria-label="Previous page"
                >
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                  Page {currentAssessmentPage} of {totalAssessmentPages}
                </span>
                
                <button 
                  class="pagination-btn {currentAssessmentPage === totalAssessmentPages ? 'disabled' : ''}"
                  on:click={() => currentAssessmentPage < totalAssessmentPages && currentAssessmentPage++}
                  disabled={currentAssessmentPage === totalAssessmentPages}
                  aria-label="Next page"
                >
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            {/if}
          {:else}
            <div class="empty-history">
              <i class="fa-solid fa-clipboard-question"></i>
              <span class="empty-text">No assessments yet</span>
            </div>
          {/if}
        </div>
      </nav>

      <!-- User Section at Bottom with Profile Circle -->
      <div class="user-section">
        <div class="user-profile-container">
          <div class="user-info">
            <div class="profile-circle">
              {#if userProfile?.profile_picture}
                <img 
                  src={userProfile.profile_picture} 
                  alt="" 
                  class="profile-image"
                />
              {:else}
                <div class="profile-initials">
                  {(userProfile?.first_name?.[0] || 'U')}{(userProfile?.last_name?.[0] || '')}
                </div>
              {/if}
            </div>
            <div class="user-details">
              <span class="user-name">{userProfile?.first_name || 'User'} {userProfile?.last_name || ''}</span>
              <!-- Only show username, not email -->
            </div>
          </div>
          
          <div class="settings-container">
            <button 
              class="settings-trigger" 
              on:click={toggleSettingsMenu}
              on:keydown={handleSettingsKeydown}
              aria-label="Open settings menu"
              aria-expanded={showSettingsMenu}
            >
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <!-- Settings Dropdown Menu -->
            {#if showSettingsMenu}
              <div class="settings-menu" transition:fade role="menu">
                <button 
                  class="settings-item"
                  on:click={() => { showEditProfile = true; showSettingsMenu = false; }}
                  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { showEditProfile = true; showSettingsMenu = false; } }}
                  aria-label="Edit profile"
                >
                  <i class="fa-solid fa-user-pen"></i>
                  <span>Edit Profile</span>
                </button>
                <button 
                  class="settings-item"
                  on:click={() => { openResumeGenerator(); showSettingsMenu = false; }}
                  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openResumeGenerator(); showSettingsMenu = false; } }}
                  disabled={!latestAssessment}
                  aria-label="Generate professional resume"
                >
                  <i class="fa-solid fa-file-lines"></i>
                  <span>Generate Resume</span>
                </button>
                <div class="settings-divider"></div>
                <button 
                  class="settings-item logout"
                  on:click={handleLogout}
                  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleLogout(); } }}
                  disabled={isLoading}
                  aria-label="{isLoading ? 'Logging out...' : 'Logout'}"
                >
                  <i class="fa-solid fa-sign-out-alt"></i>
                  <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- Mini version when sidebar is closed -->
      <div class="sidebar-mini-content">
        <!-- Plus button for new assessment when sidebar is closed -->
        <button 
          class="new-assessment-mini"
          on:click={startNewAssessment}
          aria-label="Create new assessment"
          title="New Assessment"
          disabled={isLoading}
        >
          <i class="fa-solid fa-plus"></i>
        </button>
        
        <!-- Mini navigation for closed sidebar -->
        <div class="sidebar-nav-mini">
          {#each assessments.slice(0, 5) as assessment, index}
            <button 
              class="nav-item-mini {index === 0 ? 'active' : ''}" 
              on:click={() => {
                latestAssessment = assessment;
                sidebarOpen = true;
              }}
              title="{assessment.top_careers[0]?.title || 'Assessment'}"
              aria-label="View {assessment.top_careers[0]?.title || 'Assessment'} assessment"
            >
              <i class="fa-solid {index === 0 ? 'fa-star' : 'fa-file-alt'}"></i>
              {#if index === 0}
                <span class="nav-badge-mini">{assessment.match_score}%</span>
              {/if}
            </button>
          {/each}
        </div>
        
        <!-- Mini user profile for closed sidebar -->
        <div class="user-mini">
          <div class="profile-circle-mini">
            {#if userProfile?.profile_picture}
              <img 
                src={userProfile.profile_picture} 
                alt="" 
                class="profile-image-mini"
              />
            {:else}
              <div class="profile-initials-mini">
                {(userProfile?.first_name?.[0] || 'U')}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </aside>

  <!-- Main Content -->
  <main class="main-content {sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}">
    <!-- Header -->
    <header class="main-header">
      <div class="header-left">
        <button 
          class="sidebar-toggle-mobile" 
          on:click={toggleSidebar}
          on:keydown={handleSidebarKeydown}
          aria-label="Toggle sidebar"
        >
          <i class="fa-solid {sidebarOpen ? 'fa-times' : 'fa-bars'}"></i>
        </button>
        <div class="header-title">
          <i class="fa-solid fa-chart-line header-icon"></i>
          <h1>Career Dashboard</h1>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    {#if isLoading && !showResumeModal && !showEditProfile && !showDeleteConfirm && !showCareerDetails}
      <div class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    {/if}

    <!-- Scrollable Dashboard Content -->
    <div class="dashboard-scroll-container">
      <div class="dashboard-content">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="welcome-content">
            <h2>Welcome back, {userProfile?.first_name || 'User'}!</h2>
            <p class="welcome-subtitle">Your personalized career insights and recommendations</p>
          </div>
          {#if assessments.length > 0}
            <div class="welcome-stats">
              <div class="stat-badge">
                <i class="fa-solid fa-chart-bar"></i>
                <span>{assessments.length} Assessments</span>
              </div>
              <div class="stat-badge">
                <i class="fa-solid fa-percentage"></i>
                <span>
                  {#if assessments.length > 0}
                    {Math.round(assessments.reduce((sum, a) => sum + a.match_score, 0) / assessments.length)}% Avg Match
                  {:else}
                    0% Avg Match
                  {/if}
                </span>
              </div>
            </div>
          {/if}
        </div>

        <!-- Latest Assessment Results -->
        <div class="latest-results-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fa-solid fa-trophy"></i>
              <h3>Latest Assessment Results</h3>
            </div>
            {#if latestAssessment}
              <button class="new-assessment-btn" on:click={startNewAssessment} disabled={isLoading}>
                <i class="fa-solid fa-plus"></i> New Assessment
              </button>
            {/if}
          </div>
          
          {#if latestAssessment}
            <div class="latest-assessment-card">
              <div class="match-score-display">
                <div class="score-circle">
                  <span class="score-value">{latestAssessment.match_score}%</span>
                  <span class="score-label">Match</span>
                </div>
                <div class="score-details">
                  <h4 class="career-title">
                    {latestAssessment.top_careers[0]?.title || latestAssessment.full_results?.recommendations[0]?.title || 'Career Match'}
                  </h4>
                  <p class="career-description">
                    Based on your skills assessment completed on {formatDate(latestAssessment.date || latestAssessment.created_at)}
                  </p>
                  <div class="assessment-meta">
                    <span class="meta-item">
                      <i class="fa-solid fa-calendar"></i>
                      {formatShortDate(latestAssessment.date || latestAssessment.created_at)}
                    </span>
                    <span class="meta-item">
                      <i class="fa-solid fa-clock"></i>
                      {formatTime(latestAssessment.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="result-actions">
                <button class="action-btn primary" on:click={openResumeGenerator}>
                  <i class="fa-solid fa-file-lines"></i> Generate Resume
                </button>
                <button class="action-btn secondary career-card-trigger" on:click={() => {
                  if (latestAssessment && latestAssessment.top_careers[0]) {
                    viewCareerDetails(latestAssessment.top_careers[0]);
                  }
                }}>
                  <i class="fa-solid fa-eye"></i> View Career Details
                </button>
              </div>
            </div>
          {:else}
            <div class="no-assessment-card">
              <div class="no-assessment-content">
                <i class="fa-solid fa-clipboard-question"></i>
                <h4>No Assessment Results</h4>
                <p>Complete your first assessment to see your career path results</p>
                <button class="start-assessment-btn" on:click={startNewAssessment} disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Your First Assessment'}
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Career Matches Grid -->
        {#if latestAssessment && (latestAssessment.top_careers?.length > 0 || latestAssessment.full_results?.recommendations?.length > 0)}
          <div class="career-matches-section">
            <div class="section-header">
              <div class="section-title">
                <i class="fa-solid fa-briefcase"></i>
                <h3>Top Career Matches</h3>
              </div>
              <span class="section-subtitle">Click on any career to learn more about what the job involves</span>
            </div>
            
            <div class="career-matches-grid">
              {#each (latestAssessment.top_careers || latestAssessment.full_results?.recommendations || []).slice(0, 4) as career, index}
                <button type="button"
                        class="career-match-card career-card-trigger"
                        style="--card-gradient: {career.gradient || (index === 0 ? 'linear-gradient(135deg, #6366f1, #818cf8)' : index === 1 ? 'linear-gradient(135deg, #10b981, #34d399)' : index === 2 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #ec4899, #f472b6)')}"
                        on:click={() => viewCareerDetails(career)}
                        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewCareerDetails(career); } }}
                        aria-label="View details for {career.title}">
                  <div class="match-rank">#{index + 1}</div>
                  <div class="match-content">
                    <div class="match-header">
                      <h4>{career.title}</h4>
                      <span class="match-percentage">{career.matchPercentage || Math.max(0, (latestAssessment?.match_score || 0) - (index * 15))}% Match</span>
                    </div>
                    <div class="match-details">
                      {#if career.industry}
                        <div class="detail-item">
                          <i class="fa-solid fa-industry"></i>
                          <span>{career.industry}</span>
                        </div>
                      {/if}
                      {#if career.salary}
                        <div class="detail-item">
                          <i class="fa-solid fa-money-bill-wave"></i>
                          <span>{career.salary}</span>
                        </div>
                      {/if}
                      {#if career.experienceLevel}
                        <div class="detail-item">
                          <i class="fa-solid fa-chart-line"></i>
                          <span>{career.experienceLevel}</span>
                        </div>
                      {/if}
                    </div>
                    {#if career.strengths && career.strengths.length > 0}
                      <div class="match-strengths">
                        <strong>Strengths:</strong>
                        <div class="strengths-list">
                          {#each career.strengths.slice(0, 2) as strength}
                            <span class="strength-tag">{strength}</span>
                          {/each}
                          {#if career.strengths.length > 2}
                            <span class="strength-tag">+{career.strengths.length - 2} more</span>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  </div>
                  <div class="match-actions">
                    <span 
                      class="view-details-btn" 
                      role="button"
                      tabindex="0"
                      on:click|stopPropagation={() => viewCareerDetails(career)}
                      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewCareerDetails(career); } }}
                      aria-label="View details for {career.title}"
                    >
                      <i class="fa-solid fa-arrow-right"></i>
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Metrics Grid -->
        <div class="metrics-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fa-solid fa-chart-pie"></i>
              <h3>Your Career Metrics</h3>
            </div>
          </div>
          
          <div class="metrics-grid">
            <!-- Total Assessments -->
            <div class="metric-card">
              <div class="metric-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
                <i class="fa-solid fa-chart-bar"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">{assessments.length}</div>
                <div class="metric-label">Total Assessments</div>
              </div>
            </div>

            <!-- Average Match Score -->
            <div class="metric-card">
              <div class="metric-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
                <i class="fa-solid fa-percentage"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">
                  {#if assessments.length > 0}
                    {Math.round(assessments.reduce((sum, a) => sum + a.match_score, 0) / assessments.length)}%
                  {:else}
                    0%
                  {/if}
                </div>
                <div class="metric-label">Average Match</div>
              </div>
            </div>

            <!-- Last Assessment Date -->
            <div class="metric-card">
              <div class="metric-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">
                  {#if latestAssessment}
                    {formatShortDate(latestAssessment.date || latestAssessment.created_at)}
                  {:else}
                    --
                  {/if}
                </div>
                <div class="metric-label">Last Assessment</div>
              </div>
            </div>

            <!-- Top Career Field -->
            <div class="metric-card">
              <div class="metric-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6)">
                <i class="fa-solid fa-briefcase"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">
                  {#if latestAssessment && (latestAssessment.top_careers?.length > 0 || latestAssessment.full_results?.recommendations?.length > 0)}
                    {(latestAssessment.top_careers[0]?.title || latestAssessment.full_results?.recommendations[0]?.title || '').split(' ')[0]}
                  {:else}
                    --
                  {/if}
                </div>
                <div class="metric-label">Top Career</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stats-card">
              <div class="stats-header">
                <h4><i class="fa-solid fa-chart-line"></i> Assessment Overview</h4>
              </div>
              <div class="stats-content">
                <div class="stat-item">
                  <span class="stat-label">Highest Match:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      {Math.max(...assessments.map(a => a.match_score))}%
                    {:else}
                      --
                    {/if}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Lowest Match:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      {Math.min(...assessments.map(a => a.match_score))}%
                    {:else}
                      --
                    {/if}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Assessments This Month:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      {assessments.filter(a => {
                        const assessmentDate = new Date(a.created_at);
                        const now = new Date();
                        return assessmentDate.getMonth() === now.getMonth() && 
                              assessmentDate.getFullYear() === now.getFullYear();
                      }).length}
                    {:else}
                      0
                    {/if}
                  </span>
                </div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-header">
                <h4><i class="fa-solid fa-trend-up"></i> Progress Summary</h4>
              </div>
              <div class="stats-content">
                <div class="stat-item">
                  <span class="stat-label">Career Paths Explored:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      {new Set(assessments.flatMap(a => [...(a.top_careers || []), ...(a.full_results?.recommendations || [])].map(c => c.title))).size}
                    {:else}
                      0
                    {/if}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Skills Identified:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      {new Set(assessments.flatMap(a => 
                        [...(a.top_careers || []), ...(a.full_results?.recommendations || [])].flatMap(c => c.requiredSkills || [])
                      )).size}
                    {:else}
                      0
                    {/if}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completion Rate:</span>
                  <span class="stat-value">
                    {#if assessments.length > 0}
                      100%
                    {:else}
                      0%
                    {/if}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Plan -->
            {#if latestAssessment && latestAssessment.full_results?.summaryData}
              <div class="stats-card">
                <div class="stats-header">
                  <h4><i class="fa-solid fa-list-check"></i> Your Action Plan</h4>
                </div>
                <div class="stats-content">
                  <div class="action-items">
                    {#each latestAssessment.full_results.summaryData.suggestedNextSteps.slice(0, 3) as step, index}
                      <div class="action-item">
                        <div class="action-number">{index + 1}</div>
                        <span class="action-text">{step}</span>
                      </div>
                    {/each}
                  </div>
                  <div class="action-plan-footer">
                    <button class="view-full-plan" on:click={openResumeGenerator}>
                      View Full Plan <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="dashboard-footer">
        <div class="footer-content">
          <p>© 2024 CareerGeenie. All rights reserved.</p>
          <nav class="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/help">Help</a>
          </nav>
        </div>
      </footer>
    </div>
  </main>
  <!-- Modals -->
  <!-- Edit Profile Modal -->
  {#if showEditProfile}
    <div class="modal-overlay" transition:fade>
      <div class="modal" transition:scale>
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button 
            class="modal-close" 
            on:click={() => showEditProfile = false}
            aria-label="Close modal"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <form class="profile-form" on:submit|preventDefault={updateProfile}>
            <div class="form-group">
              <label for="first-name">First Name</label>
              <input 
                id="first-name" 
                type="text" 
                bind:value={editProfileData.first_name} 
                required 
                aria-required="true"
              />
            </div>
            <div class="form-group">
              <label for="last-name">Last Name</label>
              <input 
                id="last-name" 
                type="text" 
                bind:value={editProfileData.last_name} 
                required 
                aria-required="true"
              />
            </div>
            <div class="form-group">
              <label for="phone">Phone</label>
              <input 
                id="phone" 
                type="tel" 
                bind:value={editProfileData.phone} 
                aria-label="Phone number (optional)"
              />
            </div>
            <div class="form-actions">
              <button 
                type="button" 
                class="btn-secondary" 
                on:click={() => showEditProfile = false}
                aria-label="Cancel editing profile"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn-primary" 
                disabled={isLoading}
                aria-label="{isLoading ? 'Saving profile changes...' : 'Save profile changes'}"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}

  <!-- Resume Generator Modal -->
  {#if showResumeModal}
    <div class="modal-overlay resume-modal-overlay" transition:fade>
      <div class="resume-modal" transition:scale>
        <div class="resume-modal-header">
          <div class="resume-title">
            <i class="fa-solid fa-file-lines"></i>
            <h2>Generate Professional Resume</h2>
          </div>
          <button 
            class="modal-close" 
            on:click={() => showResumeModal = false}
            aria-label="Close resume generator"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div class="resume-modal-body">
          <!-- Resume Builder Section -->
          <div class="resume-builder-section">
            <h3><i class="fa-solid fa-edit"></i> Customize Your Resume</h3>
            
            <!-- Contact Information -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-address-card"></i> Contact Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="resume-email">Email</label>
                  <input 
                    id="resume-email"
                    type="email" 
                    bind:value={resumeData.email} 
                    placeholder="your.email@example.com" 
                  />
                </div>
                <div class="form-group">
                  <label for="resume-phone">Phone</label>
                  <input 
                    id="resume-phone"
                    type="tel" 
                    bind:value={resumeData.phone} 
                    placeholder="(123) 456-7890" 
                  />
                </div>
                <div class="form-group">
                  <label for="resume-location">Location</label>
                  <input 
                    id="resume-location"
                    type="text" 
                    bind:value={resumeData.location} 
                    placeholder="City, State" 
                  />
                </div>
                <div class="form-group">
                  <label for="resume-linkedin">LinkedIn</label>
                  <input 
                    id="resume-linkedin"
                    type="url" 
                    bind:value={resumeData.linkedin} 
                    placeholder="linkedin.com/in/yourprofile" 
                  />
                </div>
                <div class="form-group full-width">
                  <label for="resume-portfolio">Portfolio</label>
                  <input 
                    id="resume-portfolio"
                    type="url" 
                    bind:value={resumeData.portfolio} 
                    placeholder="yourportfolio.com" 
                  />
                </div>
              </div>
            </div>
            
            <!-- Professional Summary -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-user-tie"></i> Professional Summary</h4>
              <div class="form-group">
                <label for="resume-summary" class="sr-only">Professional Summary</label>
                <textarea 
                  id="resume-summary"
                  bind:value={resumeData.summary} 
                  rows="4" 
                  placeholder="Write a compelling professional summary..."
                ></textarea>
              </div>
            </div>
            
            <!-- Skills - Now with dynamic generation -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-tools"></i> Skills</h4>
              <div class="skills-section-header">
                <div class="skills-info">
                  <p class="skills-subtitle">
                    Skills generated for: <strong>{latestAssessment?.top_careers[0]?.title || 'Your Career'}</strong>
                    {#if latestAssessment?.top_careers[0]?.industry}
                      in <strong>{latestAssessment.top_careers[0].industry}</strong>
                    {/if}
                    {#if latestAssessment?.top_careers[0]?.experienceLevel}
                      (<strong>{latestAssessment.top_careers[0].experienceLevel}</strong>)
                    {/if}
                  </p>
                  <div class="skills-level-info">
                    <button 
                      type="button" 
                      class="btn-small regenerate-skills" 
                      on:click={generateSkillsFromAssessment}
                      aria-label="Regenerate skills based on assessment"
                    >
                      <i class="fa-solid fa-arrows-rotate"></i> Regenerate Skills
                    </button>
                  </div>
                </div>
              </div>
              <div class="skills-input">
                <label for="new-skill" class="sr-only">Add a skill</label>
                <input 
                  id="new-skill"
                  type="text" 
                  bind:value={newSkill}
                  placeholder="Add a custom skill"
                  on:keydown={(e) => { if (e.key === 'Enter') addSkill(); }}
                />
                <button class="btn-small" on:click={addSkill} aria-label="Add skill">
                  <i class="fa-solid fa-plus"></i> Add
                </button>
              </div>
              <div class="skills-list">
                {#each resumeData.skills as skill, index}
                  <div class="skill-tag">
                    {skill}
                    <button 
                      class="skill-remove" 
                      on:click={() => removeSkill(index)}
                      aria-label="Remove skill: {skill}"
                    >
                      <i class="fa-solid fa-times"></i>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Experience - FIXED: Now properly adds new experiences -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-briefcase"></i> Experience</h4>
              {#each resumeData.experiences as exp, index}
                <div class="experience-form">
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="exp-title-{index}">Job Title</label>
                      <input 
                        id="exp-title-{index}"
                        type="text" 
                        bind:value={exp.title} 
                        placeholder="e.g., Software Engineer" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="exp-company-{index}">Company</label>
                      <input 
                        id="exp-company-{index}"
                        type="text" 
                        bind:value={exp.company} 
                        placeholder="Company Name" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="exp-location-{index}">Location</label>
                      <input 
                        id="exp-location-{index}"
                        type="text" 
                        bind:value={exp.location} 
                        placeholder="City, State" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="exp-start-{index}">Start Date</label>
                      <input 
                        id="exp-start-{index}"
                        type="month" 
                        bind:value={exp.startDate} 
                      />
                    </div>
                    <div class="form-group">
                      <label for="exp-end-{index}">End Date</label>
                      <input 
                        id="exp-end-{index}"
                        type="month" 
                        bind:value={exp.endDate} 
                        disabled={exp.current} 
                      />
                    </div>
                    <div class="form-group checkbox-group">
                      <label class="checkbox-label">
                        <input 
                          type="checkbox" 
                          bind:checked={exp.current}
                          aria-label="Current position"
                        />
                        Current Position
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="exp-description-{index}">Description</label>
                    <textarea 
                      id="exp-description-{index}"
                      bind:value={exp.description} 
                      rows="3" 
                      placeholder="Describe your responsibilities and achievements..."
                    ></textarea>
                  </div>
                  {#if resumeData.experiences.length > 1}
                    <button 
                      class="btn-remove" 
                      on:click={() => removeExperience(index)}
                      aria-label="Remove experience"
                    >
                      <i class="fa-solid fa-trash"></i> Remove
                    </button>
                  {/if}
                </div>
              {/each}
              
              <!-- Experience Form Inputs -->
              <div class="experience-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="new-exp-title">Job Title</label>
                    <input 
                      id="new-exp-title"
                      type="text" 
                      bind:value={newExperience.title} 
                      placeholder="e.g., Software Engineer" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-exp-company">Company</label>
                    <input 
                      id="new-exp-company"
                      type="text" 
                      bind:value={newExperience.company} 
                      placeholder="Company Name" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-exp-location">Location</label>
                    <input 
                      id="new-exp-location"
                      type="text" 
                      bind:value={newExperience.location} 
                      placeholder="City, State" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-exp-start">Start Date</label>
                    <input 
                      id="new-exp-start"
                      type="month" 
                      bind:value={newExperience.startDate} 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-exp-end">End Date</label>
                    <input 
                      id="new-exp-end"
                      type="month" 
                      bind:value={newExperience.endDate} 
                      disabled={newExperience.current} 
                    />
                  </div>
                  <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        bind:checked={newExperience.current}
                        aria-label="Current position"
                      />
                      Current Position
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label for="new-exp-description">Description</label>
                  <textarea 
                    id="new-exp-description"
                    bind:value={newExperience.description} 
                    rows="3" 
                    placeholder="Describe your responsibilities and achievements..."
                  ></textarea>
                </div>
                <button class="btn-add" on:click={addExperience} aria-label="Add new experience">
                  <i class="fa-solid fa-plus"></i> Add Experience
                </button>
              </div>
            </div>
            
            <!-- Education - FIXED: Now properly adds new education and has editable location -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-graduation-cap"></i> Education</h4>
              {#each resumeData.education as edu, index}
                <div class="education-form">
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="edu-degree-{index}">Degree</label>
                      <input 
                        id="edu-degree-{index}"
                        type="text" 
                        bind:value={edu.degree} 
                        placeholder="e.g., Bachelor of Science" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="edu-institution-{index}">Institution</label>
                      <input 
                        id="edu-institution-{index}"
                        type="text" 
                        bind:value={edu.institution} 
                        placeholder="University Name" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="edu-location-{index}">Location</label>
                      <input 
                        id="edu-location-{index}"
                        type="text" 
                        bind:value={edu.location} 
                        placeholder="City, State" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="edu-graduation-{index}">Graduation Date</label>
                      <input 
                        id="edu-graduation-{index}"
                        type="month" 
                        bind:value={edu.graduationDate} 
                      />
                    </div>
                    <div class="form-group">
                      <label for="edu-gpa-{index}">GPA</label>
                      <input 
                        id="edu-gpa-{index}"
                        type="text" 
                        bind:value={edu.gpa} 
                        placeholder="3.5" 
                      />
                    </div>
                  </div>
                  {#if resumeData.education.length > 1}
                    <button 
                      class="btn-remove" 
                      on:click={() => removeEducation(index)}
                      aria-label="Remove education"
                    >
                      <i class="fa-solid fa-trash"></i> Remove
                    </button>
                  {/if}
                </div>
              {/each}
              
              <!-- Education Form Inputs -->
              <div class="education-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="new-edu-degree">Degree</label>
                    <input 
                      id="new-edu-degree"
                      type="text" 
                      bind:value={newEducation.degree} 
                      placeholder="e.g., Bachelor of Science" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-edu-institution">Institution</label>
                    <input 
                      id="new-edu-institution"
                      type="text" 
                      bind:value={newEducation.institution} 
                      placeholder="University Name" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-edu-location">Location</label>
                    <input 
                      id="new-edu-location"
                      type="text" 
                      bind:value={newEducation.location} 
                      placeholder="City, State" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-edu-graduation">Graduation Date</label>
                    <input 
                      id="new-edu-graduation"
                      type="month" 
                      bind:value={newEducation.graduationDate} 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-edu-gpa">GPA</label>
                    <input 
                      id="new-edu-gpa"
                      type="text" 
                      bind:value={newEducation.gpa} 
                      placeholder="3.5" 
                    />
                  </div>
                </div>
                <button class="btn-add" on:click={addEducation} aria-label="Add new education">
                  <i class="fa-solid fa-plus"></i> Add Education
                </button>
              </div>
            </div>
            
            <!-- Certifications - FIXED: Now properly adds new certifications -->
            <div class="resume-section">
              <h4><i class="fa-solid fa-certificate"></i> Certifications</h4>
              {#each resumeData.certifications as cert, index}
                <div class="certification-form">
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="cert-name-{index}">Certification Name</label>
                      <input 
                        id="cert-name-{index}"
                        type="text" 
                        bind:value={cert.name} 
                        placeholder="e.g., AWS Certified Solutions Architect" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="cert-issuer-{index}">Issuer</label>
                      <input 
                        id="cert-issuer-{index}"
                        type="text" 
                        bind:value={cert.issuer} 
                        placeholder="Issuing Organization" 
                      />
                    </div>
                    <div class="form-group">
                      <label for="cert-date-{index}">Date Obtained</label>
                      <input 
                        id="cert-date-{index}"
                        type="month" 
                        bind:value={cert.date} 
                      />
                    </div>
                  </div>
                  {#if resumeData.certifications.length > 1}
                    <button 
                      class="btn-remove" 
                      on:click={() => removeCertification(index)}
                      aria-label="Remove certification"
                    >
                      <i class="fa-solid fa-trash"></i> Remove
                    </button>
                  {/if}
                </div>
              {/each}
              
              <!-- Certification Form Inputs -->
              <div class="certification-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="new-cert-name">Certification Name</label>
                    <input 
                      id="new-cert-name"
                      type="text" 
                      bind:value={newCertification.name} 
                      placeholder="e.g., AWS Certified Solutions Architect" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-cert-issuer">Issuer</label>
                    <input 
                      id="new-cert-issuer"
                      type="text" 
                      bind:value={newCertification.issuer} 
                      placeholder="Issuing Organization" 
                    />
                  </div>
                  <div class="form-group">
                    <label for="new-cert-date">Date Obtained</label>
                    <input 
                      id="new-cert-date"
                      type="month" 
                      bind:value={newCertification.date} 
                    />
                  </div>
                </div>
                <button class="btn-add" on:click={addCertification} aria-label="Add new certification">
                  <i class="fa-solid fa-plus"></i> Add Certification
                </button>
              </div>
            </div>
          </div>
          
          <!-- Resume Preview Section -->
          <div class="resume-preview-section">
            <div class="preview-header">
              <h3><i class="fa-solid fa-eye"></i> Resume Preview</h3>
              <button 
                class="btn-small" 
                on:click={generatePDFResume} 
                disabled={isGeneratingPDF}
                aria-label="{isGeneratingPDF ? 'Generating PDF...' : 'Download PDF resume'}"
              >
                {#if isGeneratingPDF}
                  <i class="fa-solid fa-spinner fa-spin"></i> Generating...
                {:else}
                  <i class="fa-solid fa-print"></i> Print/Download PDF
                {/if}
              </button>
            </div>
            
            <div class="resume-preview-content" id="resume-preview-content">
              <!-- Printable Resume Template -->
              <div class="resume-template" id="printable-resume">
                <!-- Header -->
                <div class="resume-header-section">
                  <h1 class="resume-name">{userProfile?.first_name} {userProfile?.last_name}</h1>
                  <div class="resume-contact">
                    {#if resumeData.email}
                      <span><i class="fa-solid fa-envelope"></i> {resumeData.email}</span>
                    {/if}
                    {#if resumeData.phone}
                      <span><i class="fa-solid fa-phone"></i> {resumeData.phone}</span>
                    {/if}
                    {#if resumeData.location}
                      <span><i class="fa-solid fa-location-dot"></i> {resumeData.location}</span>
                    {/if}
                    {#if resumeData.linkedin}
                      <span><i class="fa-brands fa-linkedin"></i> {resumeData.linkedin}</span>
                    {/if}
                    {#if resumeData.portfolio}
                      <span><i class="fa-solid fa-globe"></i> {resumeData.portfolio}</span>
                    {/if}
                  </div>
                </div>
                
                <!-- Career Match Badge -->
                {#if latestAssessment}
                  <div class="career-match-badge">
                    <span class="badge-label">Career Match:</span>
                    <span class="badge-value">{latestAssessment.match_score}%</span>
                    <span class="badge-career">{latestAssessment.top_careers[0]?.title || 'Top Recommended Career'}</span>
                  </div>
                {/if}
                
                <!-- Professional Summary -->
                {#if resumeData.summary}
                  <div class="resume-section-preview">
                    <h2 class="section-title"><i class="fa-solid fa-user-tie"></i> Professional Summary</h2>
                    <p class="section-content">{resumeData.summary}</p>
                  </div>
                {/if}
                
                <!-- Skills -->
                {#if resumeData.skills.length > 0}
                  <div class="resume-section-preview">
                    <h2 class="section-title"><i class="fa-solid fa-tools"></i> Skills</h2>
                    <div class="skills-grid">
                      {#each resumeData.skills as skill}
                        <span class="skill-item">{skill}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
                
                <!-- Experience -->
                {#if resumeData.experiences.length > 0}
                  <div class="resume-section-preview">
                    <h2 class="section-title"><i class="fa-solid fa-briefcase"></i> Experience</h2>
                    {#each resumeData.experiences as exp}
                      <div class="experience-item-preview">
                        <div class="experience-header">
                          <h3 class="experience-title">{exp.title}</h3>
                          <span class="experience-date">
                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <div class="experience-company">{exp.company} | {exp.location}</div>
                        {#if exp.description}
                          <div class="experience-description">
                            {#each exp.description.split('\n') as line}
                              {#if line.trim()}
                                <p>• {line}</p>
                              {/if}
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Education -->
                {#if resumeData.education.length > 0}
                  <div class="resume-section-preview">
                    <h2 class="section-title"><i class="fa-solid fa-graduation-cap"></i> Education</h2>
                    {#each resumeData.education as edu}
                      <div class="education-item-preview">
                        <div class="education-header">
                          <h3 class="education-degree">{edu.degree}</h3>
                          <span class="education-date">{edu.graduationDate}</span>
                        </div>
                        <div class="education-institution">{edu.institution} | {edu.location}</div>
                        {#if edu.gpa}
                          <div class="education-details">GPA: {edu.gpa}</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Certifications -->
                {#if resumeData.certifications.length > 0}
                  <div class="resume-section-preview">
                    <h2 class="section-title"><i class="fa-solid fa-certificate"></i> Certifications</h2>
                    <div class="certifications-list">
                      {#each resumeData.certifications as cert}
                        <div class="certification-item">
                          <strong>{cert.name}</strong> – {cert.issuer} ({cert.date})
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
                
                <!-- Assessment Footer -->
                {#if latestAssessment}
                  <div class="assessment-footer">
                    <p class="footer-note">
                      <i class="fa-solid fa-lightbulb"></i> This resume is generated based on your career assessment results. 
                      Career match score: <strong>{latestAssessment.match_score}%</strong> with <strong>{latestAssessment.top_careers[0]?.title || 'recommended career'}</strong>.
                    </p>
                    <p class="footer-date">
                      Generated on {new Date().toLocaleDateString()} by CareerGeenie
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
    /* Add to existing styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

    :root {
      --primary-color: #6366f1;
      --primary-light: #818cf8;
      --primary-dark: #4f46e5;
      --secondary: #f59e0b;
      --secondary-light: #fbbf24;
      --accent: #ec4899;
      --accent-light: #f472b6;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --background: #ffffff;
      --surface: #f8fafc;
      --surface-light: #f1f5f9;
      --text: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .dashboard-page {
      min-height: 100vh;
      background: var(--background);
      font-family: 'Inter', sans-serif;
      color: var(--text);
      position: relative;
      overflow-x: hidden;
    }

    /* Background Elements - Lighter version */
    .background-elements {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .bg-gradient {
      position: absolute;
      top: 0;
      right: -200px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0) 70%);
      filter: blur(60px);
    }

    .bg-particle {
      position: absolute;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border-radius: 50%;
      opacity: 0.05;
      animation: float 20s infinite linear;
    }

    .bg-particle:nth-child(2) {
      top: 20%;
      left: 10%;
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      animation-delay: -5s;
    }

    .bg-particle:nth-child(3) {
      top: 60%;
      right: 15%;
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, var(--secondary), var(--secondary-light));
      animation-delay: -10s;
    }

    .bg-particle:nth-child(4) {
      bottom: 10%;
      left: 20%;
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, var(--success), #34d399);
      animation-delay: -15s;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-20px) rotate(180deg);
      }
    }
    
    .career-details-modal {
      max-width: 800px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }

    .career-modal-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .career-match-badge-small {
      background: linear-gradient(135deg, var(--success), #34d399);
      color: white;
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .match-badge-value {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .career-details-body {
      overflow-y: auto;
      padding: 0;
    }

    .loading-spinner-small {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .loading-spinner-small .spinner {
      width: 30px;
      height: 30px;
      border-width: 2px;
    }

    .career-details-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .career-section {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 0.75rem;
      padding: 1.25rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .career-section h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .career-section h4 i {
      color: var(--primary-color);
    }

    .career-description-text {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .career-quick-facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .quick-fact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .quick-fact i {
      color: var(--primary-color);
      width: 16px;
    }

    .fact-label {
      font-weight: 500;
      color: var(--text);
    }

    .fact-value {
      color: var(--text-secondary);
    }

    .tasks-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .tasks-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .tasks-list li i {
      color: var(--success);
      font-size: 0.75rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }

    .responsibilities-text {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .no-info {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
      padding: 1rem;
    }

    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag-detail {
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-dark);
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .skill-tag-develop {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .environment-text {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .career-path-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .path-step {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 0.5rem;
      border-left: 3px solid var(--primary-color);
    }

    .step-number {
      background: var(--primary-color);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 0.25rem;
    }

    .step-duration {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .certifications-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .certifications-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .certifications-list li i {
      color: var(--accent);
      font-size: 0.75rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }

    .match-reason-section {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      border-color: rgba(16, 185, 129, 0.2);
    }

    .match-reason-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .match-reason-icon {
      background: var(--success);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .match-reason-text {
      flex: 1;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text);
      font-style: italic;
    }

    .career-action-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .career-action-buttons .btn-primary,
    .career-action-buttons .btn-secondary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    /* Make career cards clickable */
    .career-match-card {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .career-match-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .career-card-trigger {
      cursor: pointer;
    }

    /* Responsive styles for career details modal */
    @media (max-width: 768px) {
      .career-details-modal {
        max-height: 90vh;
        margin: 1rem;
      }
      
      .career-quick-facts {
        grid-template-columns: 1fr;
      }
      
      .career-action-buttons {
        flex-direction: column;
      }
      
      .career-modal-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .career-details-content {
        padding: 1rem;
      }
      
      .career-section {
        padding: 1rem;
      }
      
      .path-step {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .match-reason-content {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    /* Toast Notifications */
    .toast {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 1000;
      max-width: 400px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      animation: slideInRight 0.3s ease;
      transform-origin: top right;
      color: var(--text);
    }

    .toast.error {
      background: rgba(239, 68, 68, 0.95);
      color: white;
    }

    .toast.success {
      background: rgba(16, 185, 129, 0.95);
      color: white;
    }

    .toast-icon {
      font-size: 1.25rem;
    }

    .toast-message {
      flex: 1;
      font-weight: 500;
    }

    .toast-close {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    /* Delete Confirmation Modal */
    .delete-confirm-modal .modal-body {
      text-align: center;
    }

    .delete-confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .delete-confirm-content i {
      font-size: 3rem;
      color: var(--error);
    }

    .delete-confirm-content h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    .delete-confirm-content p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .btn-danger {
      background: linear-gradient(135deg, var(--error), #f87171);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #f87171, var(--error));
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
    }

    .btn-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sidebar Styles - FIXED and improved with light theme */
    .sidebar {
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 5px 0 20px rgba(0, 0, 0, 0.05);
    }

    .sidebar.closed {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar-header {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      /* Removed border-bottom */
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-image {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .brand-name {
      font-weight: 600;
      font-size: 1.125rem;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }

    .sidebar-toggle {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .sidebar-toggle:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .new-assessment-sidebar {
      padding: 1.25rem;
      /* Removed border-bottom */
    }

    .new-assessment-btn-sidebar {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .new-assessment-btn-sidebar:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    /* Assessment History Navigation */
    .assessment-history-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    /* MINIMIZED SIDEBAR SCROLLBAR */
    .assessment-history-nav::-webkit-scrollbar {
      width: 4px;
    }

    .assessment-history-nav::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 2px;
    }

    .assessment-history-nav::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }

    .assessment-history-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    .assessment-history-nav {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.02);
    }

    .nav-section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0 1.25rem 0.5rem;
      margin-bottom: 0.5rem;
    }

    .nav-item-wrapper {
      display: flex;
      align-items: center;
      padding: 0.125rem 0.75rem;
      width: calc(100% - 1.5rem);
      margin: 0.125rem auto;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .nav-item-wrapper:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      padding: 0.625rem 0;
      background: none;
      border: none;
      text-align: left;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
      border-radius: 0.5rem;
    }

    .nav-item:hover {
      background: none;
      color: var(--text);
    }

    .nav-icon {
      width: 20px;
      text-align: center;
      color: var(--text-muted);
    }

    .nav-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .nav-title {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .nav-item-delete {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      opacity: 0;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item-wrapper:hover .nav-item-delete {
      opacity: 1;
    }

    .nav-item-delete:hover {
      color: var(--error);
      background: rgba(239, 68, 68, 0.1);
    }

    /* Assessment Pagination */
    .assessment-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      margin-top: 0.5rem;
    }

    .pagination-btn {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(.disabled) {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .pagination-btn.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .pagination-info {
      font-size: 0.75rem;
      color: var(--text-muted);
      min-width: 80px;
      text-align: center;
    }

    .empty-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      color: var(--text-muted);
      opacity: 0.6;
    }

    .empty-history i {
      font-size: 1.5rem;
    }

    .empty-text {
      font-size: 0.875rem;
    }

    /* User Section - spacing adjusted */
    .user-section {
      padding: 1.25rem;
      margin-top: auto;
      /* Removed border-top */
    }

    .user-profile-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .profile-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .profile-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .profile-initials {
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      flex: 1;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Removed user-email class since we're not showing email anymore */

    .settings-container {
      position: relative;
      flex-shrink: 0;
    }

    .settings-trigger {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .settings-trigger:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .settings-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      min-width: 180px;
      z-index: 1000;
      margin-bottom: 0.5rem;
    }

    .settings-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      text-align: left;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .settings-item:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text);
    }

    .settings-item.logout {
      color: var(--error);
    }

    .settings-divider {
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
      margin: 0.25rem 0;
    }

    /* Main Content - FIXED for sidebar toggle */
    .main-content {
      margin-left: 280px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 2;
      min-height: 100vh;
    }

    .main-content.sidebar-closed {
      margin-left: 0;
    }

    .main-header {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .sidebar-toggle-mobile {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .sidebar-toggle-mobile:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon {
      font-size: 1.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }

    .main-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }

    /* Dashboard Scroll Container */
    .dashboard-scroll-container {
      max-height: calc(100vh - 70px);
      overflow-y: auto;
      padding: 2rem;
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .dashboard-scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .dashboard-scroll-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .dashboard-scroll-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    .dashboard-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    .dashboard-scroll-container {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.05);
    }

    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Welcome Section */
    .welcome-section {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1.5rem;
      padding: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .welcome-content h2 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--text), var(--text-secondary));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      font-family: 'Poppins', sans-serif;
      margin-bottom: 0.5rem;
    }

    .welcome-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
    }

    .welcome-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-badge {
      background: rgba(0, 0, 0, 0.05);
      padding: 0.75rem 1.25rem;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .stat-badge i {
      color: var(--primary-color);
    }

    /* Latest Results Section */
    .latest-results-section,
    .career-matches-section,
    .metrics-section,
    .stats-section {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1.5rem;
      padding: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-title i {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .section-title h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .new-assessment-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .new-assessment-btn:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    .latest-assessment-card {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1rem;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .match-score-display {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .score-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .score-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .score-details {
      flex: 1;
    }

    .career-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .career-description {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .assessment-meta {
      display: flex;
      gap: 1.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .result-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      border: none;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
    }

    .action-btn.primary:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    .action-btn.secondary {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .action-btn.secondary:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .no-assessment-card {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1rem;
      padding: 3rem 2rem;
      text-align: center;
      border: 2px dashed rgba(0, 0, 0, 0.1);
    }

    .no-assessment-content i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-assessment-content h4 {
      font-size: 1.25rem;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .no-assessment-content p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .start-assessment-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .start-assessment-btn:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
    }

    /* Career Matches Grid */
    .career-matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .career-match-card {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .career-match-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--card-gradient, linear-gradient(90deg, var(--primary-color), var(--primary-light)));
      opacity: 0.8;
    }

    .career-match-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 0, 0, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .match-rank {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
      font-size: 0.875rem;
      font-weight: 600;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .match-header h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin-right: 1rem;
    }

    .match-percentage {
      background: linear-gradient(135deg, var(--success), #34d399);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .match-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .detail-item i {
      width: 16px;
      color: var(--primary-color);
    }

    .match-strengths {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .match-strengths strong {
      font-size: 0.875rem;
      color: var(--text);
      display: block;
      margin-bottom: 0.5rem;
    }

    .strengths-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .strength-tag {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-secondary);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .match-actions {
      margin-top: 1rem;
      text-align: right;
    }

    .view-details-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .view-details-btn:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 0, 0, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .metric-content {
      flex: 1;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Stats Section */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .stats-card {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .stats-header {
      margin-bottom: 1rem;
    }

    .stats-header h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .action-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 0.75rem;
      border-left: 3px solid var(--primary-color);
    }

    .action-number {
      background: var(--primary-color);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .action-text {
      flex: 1;
      font-size: 0.875rem;
      color: var(--text);
    }

    .action-plan-footer {
      margin-top: 1rem;
      text-align: center;
    }

    .view-full-plan {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .view-full-plan:hover {
      color: var(--primary-light);
    }

    /* Loading */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Footer */
    .dashboard-footer {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .footer-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .dashboard-footer p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .footer-links {
      display: flex;
      gap: 1.5rem;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: var(--text);
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        z-index: 1000;
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
      }
      
      .sidebar.open {
        transform: translateX(0);
      }
      
      .main-content {
        margin-left: 0 !important;
      }
      
      .sidebar-toggle-mobile {
        display: block;
      }
      
      .career-matches-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
      
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .dashboard-scroll-container {
        padding: 1rem;
      }
      
      .welcome-section {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .welcome-stats {
        flex-wrap: wrap;
      }
      
      .latest-assessment-card {
        flex-direction: column;
        gap: 1.5rem;
        align-items: flex-start;
      }
      
      .match-score-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .result-actions {
        width: 100%;
        justify-content: flex-start;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .main-header {
        padding: 1rem;
      }
      
      .main-header h1 {
        font-size: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .dashboard-content {
        gap: 1rem;
      }
      
      .welcome-content h2 {
        font-size: 1.5rem;
      }
      
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .new-assessment-btn {
        align-self: stretch;
        justify-content: center;
      }
      
      .score-circle {
        width: 80px;
        height: 80px;
      }
      
      .score-value {
        font-size: 1.5rem;
      }
      
      .action-btn {
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
      }
      
      .toast {
        left: 1rem;
        right: 1rem;
        top: 1rem;
        max-width: none;
      }
    }

    /* Mini Sidebar Styles */
    .sidebar-mini-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      gap: 1rem;
      height: 100%;
      justify-content: space-between;
      overflow-y: auto;
    }

    .new-assessment-mini {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .new-assessment-mini:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: scale(1.1);
    }

    .new-assessment-mini:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sidebar-nav-mini {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .nav-item-mini {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
    }

    .nav-item-mini:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .nav-item-mini.active {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
    }

    .nav-badge-mini {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--success);
      color: white;
      font-size: 0.625rem;
      padding: 0.125rem 0.25rem;
      border-radius: 0.5rem;
      min-width: 16px;
      text-align: center;
    }

    .user-mini {
      padding: 0.5rem 0;
    }

    .profile-circle-mini {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .profile-image-mini {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .profile-initials-mini {
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 1.5rem;
      width: 100%;
      max-width: 500px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    .modal-close {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }

    .form-group input {
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.75rem;
      color: var(--text);
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text);
      border: 1px solid rgba(0, 0, 0, 0.1);
      flex: 1;
    }

    .btn-secondary:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    /* Resume Modal Styles */
    .resume-modal {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 1.5rem;
      width: 100%;
      max-width: 1200px;
      height: 90vh;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .resume-modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .resume-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .resume-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    .resume-title i {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .resume-modal-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .resume-builder-section {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }

    .resume-preview-section {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .resume-builder-section h3,
    .preview-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .resume-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .resume-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .resume-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* IMPROVED RESUME FORM LAYOUT */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .form-grid .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-grid .checkbox-group {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Skills section improvements */
    .skills-section-header {
      margin-bottom: 1rem;
    }

    .skills-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .skills-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      flex: 1;
    }

    .skills-level-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .regenerate-skills {
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-light);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .regenerate-skills:hover {
      background: rgba(99, 102, 241, 0.2);
    }

    .form-group textarea {
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.75rem;
      color: var(--text);
      font-size: 0.875rem;
      resize: vertical;
      min-height: 80px;
      transition: all 0.2s;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .skills-input {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .skills-input input {
      flex: 1;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-small:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
      transform: translateY(-1px);
    }

    .btn-small:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text);
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .skill-remove {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
      font-size: 0.75rem;
    }

    .skill-remove:hover {
      color: var(--error);
    }

    .experience-form,
    .education-form,
    .certification-form {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .btn-remove {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      margin-top: 0.75rem;
    }

    .btn-remove:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    .btn-add {
      background: rgba(0, 0, 0, 0.02);
      color: var(--text);
      border: 1px dashed rgba(0, 0, 0, 0.2);
      padding: 0.75rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      transition: all 0.2s;
    }

    .btn-add:hover {
      background: rgba(0, 0, 0, 0.05);
      border-color: var(--primary-color);
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .resume-preview-content {
      flex: 1;
      overflow-y: auto;
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
    }

    /* Resume Template Styles */
    .resume-template {
      color: #1e293b;
      font-family: 'Inter', sans-serif;
    }

    .resume-header-section {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--primary-color);
    }

    .resume-name {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
      font-family: 'Poppins', sans-serif;
    }

    .resume-contact {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #475569;
    }

    .resume-contact span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .career-match-badge {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .badge-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .badge-value {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .badge-career {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .resume-section-preview {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary-dark);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .section-content {
      font-size: 0.875rem;
      line-height: 1.6;
      color: #475569;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-item {
      background: #f1f5f9;
      color: #475569;
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
    }

    .experience-item-preview {
      margin-bottom: 1rem;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .experience-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .experience-date {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
    }

    .experience-company {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.5rem;
      font-style: italic;
    }

    .experience-description {
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
    }

    .experience-description p {
      margin-bottom: 0.25rem;
    }

    .education-item-preview {
      margin-bottom: 1rem;
    }

    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .education-degree {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .education-date {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
    }

    .education-institution {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.25rem;
    }

    .education-details {
      font-size: 0.875rem;
      color: #64748b;
    }

    .certifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .certification-item {
      font-size: 0.875rem;
      color: #475569;
    }

    .assessment-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px dashed #e2e8f0;
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: center;
    }

    .footer-note {
      margin-bottom: 0.5rem;
      font-style: italic;
    }

    .footer-date {
      color: #cbd5e1;
    }

    /* Responsive Resume Modal */
    @media (max-width: 768px) {
      .resume-modal {
        flex-direction: column;
        height: 95vh;
      }
      
      .resume-builder-section,
      .resume-preview-section {
        flex: none;
        border-right: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .resume-builder-section {
        max-height: 50%;
      }
      
      .resume-preview-section {
        max-height: 50%;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .skills-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    /* Ensure the dashboard is responsive */
    @media (max-width: 768px) {
      .main-header {
        padding: 1rem;
      }
      
      .dashboard-scroll-container {
        padding: 1rem;
      }
      
      .welcome-section {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .welcome-content h2 {
        font-size: 1.5rem;
      }
      
      .latest-assessment-card {
        flex-direction: column;
        gap: 1.5rem;
        align-items: flex-start;
      }
      
      .match-score-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .result-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
      
      .career-matches-grid {
        grid-template-columns: 1fr;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Loading overlay improvement */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-spinner p {
      color: var(--text);
      font-size: 0.875rem;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Make sure all interactive elements have proper states */
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    input:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Improve accessibility for screen readers */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
</style>