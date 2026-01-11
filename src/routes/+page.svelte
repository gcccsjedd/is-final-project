<!-- Main App.svelte -->
<script lang="ts">
  import { writable, derived } from 'svelte/store';
  import { afterUpdate, onMount } from 'svelte';
  import Preferences from './Preferences.svelte';
  import Skills from './Skills.svelte';
  import WorkPreferences from './Work.svelte';
  import Results from './Results.svelte';
  import Login from './Login.svelte';
  import Dashboard from './Dashboard.svelte';

  // Define types for better type safety
  type Step = 'landing' | 'login' | 'preferences' | 'skills' | 'work' | 'results' | 'dashboard';
  
  // Consolidated CareerMatch type definition
  interface CareerMatch {
    id: string;
    title: string;
    matchPercentage: number;
    description: string;
    requiredSkills: string[];
    salaryRange: string;
    growthPotential: string;
    strengths: string[];
  }

  interface AlternatePath {
    id: string;
    title: string;
    description: string;
    timeline: string;
    matchPercentage: number;
  }

  interface LoginData {
    name: string;
    email: string;
  }

  // Define event types for components
  interface WorkPreferenceData {
    workTypes: string[];
    salaryExpectation: string;
    workMotivation: string;
    educationLevel: string;
    educationField: string;
    workExperience: string;
  }

  interface SkillsData {
    strengths: string[];
    technicalSkills: string[];
  }

  interface WorkPreferencesData {
    learningStyle: string;
    collaborationPreference: string;
    timePreference: string;
    guidancePreference: string;
    workPace: string;
  }

  interface ResultsData {
    recommendations: CareerMatch[];
    alternatePaths: AlternatePath[];
    jobLinks: string[];
    summary: any;
    userName: string;
  }

  // Centralized state management
  const currentStep = writable<Step>('landing');
  let previousStep: Step = 'landing';
  
  // User data stores - initialize with default values
  const preferencesData = writable<WorkPreferenceData>({
    workTypes: [],
    salaryExpectation: '',
    workMotivation: '',
    educationLevel: '',
    educationField: '',
    workExperience: '',
  });
  
  const skillsData = writable<SkillsData>({
    strengths: [],
    technicalSkills: []
  });
  
  const workPreferencesData = writable<WorkPreferencesData>({
    learningStyle: '',
    collaborationPreference: '',
    timePreference: '',
    guidancePreference: '',
    workPace: ''
  });
  
  const resultsData = writable<ResultsData>({
    recommendations: [] as CareerMatch[],
    alternatePaths: [] as AlternatePath[],
    jobLinks: [] as string[],
    summary: null,
    userName: ''
  });

  // Local reactive variables
  let isLoading = false;
  let error = '';
  let isLoggedIn = false;
  let userName = '';
  let userEmail = '';
  let isNavScrolled = false;
  let activeFeature = 0;
  let scrollProgress = 0;
  
  // Track which floating card is in front
  let activeCard: string | null = null;
  let cardZIndices: Record<string, number> = {
    'card-1': 2,
    'card-2': 3,
    'card-3': 2
  };

  // Derived store to check if all data is complete
  const isAllDataComplete = derived(
    [preferencesData, skillsData, workPreferencesData],
    ([prefs, skills, work]) => {
      return (
        prefs.workTypes.length > 0 &&
        prefs.salaryExpectation !== '' &&
        prefs.workMotivation !== '' &&
        prefs.educationLevel !== '' &&
        prefs.educationField !== '' &&
        prefs.workExperience !== '' &&
        skills.strengths.length > 0 &&
        skills.technicalSkills.length > 0 &&
        work.learningStyle !== '' &&
        work.collaborationPreference !== '' &&
        work.timePreference !== '' &&
        work.guidancePreference !== '' &&
        work.workPace !== ''
      );
    }
  );

  // Add a function to handle starting new assessment
  function handleStartNewAssessment() {
    if (!isLoggedIn) {
      currentStep.set('login');
    } else {
      // Reset form data for new assessment
      resetFormData();
      currentStep.set('preferences');
    }
  }

  // Update the startAssessment function
  function startAssessment() {
    handleStartNewAssessment();
  }

  // Handle continue to dashboard from Results component
  function handleContinueToDashboard(event: CustomEvent<{ results: ResultsData }>) {
    // Store the results
    resultsData.set(event.detail.results);
    
    // Save to localStorage for persistence
    localStorage.setItem('latestAssessmentResults', JSON.stringify(event.detail.results));
    
    // Navigate to dashboard
    currentStep.set('dashboard');
  }

  // Update the onMount function in App.svelte
onMount(() => {
  // Handle navbar scroll
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll);
    
    // Auto rotate features
    const featureInterval = setInterval(() => {
      activeFeature = (activeFeature + 1) % 3;
    }, 4000);

    // Load any saved results from localStorage
    const savedResults = localStorage.getItem('latestAssessmentResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        resultsData.set(parsedResults);
      } catch (e) {
        console.error('Error loading saved results:', e);
      }
    }

    // CHECK FOR NEW ASSESSMENT FLAG
    const startNew = localStorage.getItem('startNewAssessment');
    if (startNew === 'true') {
      localStorage.removeItem('startNewAssessment');
      
      // If user is logged in, go directly to preferences
      if (isLoggedIn) {
        resetFormData();
        currentStep.set('preferences');
      } else {
        // If not logged in, go to login page
        currentStep.set('login');
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(featureInterval);
    };
  }
});

  function handleScroll() {
    if (typeof window !== 'undefined') {
      isNavScrolled = window.scrollY > 50;
      scrollProgress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    }
  }

  // Function to bring a card to the front
  function bringCardToFront(cardId: string) {
    // Reset all cards to lower z-index
    const maxZIndex = Math.max(...Object.values(cardZIndices));
    const allCards = ['card-1', 'card-2', 'card-3'];
    
    // Reset all cards
    allCards.forEach(card => {
      if (card !== cardId) {
        cardZIndices[card] = 2;
      }
    });
    
    // Bring clicked card to front
    cardZIndices[cardId] = maxZIndex + 1;
    activeCard = cardId;
    
    // Update the object to trigger reactivity
    cardZIndices = { ...cardZIndices };
  }

  // Reset card positions when changing steps
  function resetCardPositions() {
    cardZIndices = {
      'card-1': 2,
      'card-2': 3,
      'card-3': 2
    };
    activeCard = null;
  }

  // Scroll to top when step changes
  afterUpdate(() => {
    const unsubscribe = currentStep.subscribe(value => {
      if (previousStep !== value) {
        previousStep = value;
        resetCardPositions();
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  });

  // Function to scroll to top when logo is clicked
  function scrollToTop() {
    let currentStepValue: Step = 'landing';
    const unsubscribe = currentStep.subscribe(value => { 
      currentStepValue = value; 
    });
    
    if (currentStepValue === 'landing') {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // If not on landing page, go back to landing page and scroll to top
      handleBackToHome();
      // Small delay to ensure page transition completes before scrolling
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
    
    unsubscribe();
  }

  // Function to scroll to section
  function scrollToSection(sectionId: string) {
    if (typeof document !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function showLogin() {
    currentStep.set('login');
  }

  function handleLoginSuccess(user: LoginData) {
    isLoggedIn = true;
    userName = user.name;
    userEmail = user.email;
    currentStep.set('preferences');
  }

  function handleBackToHome() {
    currentStep.set('landing');
    resetFormData();
    resetCardPositions();
  }

  function handleLogout() {
    isLoggedIn = false;
    userName = '';
    userEmail = '';
    localStorage.removeItem('latestAssessmentResults');
    currentStep.set('landing');
    resetFormData();
    resetCardPositions();
  }

  function resetFormData() {
    // Reset all stores
    preferencesData.set({
      workTypes: [],
      salaryExpectation: '',
      workMotivation: '',
      educationLevel: '',
      educationField: '',
      workExperience: ''
    });
    
    skillsData.set({
      strengths: [],
      technicalSkills: []
    });
    
    workPreferencesData.set({
      learningStyle: '',
      collaborationPreference: '',
      timePreference: '',
      guidancePreference: '',
      workPace: ''
    });
    
    resultsData.set({
      recommendations: [],
      alternatePaths: [],
      jobLinks: [],
      summary: null,
      userName: ''
    });
    
    error = '';
  }

  // Function to handle completion of each step
  const handlePreferencesComplete = (event: CustomEvent<WorkPreferenceData>) => {
    preferencesData.set(event.detail);
    currentStep.set('skills');
  };
  
  const handleSkillsComplete = (event: CustomEvent<SkillsData>) => {
    skillsData.set(event.detail);
    currentStep.set('work');
  };
  
  const handleWorkComplete = async (event: CustomEvent<WorkPreferencesData>) => {
    workPreferencesData.set(event.detail);
    
    // Show loading state
    isLoading = true;
    error = '';
    
    try {
      // Combine all data for API call
      let prefs: WorkPreferenceData = {
        workTypes: [],
        salaryExpectation: '',
        workMotivation: '',
        educationLevel: '',
        educationField: '',
        workExperience: ''
      };
      let skills: SkillsData = {
        strengths: [],
        technicalSkills: []
      };
      
      // Get current values from stores
      const unsubscribePrefs = preferencesData.subscribe(value => prefs = value);
      const unsubscribeSkills = skillsData.subscribe(value => skills = value);
      
      const allUserData = {
        ...prefs,
        ...skills,
        ...event.detail
      };
      
      console.log('Sending data to API:', allUserData);
      
      // Call the AI recommendation API
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allUserData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      // Set results data with user's name
      resultsData.set({
        recommendations: result.recommendations || [],
        alternatePaths: result.alternatePaths || [],
        jobLinks: result.jobLinks || [],
        summary: result.summary || null,
        userName: userName || 'Student'
      });
      
      // Navigate to results
      currentStep.set('results');
      
      unsubscribePrefs();
      unsubscribeSkills();
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      error = 'Failed to generate career recommendations. Please try again.';
      
      // Get current store values for fallback
      let prefs: WorkPreferenceData = {
        workTypes: [],
        salaryExpectation: '',
        workMotivation: '',
        educationLevel: '',
        educationField: '',
        workExperience: ''
      };
      let skills: SkillsData = {
        strengths: [],
        technicalSkills: []
      };
      
      const unsubscribePrefs = preferencesData.subscribe(value => prefs = value);
      const unsubscribeSkills = skillsData.subscribe(value => skills = value);
      
      // Provide fallback recommendations with realistic college-level career paths
      resultsData.set({
        recommendations: getFallbackRecommendations(prefs, skills, event.detail),
        alternatePaths: getFallbackAlternatePaths(),
        jobLinks: getFallbackJobLinks(),
        summary: {
          topMatch: 85,
          averageMatch: 75,
          totalRecommendations: 6,
          suggestedNextSteps: [
            'Update your resume with relevant skills',
            'Network with professionals in your field',
            'Consider relevant certifications'
          ],
          timelineSuggestions: getTimelineSuggestions(prefs.educationLevel)
        },
        userName: userName || 'Student'
      });
      
      currentStep.set('results');
      unsubscribePrefs();
      unsubscribeSkills();
    } finally {
      isLoading = false;
    }
  };
  
  // Fallback functions for when API fails - College-level appropriate careers
  const getFallbackRecommendations = (preferences: WorkPreferenceData, skills: SkillsData, work: WorkPreferencesData): CareerMatch[] => {
    const baseRecommendations: CareerMatch[] = [
      {
        id: '1',
        title: 'Junior Software Developer',
        matchPercentage: 85,
        description: 'Entry-level position for developing and maintaining software applications under supervision. Perfect for recent graduates or students with coding skills.',
        requiredSkills: ['JavaScript', 'Python', 'HTML/CSS', 'Git', 'Problem Solving'],
        salaryRange: 'â‚±25,000 - â‚±40,000 monthly',
        growthPotential: 'High',
        strengths: skills.strengths || ['Analytical Thinking', 'Attention to Detail']
      },
      {
        id: '2',
        title: 'Data Analyst Trainee',
        matchPercentage: 78,
        description: 'Beginner role in data analysis, reporting, and visualization. Suitable for students with analytical skills and interest in data.',
        requiredSkills: ['Excel', 'SQL', 'Data Analysis', 'Statistics', 'Communication'],
        salaryRange: 'â‚±20,000 - â‚±35,000 monthly',
        growthPotential: 'High',
        strengths: skills.strengths || ['Analytical Thinking', 'Attention to Detail']
      },
      {
        id: '3',
        title: 'Project Assistant',
        matchPercentage: 72,
        description: 'Support role in project coordination, documentation, and communication. Great for organized individuals with good communication skills.',
        requiredSkills: ['Organization', 'Communication', 'MS Office', 'Time Management', 'Teamwork'],
        salaryRange: 'â‚±18,000 - â‚±30,000 monthly',
        growthPotential: 'Medium',
        strengths: skills.strengths || ['Organization', 'Communication']
      },
      {
        id: '4',
        title: 'IT Support Specialist',
        matchPercentage: 68,
        description: 'Entry-level technical support role helping users with hardware and software issues.',
        requiredSkills: ['Troubleshooting', 'Customer Service', 'Windows OS', 'Networking Basics'],
        salaryRange: 'â‚±18,000 - â‚±32,000 monthly',
        growthPotential: 'Medium',
        strengths: skills.strengths || ['Problem Solving', 'Patience']
      },
      {
        id: '5',
        title: 'Content Writer',
        matchPercentage: 65,
        description: 'Beginner role creating written content for websites, blogs, and marketing materials.',
        requiredSkills: ['Writing', 'Research', 'Grammar', 'SEO Basics', 'Creativity'],
        salaryRange: 'â‚±15,000 - â‚±28,000 monthly',
        growthPotential: 'Medium',
        strengths: skills.strengths || ['Creativity', 'Writing']
      }
    ];
    
    // Filter based on education level and skills
    const filteredRecommendations = baseRecommendations.filter(rec => {
      // For first year students, show more basic roles
      if (preferences.educationLevel === 'first') {
        return rec.title.includes('Trainee') || rec.title.includes('Assistant');
      }
      // For final year students, show more advanced roles
      if (preferences.educationLevel === 'fourth') {
        return !rec.title.includes('Trainee');
      }
      return true;
    });
    
    return filteredRecommendations.slice(0, 3);
  };
  
  const getFallbackAlternatePaths = (): AlternatePath[] => [
    {
      id: '1',
      title: 'UI/UX Design Trainee',
      description: 'Entry-level role focusing on user interface and experience design. Requires creativity and user-centered thinking.',
      timeline: '6-12 months training',
      matchPercentage: 70
    },
    {
      id: '2',
      title: 'Digital Marketing Assistant',
      description: 'Support role in online marketing campaigns, social media management, and content creation.',
      timeline: '3-6 months preparation',
      matchPercentage: 65
    },
    {
      id: '3',
      title: 'Technical Support Representative',
      description: 'Customer-facing role helping users with technical issues. Good communication skills required.',
      timeline: '1-3 months training',
      matchPercentage: 60
    }
  ];
  
  const getFallbackJobLinks = (): string[] => [
    'https://ph.indeed.com/jobs?q=Junior+Software+Developer&l=Philippines&jt=fulltime&fromage=3',
    'https://ph.indeed.com/jobs?q=Data+Analyst+Trainee&l=Philippines&jt=fulltime',
    'https://ph.indeed.com/jobs?q=Project+Assistant&l=Philippines&jt=fulltime',
    'https://ph.indeed.com/jobs?q=IT+Support&l=Philippines&jt=fulltime&fromage=7',
    'https://www.linkedin.com/jobs/search/?keywords=entry%20level%20developer&location=Philippines'
  ];
  
  const getTimelineSuggestions = (educationLevel: string): string[] => {
    const suggestions: Record<string, string[]> = {
      'first': [
        'Focus on maintaining good academic standing (GPA 2.5+)',
        'Join student organizations related to your field',
        'Start learning basic programming/technical skills online',
        'Attend career orientation sessions',
        'Build your first simple projects or portfolio'
      ],
      'second': [
        'Declare your major and explore specialization areas',
        'Look for part-time work or on-campus jobs',
        'Start building a portfolio of class projects',
        'Attend industry networking events',
        'Complete basic online certifications (Google, Microsoft)'
      ],
      'third': [
        'Secure summer internships (paid or unpaid)',
        'Start networking with alumni in your field',
        'Refine your resume and LinkedIn profile',
        'Take advanced courses in your specialization',
        'Participate in hackathons or case competitions'
      ],
      'fourth': [
        'Apply for graduate positions 6-9 months before graduation',
        'Prepare for job interviews and assessments',
        'Attend career fairs and company presentations',
        'Complete your thesis/final project showcasing skills',
        'Network with hiring managers and recruiters'
      ],
      'freshgrad': [
        'Apply for entry-level positions and training programs',
        'Consider short-term internships to gain experience',
        'Continue skill development through online courses',
        'Network through professional associations',
        'Prepare 3-6 months living expenses for job search'
      ]
    };
    
    return suggestions[educationLevel] || [
      'Focus on developing relevant technical skills',
      'Build a professional network through LinkedIn',
      'Gain practical experience through projects or freelancing',
      'Prepare a professional resume and portfolio',
      'Research companies and roles that match your interests'
    ];
  };

  function prevStep() {
    let currentStepValue: Step = 'landing';
    const unsubscribe = currentStep.subscribe(value => currentStepValue = value);
    
    const stepOrder: Step[] = ['landing', 'login', 'preferences', 'skills', 'work', 'results', 'dashboard'];
    const currentIndex = stepOrder.indexOf(currentStepValue);
    if (currentIndex > 0) {
      currentStep.set(stepOrder[currentIndex - 1]);
    }
    
    unsubscribe();
  }

  function handleTryAgain() {
    error = '';
    currentStep.set('preferences');
  }

  function handleGoBackFromError() {
    error = '';
    currentStep.set('landing');
  }

  const restartAssessment = () => {
    resetFormData();
    resetCardPositions();
    currentStep.set('landing');
  };

  // Add function to navigate to dashboard
  function navigateToDashboard() {
    currentStep.set('dashboard');
  }
</script>

<svelte:head>
  <title>CareerGeenie - AI Career Guidance for Students</title>
  <meta name="description" content="Personalized career guidance with AI recommendations, CV parsing, and skill gap analysis for students." />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="icon" href="/logo1-Photoroom.png" type="image/png">
  <style>
    /* Prevent scrolling issues */
    html, body {
      overflow-x: hidden;
      width: 100%;
      position: relative;
    }
    
    /* Fix for iOS Safari */
    @supports (-webkit-touch-callout: none) {
      .landing-page {
        min-height: -webkit-fill-available;
      }
    }
  </style>
</svelte:head>

<!-- Smooth scrolling anchor -->
<div id="top"></div>

<!-- Progress Bar -->
{#if $currentStep === 'landing'}
  <div class="progress-bar" style="width: {scrollProgress}%"></div>
{/if}

{#if $currentStep === 'landing'}
  <div class="landing-page">
    <!-- Enhanced Navigation with scroll effect -->
    <nav class="navbar {isNavScrolled ? 'scrolled' : ''}" aria-label="Main navigation">
      <div class="nav-container">
        <!-- Updated Logo with click handler -->
        <div class="logo" on:click={scrollToTop} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && scrollToTop()}>
          <img src="/logo1-Photoroom.png" alt="CareerGeenie Logo" class="logo-img" crossorigin="anonymous" />
          <span>CareerGeenie</span>
        </div>
        <div class="nav-links">
          <button class="nav-link" on:click={() => scrollToSection('how-it-works')} aria-label="How It Works">How It Works</button>
          <button class="nav-link" on:click={() => scrollToSection('features')} aria-label="Features">Features</button>
          <button class="nav-link" on:click={() => scrollToSection('why')} aria-label="Why Choose Us">Why Us</button>
          {#if isLoggedIn}
            <div class="user-info">
              <div class="user-avatar">
                <i class="fas fa-user" aria-hidden="true"></i>
              </div>
              <span class="welcome">Hi, {userName}</span>
              <button class="nav-button logout" on:click={handleLogout} aria-label="Logout from your account">
                <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
              </button>
            </div>
          {:else}
            <button class="nav-button login" on:click={showLogin} aria-label="Login to your account">
              <i class="fas fa-sign-in-alt" aria-hidden="true"></i> Login
            </button>
            <button class="nav-button primary" on:click={showLogin} aria-label="Create new account">
              <i class="fas fa-user-plus" aria-hidden="true"></i> Sign Up
            </button>
          {/if}
        </div>
      </div>
    </nav>

    <!-- Hero Section with Parallax Effect -->
    <header class="hero">
      <div class="hero-background"></div>
      <div class="hero-container">
        <div class="hero-content">
          <div class="badge">
            <i class="fas fa-star" aria-hidden="true"></i> Built by Students, For Students
          </div>
          <h1 class="hero-title">
            <span class="title-line">Your AI Career</span>
            <span class="title-line">Companion</span>
          </h1>
          <p class="hero-subtitle">Personalized career guidance with AI recommendations, CV parsing, and skill gap analysis for students</p>
          <div class="hero-buttons">
            <button class="hero-button primary" on:click={startAssessment} aria-label="Start free career assessment">
              <i class="fas fa-play-circle" aria-hidden="true"></i> Start Free Assessment
              <div class="button-sparkle"></div>
            </button>
            {#if isLoggedIn}
              <!-- Updated button to navigate to dashboard -->
              <button class="hero-button secondary" on:click={navigateToDashboard} aria-label="View your dashboard">
                <i class="fas fa-chart-line" aria-hidden="true"></i> View Dashboard
              </button>
            {:else}
              <button class="hero-button secondary" on:click={showLogin} aria-label="Sign up for CareerGeenie">
                <i class="fas fa-user-plus" aria-hidden="true"></i> Sign Up Free
              </button>
            {/if}
          </div>
          <!-- Enhanced Student Stats -->
          <div class="hero-stats" aria-label="Platform statistics">
            <div class="stat">
              <div class="stat-number">5,000+</div>
              <div class="stat-label">Active Students</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-number">94%</div>
              <div class="stat-label">Satisfaction</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-number">30+</div>
              <div class="stat-label">University Partners</div>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <!-- Enhanced floating cards with 3D effect -->
          <div class="floating-card-container">
            <div 
              class="floating-card card-1 {activeCard === 'card-1' ? 'active' : ''}"
              style="z-index: {cardZIndices['card-1']};"
              on:click={() => bringCardToFront('card-1')}
              on:keydown={(e) => e.key === 'Enter' && bringCardToFront('card-1')}
              tabindex="0"
              role="button"
              aria-label="AI Career Match card - Click to bring to front"
            >
              <div class="card-icon">
                <i class="fas fa-brain" aria-hidden="true"></i>
              </div>
              <div class="card-glow"></div>
              <h3>AI Career Match</h3>
              <p>Find your perfect career path with our intelligent AI matching system</p>
              <div class="card-badge">
                <i class="fas fa-bolt" aria-hidden="true"></i> 92% Accuracy
              </div>
            </div>
            
            <div 
              class="floating-card card-2 {activeCard === 'card-2' ? 'active' : ''}"
              style="z-index: {cardZIndices['card-2']};"
              on:click={() => bringCardToFront('card-2')}
              on:keydown={(e) => e.key === 'Enter' && bringCardToFront('card-2')}
              tabindex="0"
              role="button"
              aria-label="Personal Roadmap card - Click to bring to front"
            >
              <div class="card-icon">
                <i class="fas fa-road" aria-hidden="true"></i>
              </div>
              <div class="card-glow"></div>
              <h3>Personal Roadmap</h3>
              <p>Step-by-step guidance tailored to your goals and timeline</p>
              <div class="card-badge">
                <i class="fas fa-calendar-check" aria-hidden="true"></i> 6-18 Month Plan
              </div>
            </div>
            
            <div 
              class="floating-card card-3 {activeCard === 'card-3' ? 'active' : ''}"
              style="z-index: {cardZIndices['card-3']};"
              on:click={() => bringCardToFront('card-3')}
              on:keydown={(e) => e.key === 'Enter' && bringCardToFront('card-3')}
              tabindex="0"
              role="button"
              aria-label="Skill Analysis card - Click to bring to front"
            >
              <div class="card-icon">
                <i class="fas fa-graduation-cap" aria-hidden="true"></i>
              </div>
              <div class="card-glow"></div>
              <h3>Skill Analysis</h3>
              <p>Identify skill gaps with personalized learning resources</p>
              <div class="card-badge">
                <i class="fas fa-chart-line" aria-hidden="true"></i> Progress Tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Animated Trust Badges -->
    <section class="trust-badges">
      <div class="trust-container">
        <div class="trust-item">
          <i class="fas fa-shield-alt" aria-hidden="true"></i>
          <span>100% Secure</span>
        </div>
        <div class="trust-item">
          <i class="fas fa-clock" aria-hidden="true"></i>
          <span>10-Minute Setup</span>
        </div>
        <div class="trust-item">
          <i class="fas fa-graduation-cap" aria-hidden="true"></i>
          <span>Student-Focused</span>
        </div>
        <div class="trust-item">
          <i class="fas fa-robot" aria-hidden="true"></i>
          <span>AI-Powered</span>
        </div>
      </div>
    </section>

    <!-- How It Works Section with Animated Steps -->
    <section id="how-it-works" class="how-it-works">
      <div class="section-header">
        <div class="badge">
          <i class="fas fa-play-circle" aria-hidden="true"></i> Simple Process
        </div>
        <h2>How It Works</h2>
        <p class="subtitle">Your Path to Career Success in 4 Simple Steps</p>
        <p class="description">Start your career journey in minutes. Our streamlined process makes it easy to get started with personalized career guidance tailored specifically for students.</p>
      </div>
      
      <div class="steps-container">
        <div class="steps-timeline">
          <div class="step-line"></div>
          
          <div class="step">
            <div class="step-number">
              <span>01</span>
            </div>
            <div class="step-icon">
              <div class="icon-circle">
                <i class="fas fa-user-circle" aria-hidden="true"></i>
              </div>
            </div>
            <div class="step-content">
              <h3>Create Your Profile</h3>
              <p>Sign up and tell us about your year level, program, skills, and career interests. We'll build a comprehensive profile to understand your unique strengths.</p>
              <ul class="step-features">
                <li><i class="fas fa-check" aria-hidden="true"></i> Academic background</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Skills assessment</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Interest mapping</li>
              </ul>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">
              <span>02</span>
            </div>
            <div class="step-icon">
              <div class="icon-circle">
                <i class="fas fa-file-alt" aria-hidden="true"></i>
              </div>
            </div>
            <div class="step-content">
              <h3>Build Your CV</h3>
              <p>Upload an existing CV or use our builder to create a professional, student-focused resume optimized for internships and entry-level positions.</p>
              <ul class="step-features">
                <li><i class="fas fa-check" aria-hidden="true"></i> Smart CV parsing</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Student templates</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> ATS optimization</li>
              </ul>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">
              <span>03</span>
            </div>
            <div class="step-icon">
              <div class="icon-circle">
                <i class="fas fa-robot" aria-hidden="true"></i>
              </div>
            </div>
            <div class="step-content">
              <h3>Get AI Recommendations</h3>
              <p>Our advanced AI analyzes your profile and suggests beginner-friendly career paths perfectly matched to your skills, interests, and program.</p>
              <ul class="step-features">
                <li><i class="fas fa-check" aria-hidden="true"></i> Personalized matches</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Industry insights</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Growth potential</li>
              </ul>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">
              <span>04</span>
            </div>
            <div class="step-icon">
              <div class="icon-circle">
                <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
              </div>
            </div>
            <div class="step-content">
              <h3>Follow Your Roadmap</h3>
              <p>Get a personalized roadmap with actionable steps, learning resources, and milestones to achieve your career goals within 6-18 months.</p>
              <ul class="step-features">
                <li><i class="fas fa-check" aria-hidden="true"></i> Step-by-step guidance</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Resource library</li>
                <li><i class="fas fa-check" aria-hidden="true"></i> Progress tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why CareerGeenie Section -->
    <section id="why" class="why-section">
      <div class="section-header">
        <div class="badge">
          <i class="fas fa-heart" aria-hidden="true"></i> Student First
        </div>
        <h2>Why CareerGeenie</h2>
        <p class="subtitle">Built by Students, For Students</p>
        <p class="description">Unlike generic career platforms, CareerGeenie understands that college students have unique needs. We focus on helping you take your first steps into the professional world.</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <h3>Designed exclusively for 1st-4th year college students</h3>
          <p>Tailored features for every stage of your college journey</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
        
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-robot" aria-hidden="true"></i>
          </div>
          <h3>AI-powered recommendations tailored to your program</h3>
          <p>Get personalized suggestions based on your field of study</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
        
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-chart-line" aria-hidden="true"></i>
          </div>
          <h3>Beginner-friendly career paths only - no advanced roles</h3>
          <p>Focus on entry-level positions and internships</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
        
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-file-contract" aria-hidden="true"></i>
          </div>
          <h3>Student-focused CV templates for internships</h3>
          <p>Professional templates designed for student applications</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
        
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-search" aria-hidden="true"></i>
          </div>
          <h3>Skill gap analysis with learning resources</h3>
          <p>Identify and bridge your skill gaps with curated resources</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
        
        <div class="feature-box">
          <div class="feature-icon">
            <i class="fas fa-history" aria-hidden="true"></i>
          </div>
          <h3>Track your progress with session history</h3>
          <p>Monitor your growth and achievements over time</p>
          <div class="feature-hover">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Features Showcase -->
    <section id="features" class="features-showcase">
      <div class="showcase-container">
        <div class="showcase-content">
          <div class="section-header">
            <h2>Powerful Features</h2>
            <p class="subtitle">Everything You Need to Launch Your Career</p>
          </div>
          
          <div class="features-tabs">
            <div class="tabs-header">
              {#each ['Student Profiling', 'AI Matching', 'CV Builder', 'Roadmaps', 'Skill Analysis', 'Progress Tracking'] as feature, i}
                <button 
                  class="tab-button {activeFeature === i ? 'active' : ''}" 
                  on:click={() => activeFeature = i}
                  aria-label={feature}
                >
                  {#if i === 0}
                    <i class="fas fa-user-graduate" aria-hidden="true"></i>
                  {:else if i === 1}
                    <i class="fas fa-robot" aria-hidden="true"></i>
                  {:else if i === 2}
                    <i class="fas fa-file-alt" aria-hidden="true"></i>
                  {:else if i === 3}
                    <i class="fas fa-map-signs" aria-hidden="true"></i>
                  {:else if i === 4}
                    <i class="fas fa-chart-bar" aria-hidden="true"></i>
                  {:else}
                    <i class="fas fa-history" aria-hidden="true"></i>
                  {/if}
                  {feature}
                </button>
              {/each}
            </div>
            
            <div class="tabs-content">
              {#if activeFeature === 0}
                <div class="tab-content">
                  <div class="content-left">
                    <h3>Smart Student Profiling</h3>
                    <p>Build a comprehensive profile with your skills, interests, projects, and extracurriculars. Our AI analyzes your unique combination to understand what makes you stand out.</p>
                    <ul class="feature-list">
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Academic background analysis</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Skills and competency mapping</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Interest and personality assessment</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Project and extracurricular tracking</li>
                    </ul>
                  </div>
                  <div class="content-right">
                    <div class="feature-visual">
                      <div class="visual-circle">
                        <i class="fas fa-user-graduate" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              {:else if activeFeature === 1}
                <div class="tab-content">
                  <div class="content-left">
                    <h3>AI-Powered Career Matching</h3>
                    <p>Our advanced algorithms match your profile with suitable career paths, considering market trends, growth potential, and your personal preferences.</p>
                    <ul class="feature-list">
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Real-time market analysis</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Personalized match scoring</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Industry trend insights</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Success probability metrics</li>
                    </ul>
                  </div>
                  <div class="content-right">
                    <div class="feature-visual">
                      <div class="visual-circle">
                        <i class="fas fa-robot" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              {:else if activeFeature === 2}
                <div class="tab-content">
                  <div class="content-left">
                    <h3>Smart CV Builder</h3>
                    <p>Create professional, student-focused CVs with templates designed specifically for internships and entry-level positions. Our AI suggests improvements in real-time.</p>
                    <ul class="feature-list">
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> ATS-optimized templates</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Real-time suggestions</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> Export in multiple formats</li>
                      <li><i class="fas fa-check-circle" aria-hidden="true"></i> One-click updates</li>
                    </ul>
                  </div>
                  <div class="content-right">
                    <div class="feature-visual">
                      <div class="visual-circle">
                        <i class="fas fa-file-alt" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials">
      <div class="section-header">
        <h2>Student Success Stories</h2>
        <p class="subtitle">See how CareerGeenie helped students like you</p>
      </div>
      
      <div class="testimonials-grid">
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="student-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex" crossorigin="anonymous" />
            </div>
            <div class="student-info">
              <h4>Alex Chen</h4>
              <p>Computer Science, 3rd Year</p>
            </div>
          </div>
          <div class="testimonial-content">
            <p>"CareerGeenie helped me land my dream internship at a tech startup. The AI recommendations were spot-on!"</p>
            <div class="rating">
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
            </div>
          </div>
        </div>
        
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="student-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" alt="Maria" crossorigin="anonymous" />
            </div>
            <div class="student-info">
              <h4>Maria Rodriguez</h4>
              <p>Business Administration, 2nd Year</p>
            </div>
          </div>
          <div class="testimonial-content">
            <p>"The roadmap feature gave me clear steps to follow. I went from unsure about my career to having multiple offers!"</p>
            <div class="rating">
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
            </div>
          </div>
        </div>
        
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="student-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" alt="Jordan" crossorigin="anonymous" />
            </div>
            <div class="student-info">
              <h4>Jordan Taylor</h4>
              <p>Psychology, 4th Year</p>
            </div>
          </div>
          <div class="testimonial-content">
            <p>"Skill gap analysis showed me exactly what I needed to learn. The curated resources were incredibly helpful."</p>
            <div class="rating">
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star" aria-hidden="true"></i>
              <i class="fas fa-star-half-alt" aria-hidden="true"></i>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced CTA Section -->
    <section class="cta-section">
      <div class="cta-background"></div>
      <div class="cta-container">
        <div class="cta-content">
          <div class="badge cta-badge">
            <i class="fas fa-rocket" aria-hidden="true"></i> Limited Time Offer
          </div>
          <h2>Ready to Launch Your Career?</h2>
          <p class="cta-description">Join thousands of students who found their perfect career path with CareerGeenie. Take the first step towards your dream career with our AI-powered assessment.</p>
          <div class="cta-buttons">
            <button class="cta-button primary" on:click={startAssessment} aria-label="Begin your career journey">
              <i class="fas fa-play-circle" aria-hidden="true"></i> Start Free Assessment
              <div class="button-sparkle"></div>
            </button>
            <button class="cta-button secondary" on:click={() => scrollToSection('how-it-works')} aria-label="Learn more about CareerGeenie">
              <i class="fas fa-play" aria-hidden="true"></i> Watch Demo
            </button>
          </div>
          <div class="cta-stats">
            <div class="cta-stat">
              <div class="stat-icon">
                <i class="fas fa-clock" aria-hidden="true"></i>
              </div>
              <div class="stat-details">
                <span class="stat-title">Only 10 minutes</span>
                <span class="stat-desc">Complete assessment</span>
              </div>
            </div>
            <div class="cta-stat">
              <div class="stat-icon">
                <i class="fas fa-user-check" aria-hidden="true"></i>
              </div>
              <div class="stat-details">
                <span class="stat-title">Free Forever</span>
                <span class="stat-desc">No credit card required</span>
              </div>
            </div>
            <div class="cta-stat">
              <div class="stat-icon">
                <i class="fas fa-chart-line" aria-hidden="true"></i>
              </div>
              <div class="stat-details">
                <span class="stat-title">Personalized Results</span>
                <span class="stat-desc">Tailored to you</span>
              </div>
            </div>
          </div>
        </div>
        <div class="cta-image">
          <div class="cta-visual">
            <div class="visual-main">
              <i class="fas fa-graduation-cap" aria-hidden="true"></i>
            </div>
            <div class="visual-badge success">
              <i class="fas fa-check-circle" aria-hidden="true"></i>
              <span>94% Success Rate</span>
            </div>
            <div class="visual-badge students">
              <i class="fas fa-users" aria-hidden="true"></i>
              <span>5K+ Students</span>
            </div>
            <div class="visual-badge satisfaction">
              <i class="fas fa-smile" aria-hidden="true"></i>
              <span>4.9/5 Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Footer - Fixed to remove extra space -->
    <footer class="footer">
      <div class="footer-background"></div>
      <div class="footer-container">
        <div class="footer-section main-section">
          <!-- Updated Footer Logo with click handler -->
          <div class="footer-logo" on:click={scrollToTop} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && scrollToTop()}>
            <img src="/logo1-Photoroom.png" alt="CareerGeenie Logo" class="footer-logo-img" crossorigin="anonymous" />
            <span>CareerGeenie</span>
          </div>
          <p class="footer-description">
            AI-powered career guidance platform designed specifically for students and recent graduates to help launch successful careers.
          </p>
          <div class="social-links">
            <a href="https://twitter.com/careergeenie" class="social-link" aria-label="Visit our Twitter page" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-twitter" aria-hidden="true"></i>
            </a>
            <a href="https://linkedin.com/company/careergeenie" class="social-link" aria-label="Visit our LinkedIn page" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-linkedin" aria-hidden="true"></i>
            </a>
            <a href="https://instagram.com/careergeenie" class="social-link" aria-label="Visit our Instagram page" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-instagram" aria-hidden="true"></i>
            </a>
            <a href="https://facebook.com/careergeenie" class="social-link" aria-label="Visit our Facebook page" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-facebook" aria-hidden="true"></i>
            </a>
            <a href="https://youtube.com/careergeenie" class="social-link" aria-label="Visit our YouTube channel" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-youtube" aria-hidden="true"></i>
            </a>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>Platform</h4>
          <ul class="footer-links">
            <li><a href="/features#profiling" aria-label="Learn about Student Profiling">Student Profiling</a></li>
            <li><a href="/features#ai-recommendations" aria-label="Learn about AI Recommendations">AI Recommendations</a></li>
            <li><a href="/features#cv-builder" aria-label="Learn about CV Builder">CV Builder</a></li>
            <li><a href="/features#skill-analysis" aria-label="Learn about Skill Analysis">Skill Analysis</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Resources</h4>
          <ul class="footer-links">
            <li><a href="/resources/guides" aria-label="View career guides">Career Guides</a></li>
            <li><a href="/blog" aria-label="Read our blog">Blog</a></li>
            <li><a href="/success-stories" aria-label="View success stories">Success Stories</a></li>
            <li><a href="/faq" aria-label="View frequently asked questions">FAQ</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Company</h4>
          <ul class="footer-links">
            <li><a href="/about" aria-label="About CareerGeenie">About Us</a></li>
            <li><a href="/contact" aria-label="Contact us">Contact</a></li>
            <li><a href="/partners" aria-label="Our partners">Partners</a></li>
            <li><a href="/careers" aria-label="Career opportunities">Careers</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Legal</h4>
          <ul class="footer-links">
            <li><a href="/privacy" aria-label="View privacy policy">Privacy Policy</a></li>
            <li><a href="/terms" aria-label="View terms of service">Terms of Service</a></li>
            <li><a href="/cookies" aria-label="View cookie policy">Cookie Policy</a></li>
            <li><a href="/accessibility" aria-label="Accessibility statement">Accessibility</a></li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="footer-bottom-container">
          <p>&copy; 2025 CareerGeenie. All rights reserved.</p>
          <div class="footer-extra">
            <span>Made with <i class="fas fa-heart" style="color: #ef4444;" aria-hidden="true"></i> for students worldwide</span>
            <span class="footer-divider"> </span>
            <a href="/sitemap" aria-label="Site map">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
{/if}

<div class="app-container">
  <!-- Global Loading Overlay -->
  {#if isLoading && $currentStep === 'work'}
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Generating your personalized career recommendations...</p>
      </div>
    </div>
  {/if}
  
  <!-- Global Error Message -->
  {#if error && $currentStep !== 'landing' && $currentStep !== 'login'}
    <div class="error-banner">
      <i class="fa-solid fa-exclamation-circle"></i>
      <span>{error}</span>
      <button class="error-close" on:click={() => error = ''} aria-label="Close error message">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  {/if}
  
  <!-- Step Content -->
  {#if $currentStep === 'login'}
    <Login
      on:loginSuccess={(e: CustomEvent<LoginData>) => handleLoginSuccess(e.detail)}
      on:back={handleBackToHome}
    />
  {:else if $currentStep === 'preferences'}
    <Preferences
      data={$preferencesData}
      progressWidth="33%"
      on:complete={handlePreferencesComplete}
      on:backToHome={handleBackToHome}
    />
  {:else if $currentStep === 'skills'}
    <Skills
      data={$skillsData}
      progressWidth="50%"
      on:complete={handleSkillsComplete}
      on:back={() => currentStep.set('preferences')}
    />
  {:else if $currentStep === 'work'}
    <WorkPreferences
      data={$workPreferencesData}
      progressWidth="75%"
      on:complete={handleWorkComplete}
      on:back={() => currentStep.set('skills')}
    />
  {:else if $currentStep === 'results'}
  <Results
    bind:recommendations={$resultsData.recommendations}
    bind:alternatePaths={$resultsData.alternatePaths}
    bind:jobLinks={$resultsData.jobLinks}
    bind:summaryData={$resultsData.summary}
    bind:userName={$resultsData.userName}
    on:navigateToDashboard={() => currentStep.set('dashboard')}
    on:navigateToLogin={() => currentStep.set('login')}
    on:navigateToHome={() => { currentStep.set('landing'); resetFormData(); }}
    on:restart={restartAssessment}
  />
  {:else if $currentStep === 'dashboard'}
  <Dashboard
    bind:recommendations={$resultsData.recommendations}
    bind:alternatePaths={$resultsData.alternatePaths}
    bind:jobLinks={$resultsData.jobLinks}
    bind:summaryData={$resultsData.summary}
    bind:userName={$resultsData.userName}
    on:logout={handleLogout}
    on:back={() => currentStep.set('landing')}
  />
{/if}
</div>

  <style>
    /* Enhanced Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :global(body) {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      color: #1e293b;
      line-height: 1.6;
      overflow-x: hidden;
      scroll-behavior: smooth;
      min-height: 100vh;
    }

    /* Enhanced Color Palette */
    :root {
      --primary-50: #ecfeff;
      --primary-100: #cffafe;
      --primary-200: #a5f3fc;
      --primary-300: #67e8f9;
      --primary-400: #22d3ee;
      --primary-500: #06b6d4;
      --primary-600: #0891b2;
      --primary-700: #0e7490;
      --primary-800: #155e75;
      --primary-900: #164e63;
      
      --secondary-50: #faf5ff;
      --secondary-100: #f3e8ff;
      --secondary-200: #e9d5ff;
      --secondary-300: #d8b4fe;
      --secondary-400: #c084fc;
      --secondary-500: #a855f7;
      --secondary-600: #9333ea;
      --secondary-700: #7e22ce;
      --secondary-800: #6b21a8;
      --secondary-900: #581c87;
      
      --accent-50: #fff7ed;
      --accent-100: #ffedd5;
      --accent-200: #fed7aa;
      --accent-300: #fdba74;
      --accent-400: #fb923c;
      --accent-500: #f97316;
      --accent-600: #ea580c;
      --accent-700: #c2410c;
      --accent-800: #9a3412;
      --accent-900: #7c2d12;
      
      --success-500: #10b981;
      --success-600: #059669;
      
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-300: #cbd5e1;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-600: #475569;
      --gray-700: #334155;
      --gray-800: #1e293b;
      --gray-900: #0f172a;
      --gray-950: #020617;
      
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
      --spacing-2xl: 3rem;
      --spacing-3xl: 4rem;
      --spacing-4xl: 6rem;
      --spacing-5xl: 8rem;
      
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      
      --radius-sm: 0.5rem;
      --radius-md: 0.75rem;
      --radius-lg: 1rem;
      --radius-xl: 1.5rem;
      --radius-2xl: 2rem;
      --radius-full: 9999px;
      
      --transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1);
      --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
      --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Progress Bar */
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
      z-index: 9999;
      transition: width 0.1s ease;
    }

    /* Enhanced Navigation */
    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: var(--spacing-md) 0;
      transition: all var(--transition-normal);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    }

    .navbar.scrolled {
      padding: var(--spacing-sm) 0;
      box-shadow: var(--shadow-lg);
      background: rgba(255, 255, 255, 0.98);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-family: 'Poppins', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--primary-600);
      transition: all var(--transition-normal);
      text-decoration: none;
      cursor: pointer;
      border: none;
      background: transparent;
      padding: var(--spacing-xs);
      border-radius: var(--radius-md);
    }

    .logo:hover {
      color: var(--primary-700);
      transform: translateY(-2px);
      background: var(--primary-50);
    }

    .logo:focus {
      outline: 2px solid var(--primary-500);
      outline-offset: 2px;
    }

    .logo-img {
      height: 40px;
      width: auto;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3));
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .nav-link {
      background: none;
      border: none;
      color: var(--gray-600);
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-normal);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      position: relative;
      overflow: hidden;
    }

    .nav-link:hover {
      color: var(--primary-600);
      background: var(--primary-50);
      transform: translateY(-1px);
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
      transition: all var(--transition-normal);
      transform: translateX(-50%);
    }

    .nav-link:hover::after {
      width: 60%;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--gray-100);
      border-radius: var(--radius-lg);
      border: 1px solid var(--gray-200);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.875rem;
    }

    .welcome {
      color: var(--gray-700);
      font-weight: 500;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .nav-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-lg);
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-normal);
      border: none;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      outline: none;
      position: relative;
      overflow: hidden;
    }

    .nav-button.login {
      background: transparent;
      color: var(--primary-600);
      border: 2px solid var(--primary-200);
    }

    .nav-button.login:hover {
      background: var(--primary-50);
      border-color: var(--primary-500);
      color: var(--primary-700);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .nav-button.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      color: white;
      box-shadow: var(--shadow-md);
    }

    .nav-button.primary:hover {
      background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .nav-button.logout {
      background: var(--gray-100);
      color: var(--gray-700);
      border: 1px solid var(--gray-300);
      padding: var(--spacing-xs) var(--spacing-md);
    }

    .nav-button.logout:hover {
      background: var(--gray-200);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Enhanced Hero Section */
    .hero {
      background: linear-gradient(135deg,
        rgba(6, 182, 212, 0.03) 0%,
        rgba(168, 85, 247, 0.03) 50%,
        rgba(249, 115, 22, 0.02) 100%
      );
      padding: calc(var(--spacing-5xl) + 60px) 0 var(--spacing-4xl);
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      display: flex;
      align-items: center;
    }

    .hero-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 50%);
      animation: gradientShift 20s ease infinite alternate;
    }

    @keyframes gradientShift {
      0% {
        transform: scale(1) rotate(0deg);
      }
      100% {
        transform: scale(1.1) rotate(3deg);
      }
    }

    .hero-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-3xl);
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .hero-content {
      animation: slideInLeft var(--transition-slow);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
      color: white;
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.6s ease-out;
    }

    .badge i {
      font-size: 0.875rem;
    }

    .hero-title {
      font-family: 'Poppins', sans-serif;
      font-size: 4rem;
      font-weight: 900;
      color: var(--gray-900);
      margin-bottom: var(--spacing-md);
      line-height: 1.1;
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }

    .title-line {
      display: block;
      background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--gray-600);
      margin-bottom: var(--spacing-2xl);
      max-width: 500px;
      line-height: 1.7;
      animation: fadeInUp 0.8s ease-out 0.4s both;
    }

    .hero-buttons {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-3xl);
      animation: fadeInUp 0.8s ease-out 0.6s both;
    }

    .hero-button {
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-radius: var(--radius-xl);
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-normal);
      border: none;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      outline: none;
      position: relative;
      overflow: hidden;
      min-width: 200px;
      justify-content: center;
    }

    .button-sparkle {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
      animation: sparkle 3s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes sparkle {
      0%, 100% {
        transform: translateX(-100%) translateY(-100%);
      }
      50% {
        transform: translateX(100%) translateY(100%);
      }
    }

    .hero-button.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      color: white;
      box-shadow: var(--shadow-xl);
    }

    .hero-button.primary:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: var(--shadow-2xl);
    }

    .hero-button.secondary {
      background: white;
      color: var(--primary-600);
      border: 2px solid var(--primary-200);
      box-shadow: var(--shadow-md);
    }

    .hero-button.secondary:hover {
      background: var(--primary-50);
      border-color: var(--primary-400);
      color: var(--primary-700);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .hero-stats {
      display: flex;
      align-items: center;
      gap: var(--spacing-2xl);
      padding-top: var(--spacing-xl);
      border-top: 2px solid var(--gray-200);
      animation: fadeInUp 0.8s ease-out 0.8s both;
    }

    .stat {
      text-align: center;
      flex: 1;
    }

    .stat-number {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--primary-600);
      margin-bottom: var(--spacing-xs);
      background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--gray-500);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: linear-gradient(180deg, transparent, var(--gray-300), transparent);
    }

    .hero-image {
      position: relative;
      height: 600px;
      animation: slideInRight var(--transition-slow);
    }

    /* Enhanced Floating Cards with 3D Effect */
    .floating-card-container {
      position: relative;
      height: 100%;
      width: 100%;
      perspective: 1000px;
    }

    .floating-card {
      position: absolute;
      background: white;
      padding: var(--spacing-xl);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-2xl);
      width: 300px;
      text-align: center;
      transition: all var(--transition-normal) cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border: 1px solid transparent;
      background-clip: padding-box;
      overflow: hidden;
      cursor: pointer;
      outline: none;
      animation-play-state: running;
      transform-style: preserve-3d;
      transform: translateZ(0);
    }

    .floating-card.active {
      transform: translateY(-20px) scale(1.1) rotateY(5deg);
      box-shadow: 
        0 50px 100px -20px rgba(6, 182, 212, 0.3),
        0 30px 60px -30px rgba(168, 85, 247, 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.8);
      animation-play-state: paused;
      z-index: 100 !important;
    }

    .floating-card:hover:not(.active) {
      transform: translateY(-10px) scale(1.05);
      box-shadow: var(--shadow-2xl);
    }

    .floating-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 60%, rgba(255, 255, 255, 0.3) 100%);
      z-index: 1;
      pointer-events: none;
    }

    .card-glow {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
      z-index: 0;
      opacity: 0;
      transition: opacity var(--transition-normal);
    }

    .floating-card.active .card-glow {
      opacity: 1;
      animation: glowPulse 2s ease-in-out infinite;
    }

    @keyframes glowPulse {
      0%, 100% {
        opacity: 0.5;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.1);
      }
    }

    .card-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--spacing-md);
      color: white;
      font-size: 2rem;
      transition: all var(--transition-normal);
      position: relative;
      z-index: 2;
      box-shadow: var(--shadow-lg);
    }

    .floating-card.active .card-icon {
      transform: scale(1.2) rotate(10deg);
      box-shadow: 
        0 10px 20px rgba(6, 182, 212, 0.3),
        inset 0 0 20px rgba(255, 255, 255, 0.5);
    }

    .floating-card h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      margin-bottom: var(--spacing-sm);
      color: var(--gray-800);
      font-weight: 700;
      transition: all var(--transition-normal);
      position: relative;
      z-index: 2;
    }

    .floating-card p {
      color: var(--gray-600);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
      position: relative;
      z-index: 2;
    }

    .card-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: rgba(6, 182, 212, 0.1);
      color: var(--primary-600);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      position: relative;
      z-index: 2;
    }

    .floating-card.card-1 {
      top: 10%;
      left: 5%;
      animation: floatCard1 8s ease-in-out infinite;
      transform-origin: center;
    }

    .floating-card.card-2 {
      top: 40%;
      left: 50%;
      transform: translateX(-50%);
      animation: floatCard2 10s ease-in-out infinite;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      color: white;
      width: 320px;
      z-index: 3;
      transform-origin: center;
    }

    .floating-card.card-2::before {
      background: linear-gradient(135deg, transparent 60%, rgba(255, 255, 255, 0.2) 100%);
    }

    .floating-card.card-2 .card-icon {
      background: white;
      color: var(--primary-500);
    }

    .floating-card.card-2 h3,
    .floating-card.card-2 p {
      color: white;
    }

    .floating-card.card-2 .card-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .floating-card.card-3 {
      top: 10%;
      right: 5%;
      animation: floatCard3 9s ease-in-out infinite;
      transform-origin: center;
    }

    @keyframes floatCard1 {
      0%, 100% { 
        transform: translateY(0) rotate(-5deg) scale(1); 
      }
      50% { 
        transform: translateY(-30px) rotate(5deg) scale(1.02); 
      }
    }

    @keyframes floatCard2 {
      0%, 100% { 
        transform: translate(-50%, 0) rotate(0deg) scale(1); 
      }
      50% { 
        transform: translate(-50%, -40px) rotate(3deg) scale(1.05); 
      }
    }

    @keyframes floatCard3 {
      0%, 100% { 
        transform: translateY(0) rotate(5deg) scale(1); 
      }
      50% { 
        transform: translateY(-25px) rotate(-5deg) scale(1.02); 
      }
    }

    /* Trust Badges */
    .trust-badges {
      padding: var(--spacing-xl) 0;
      background: white;
      border-top: 1px solid var(--gray-200);
      border-bottom: 1px solid var(--gray-200);
    }

    .trust-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--gray-700);
      font-weight: 500;
      font-size: 0.95rem;
      transition: all var(--transition-normal);
    }

    .trust-item:hover {
      color: var(--primary-600);
      transform: translateY(-2px);
    }

    .trust-item i {
      color: var(--primary-500);
      font-size: 1.25rem;
    }

    /* Enhanced How It Works Section */
    .how-it-works {
      padding: var(--spacing-4xl) 0;
      background: linear-gradient(180deg, var(--gray-50) 0%, #ffffff 100%);
      position: relative;
      overflow: hidden;
    }

    .section-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto var(--spacing-3xl);
      padding: 0 var(--spacing-xl);
    }

    .section-header h2 {
      font-family: 'Poppins', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      color: var(--gray-900);
      margin-bottom: var(--spacing-md);
      position: relative;
      display: inline-block;
    }

    .section-header h2::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 6px;
      background: linear-gradient(90deg, var(--primary-500), var(--accent-500));
      border-radius: var(--radius-full);
    }

    .subtitle {
      font-size: 1.5rem;
      color: var(--gray-700);
      margin-bottom: var(--spacing-md);
      font-weight: 600;
    }

    .description {
      font-size: 1.125rem;
      color: var(--gray-600);
      line-height: 1.7;
      max-width: 600px;
      margin: 0 auto;
    }

    .steps-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
    }

    .steps-timeline {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-xl);
      position: relative;
    }

    .step-line {
      position: absolute;
      top: 80px;
      left: 12.5%;
      right: 12.5%;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
      z-index: 0;
    }

    @media (max-width: 1024px) {
      .steps-timeline {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-2xl);
      }
      
      .step-line {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .steps-timeline {
        grid-template-columns: 1fr;
      }
    }

    .step {
      position: relative;
      background: white;
      padding: var(--spacing-2xl);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      border: 2px solid var(--gray-200);
      transition: all var(--transition-normal);
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 1;
    }

    .step:hover {
      transform: translateY(-10px);
      box-shadow: var(--shadow-2xl);
      border-color: var(--primary-300);
    }

    .step-number {
      font-family: 'Poppins', sans-serif;
      font-size: 4rem;
      font-weight: 900;
      color: var(--primary-100);
      position: absolute;
      top: -30px;
      right: 20px;
      line-height: 1;
      z-index: 1;
      opacity: 0.5;
    }

    .step-content {
      position: relative;
      z-index: 2;
      flex: 1;
    }

    .step-content h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      color: var(--gray-800);
      margin-bottom: var(--spacing-sm);
      font-weight: 700;
    }

    .step-content p {
      color: var(--gray-600);
      line-height: 1.6;
      margin-bottom: var(--spacing-lg);
    }

    .step-features {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
    }

    .step-features li {
      margin-bottom: var(--spacing-xs);
      font-size: 0.875rem;
      color: var(--gray-600);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .step-features i {
      color: var(--success-500);
    }

    .icon-circle {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2.5rem;
      margin: 0 auto var(--spacing-lg);
      box-shadow: var(--shadow-xl);
      transition: all var(--transition-normal);
    }

    .step:hover .icon-circle {
      transform: scale(1.1) rotate(10deg);
    }

    /* Why Section */
    .why-section {
      padding: var(--spacing-4xl) 0;
      background: white;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--spacing-xl);
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
    }

    .feature-box {
      background: var(--gray-50);
      padding: var(--spacing-xl);
      border-radius: var(--radius-lg);
      border: 2px solid transparent;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }

    .feature-box:hover {
      transform: translateY(-5px);
      border-color: var(--primary-300);
      box-shadow: var(--shadow-xl);
      background: white;
    }

    .feature-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, var(--primary-500), var(--accent-500));
    }

    .feature-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      margin-bottom: var(--spacing-lg);
      transition: all var(--transition-normal);
    }

    .feature-box:hover .feature-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .feature-box h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.25rem;
      color: var(--gray-800);
      margin-bottom: var(--spacing-sm);
      font-weight: 600;
    }

    .feature-box p {
      color: var(--gray-600);
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
    }

    .feature-hover {
      position: absolute;
      top: var(--spacing-xl);
      right: var(--spacing-xl);
      width: 40px;
      height: 40px;
      background: var(--primary-50);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-500);
      opacity: 0;
      transform: translateX(20px);
      transition: all var(--transition-normal);
    }

    .feature-box:hover .feature-hover {
      opacity: 1;
      transform: translateX(0);
    }

    /* Features Showcase */
    .features-showcase {
      padding: var(--spacing-4xl) 0;
      background: linear-gradient(135deg, var(--gray-50) 0%, #ffffff 100%);
    }

    .showcase-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
    }

    .features-tabs {
      background: white;
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .tabs-header {
      display: flex;
      flex-wrap: wrap;
      border-bottom: 2px solid var(--gray-200);
      background: var(--gray-50);
    }

    .tab-button {
      flex: 1;
      min-width: 150px;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      color: var(--gray-600);
      cursor: pointer;
      transition: all var(--transition-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    .tab-button:hover {
      color: var(--primary-600);
      background: var(--primary-50);
    }

    .tab-button.active {
      color: var(--primary-600);
      border-bottom-color: var(--primary-500);
      background: white;
    }

    .tabs-content {
      padding: var(--spacing-2xl);
    }

    .tab-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--spacing-2xl);
      align-items: center;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: var(--spacing-lg) 0 0;
    }

    .feature-list li {
      margin-bottom: var(--spacing-sm);
      font-size: 0.95rem;
      color: var(--gray-600);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .feature-list i {
      color: var(--success-500);
      font-size: 1rem;
    }

    .visual-circle {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 4rem;
      margin: 0 auto;
      box-shadow: var(--shadow-2xl);
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-20px) rotate(5deg);
      }
    }

    /* Testimonials */
    .testimonials {
      padding: var(--spacing-4xl) 0;
      background: white;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
      max-width: 1200px;
      margin: var(--spacing-2xl) auto 0;
      padding: 0 var(--spacing-xl);
    }

    .testimonial-card {
      background: var(--gray-50);
      padding: var(--spacing-xl);
      border-radius: var(--radius-xl);
      border: 2px solid var(--gray-200);
      transition: all var(--transition-normal);
    }

    .testimonial-card:hover {
      transform: translateY(-5px);
      border-color: var(--primary-300);
      box-shadow: var(--shadow-lg);
    }

    .testimonial-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .student-avatar img {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-full);
      object-fit: cover;
      border: 3px solid white;
      box-shadow: var(--shadow-md);
    }

    .student-info h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.125rem;
      color: var(--gray-800);
      margin-bottom: var(--spacing-xs);
      font-weight: 600;
    }

    .student-info p {
      color: var(--gray-600);
      font-size: 0.875rem;
    }

    .testimonial-content p {
      color: var(--gray-700);
      line-height: 1.6;
      font-style: italic;
      margin-bottom: var(--spacing-md);
    }

    .rating {
      display: flex;
      gap: var(--spacing-xs);
      color: var(--accent-500);
    }

    /* Enhanced CTA Section */
    .cta-section {
      background: linear-gradient(135deg, var(--primary-700), var(--secondary-800));
      color: white;
      padding: var(--spacing-5xl) 0;
      margin: 0;
      position: relative;
      overflow: hidden;
    }

    .cta-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
      animation: ctaBackground 20s ease infinite alternate;
    }

    @keyframes ctaBackground {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.2);
      }
    }

    .cta-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: var(--spacing-3xl);
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .cta-badge {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: var(--spacing-lg);
    }

    .cta-content h2 {
      font-family: 'Poppins', sans-serif;
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: var(--spacing-md);
      line-height: 1.2;
    }

    .cta-description {
      font-size: 1.25rem;
      opacity: 0.95;
      margin-bottom: var(--spacing-2xl);
      max-width: 600px;
      line-height: 1.7;
    }

    .cta-buttons {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-2xl);
      flex-wrap: wrap;
    }

    .cta-button {
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-radius: var(--radius-xl);
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-normal);
      border: none;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 220px;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .cta-button.primary {
      background: white;
      color: var(--primary-600);
      box-shadow: var(--shadow-2xl);
    }

    .cta-button.primary:hover:not(:disabled) {
      background: var(--gray-100);
      transform: translateY(-3px) scale(1.05);
      box-shadow: var(--shadow-2xl);
    }

    .cta-button.secondary {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      box-shadow: var(--shadow-md);
      backdrop-filter: blur(10px);
    }

    .cta-button.secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .cta-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-xl);
      margin-top: var(--spacing-xl);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: var(--spacing-xl);
    }

    .cta-stat {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-title {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .stat-desc {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .cta-visual {
      position: relative;
      width: 300px;
      height: 300px;
      margin: 0 auto;
    }

    .visual-main {
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
      color: white;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      animation: pulse 2s ease-in-out infinite;
    }

    .visual-badge {
      position: absolute;
      background: white;
      color: var(--primary-600);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      box-shadow: var(--shadow-lg);
      animation: floatBadge 3s ease-in-out infinite;
      white-space: nowrap;
    }

    .visual-badge.success {
      top: 20px;
      right: 0;
      background: var(--success-600);
      color: white;
      animation-delay: 0.5s;
    }

    .visual-badge.students {
      bottom: 40px;
      left: 0;
      background: white;
      color: var(--primary-600);
      animation-delay: 1s;
    }

    .visual-badge.satisfaction {
      top: 50%;
      right: -20px;
      transform: translateY(-50%);
      background: var(--accent-500);
      color: white;
      animation-delay: 1.5s;
    }

    @keyframes floatBadge {
      0%, 100% { 
        transform: translateY(0) rotate(0deg); 
      }
      50% { 
        transform: translateY(-10px) rotate(2deg); 
      }
    }

    /* Enhanced Footer */
    .footer {
      background: var(--gray-950);
      color: var(--gray-300);
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    .footer-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
    }

    .footer-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: var(--spacing-3xl) var(--spacing-xl);
      display: grid;
      grid-template-columns: 2fr repeat(4, 1fr);
      gap: var(--spacing-3xl);
      position: relative;
      z-index: 1;
    }

    @media (max-width: 1024px) {
      .footer-container {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .footer-container {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .footer-container {
        grid-template-columns: 1fr;
      }
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-family: 'Poppins', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      color: white;
      margin-bottom: var(--spacing-md);
      cursor: pointer;
      border: none;
      background: transparent;
      padding: var(--spacing-xs);
      border-radius: var(--radius-md);
      transition: all var(--transition-normal);
    }

    .footer-logo:hover {
      color: var(--primary-300);
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .footer-logo:focus {
      outline: 2px solid var(--primary-500);
      outline-offset: 2px;
    }

    .footer-logo-img {
      height: 40px;
      width: auto;
      display: block;
    }

    .footer-description {
      margin-bottom: var(--spacing-lg);
      line-height: 1.7;
      color: var(--gray-400);
      font-size: 0.95rem;
    }

    .social-links {
      display: flex;
      gap: var(--spacing-sm);
    }

    .social-link {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--gray-800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-300);
      text-decoration: none;
      transition: all var(--transition-normal);
    }

    .social-link:hover {
      background: var(--primary-600);
      color: white;
      transform: translateY(-3px);
    }

    .footer-section h4 {
      color: white;
      font-family: 'Poppins', sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: var(--spacing-lg);
      position: relative;
      padding-bottom: var(--spacing-sm);
    }

    .footer-section h4::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-500), var(--accent-500));
      border-radius: var(--radius-full);
    }

    .footer-links {
      list-style: none;
      padding: 0;
    }

    .footer-links li {
      margin-bottom: var(--spacing-sm);
    }

    .footer-links a {
      color: var(--gray-400);
      text-decoration: none;
      transition: all var(--transition-normal);
      font-size: 0.95rem;
      display: inline-block;
      padding: var(--spacing-xs) 0;
    }

    .footer-links a:hover {
      color: var(--primary-300);
      transform: translateX(5px);
    }

    .footer-bottom {
      background: var(--gray-950);
      padding: var(--spacing-lg) 0;
      border-top: 1px solid var(--gray-800);
      position: relative;
      z-index: 1;
    }

    .footer-bottom-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 var(--spacing-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .footer-bottom p {
      color: var(--gray-500);
      font-size: 0.875rem;
    }

    .footer-extra {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--gray-500);
      font-size: 0.875rem;
    }

    .footer-divider {
      opacity: 0.5;
    }

    .footer-extra a {
      color: var(--gray-400);
      text-decoration: none;
      transition: all var(--transition-normal);
    }

    .footer-extra a:hover {
      color: var(--primary-300);
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      backdrop-filter: blur(4px);
    }

    .loading-spinner {
      text-align: center;
      color: white;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid var(--gray-200);
      border-top-color: var(--primary-500);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-xl);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Error Banner */
    .error-banner {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      z-index: 999;
      box-shadow: var(--shadow-lg);
      animation: slideDown 0.3s ease-out;
      max-width: 90%;
      width: fit-content;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .error-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      transition: all var(--transition-normal);
    }

    .error-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes pulse {
      0%, 100% { 
        transform: translate(-50%, -50%) scale(1); 
        opacity: 1;
      }
      50% { 
        transform: translate(-50%, -50%) scale(1.05); 
        opacity: 0.8;
      }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
        gap: var(--spacing-2xl);
      }

      .hero-subtitle {
        margin: 0 auto var(--spacing-2xl);
      }

      .hero-buttons {
        justify-content: center;
      }

      .hero-stats {
        justify-content: center;
      }

      .hero-image {
        height: 500px;
        margin-top: var(--spacing-xl);
      }

      .cta-container {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .cta-buttons {
        justify-content: center;
      }

      .cta-image {
        order: -1;
        margin-bottom: var(--spacing-xl);
      }

      .floating-card {
        position: relative;
        width: 100%;
        max-width: 300px;
        margin: 0 auto var(--spacing-lg);
        animation: none !important;
      }

      .floating-card.card-2 {
        position: relative;
        left: auto;
        transform: none;
        margin: var(--spacing-lg) auto;
      }

      .tab-content {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .visual-circle {
        margin-top: var(--spacing-xl);
      }

      .cta-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .nav-links {
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .cta-content h2 {
        font-size: 2.5rem;
      }

      .hero-buttons,
      .cta-buttons {
        flex-direction: column;
      }

      .hero-button,
      .cta-button {
        width: 100%;
        justify-content: center;
      }

      .hero-stats {
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .stat-divider {
        display: none;
      }

      .floating-card {
        position: relative;
        width: 100%;
        max-width: 300px;
        margin: 0 auto var(--spacing-lg);
        animation: none;
      }

      .hero-image {
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .features-grid,
      .testimonials-grid {
        grid-template-columns: 1fr;
      }

      .tabs-header {
        flex-direction: column;
      }

      .tab-button {
        min-width: 100%;
      }

      .error-banner {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
      }

      .footer-bottom-container {
        flex-direction: column;
        text-align: center;
      }

      .section-header h2 {
        font-size: 2.5rem;
      }

      .step {
        padding: var(--spacing-lg);
      }

      .step-number {
        font-size: 2.5rem;
        top: -20px;
      }
    }

    @media (max-width: 480px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .section-header h2 {
        font-size: 2rem;
      }

      .cta-content h2 {
        font-size: 2rem;
      }

      .hero-container,
      .features-showcase,
      .cta-container,
      .footer-container {
        padding: 0 var(--spacing-md);
      }

      .badge {
        font-size: 0.75rem;
        padding: var(--spacing-xs) var(--spacing-md);
      }

      .nav-button {
        padding: var(--spacing-xs) var(--spacing-md);
        font-size: 0.875rem;
      }

      .hero-button,
      .cta-button {
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: 0.875rem;
        min-width: auto;
      }
    }
  </style>