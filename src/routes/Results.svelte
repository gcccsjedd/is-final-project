<!-- Results.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { supabase } from '../lib/supabase';
  import { saveAssessment } from '../lib/assessmentUtils';
  import { createEventDispatcher } from 'svelte';
  
  // Types matching backend
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
    jobLinks?: JobLink[];
  }

  interface JobLink {
    platform: string;
    url: string;
    title?: string;
  }

  interface AlternatePath {
    title: string;
    matchPercentage: number;
    description?: string;
    icon?: string;
    gradient?: string;
  }

  interface SummaryData {
    topMatch: number;
    averageMatch: number;
    totalRecommendations: number;
    suggestedNextSteps: string[];
    timelineSuggestions: string[];
  }

  type ToastType = 'success' | 'warning' | 'info' | 'error';

  export let recommendations: CareerMatch[] = [];
  export let alternatePaths: AlternatePath[] = [];
  export let jobLinks: string[] = [];
  export let summaryData: SummaryData | null = null;
  export let userName = '';

  // Create event dispatcher
  const dispatch = createEventDispatcher();

  // Reactive state
  let isLoading = false;
  let activeToast: { message: string; type: ToastType } | null = null;
  let expandedDetails: boolean[] = [];

  // Default summary data if none provided
  const defaultSummaryData: SummaryData = {
    topMatch: 0,
    averageMatch: 0,
    totalRecommendations: 0,
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
  };

  // Safe getter for summary data
  const getSummaryData = (): SummaryData => {
    return summaryData || defaultSummaryData;
  };

  // Default icons for career types
  const careerIcons: Record<string, string> = {
    'Developer': 'fa-solid fa-code',
    'Analyst': 'fa-solid fa-chart-line',
    'Designer': 'fa-solid fa-paintbrush',
    'Manager': 'fa-solid fa-users',
    'Engineer': 'fa-solid fa-gears',
    'Specialist': 'fa-solid fa-user-tie',
    'Coordinator': 'fa-solid fa-calendar-check',
    'Assistant': 'fa-solid fa-headset',
    'Technician': 'fa-solid fa-wrench',
    'Default': 'fa-solid fa-briefcase'
  };

  // Default gradients for career types
  const careerGradients: Record<string, string> = {
    'technology': 'from-purple-500 to-indigo-500',
    'business': 'from-blue-500 to-cyan-500',
    'healthcare': 'from-rose-500 to-pink-500',
    'creative': 'from-pink-500 to-rose-500',
    'education': 'from-yellow-500 to-amber-500',
    'engineering': 'from-violet-500 to-purple-500',
    'default': 'from-slate-500 to-gray-500'
  };

  // Platform configurations for job search URLs - ONLY LINKEDIN AND INDEED
  const jobPlatforms = {
    linkedin: {
      name: 'LinkedIn',
      baseUrl: 'https://www.linkedin.com/jobs/search/?keywords=',
      icon: 'fa-brands fa-linkedin',
      color: '#0A66C2'
    },
    indeed: {
      name: 'Indeed',
      baseUrl: 'https://www.indeed.com/jobs?q=',
      icon: 'fa-solid fa-briefcase',
      color: '#2164F3'
    }
  };

  // Calculate summary statistics from data
  $: topMatchScore = recommendations.length > 0 ? recommendations[0].matchPercentage : 0;
  $: averageMatchScore = getSummaryData().averageMatch || (recommendations.length > 0 
    ? Math.round(recommendations.reduce((sum, job) => sum + job.matchPercentage, 0) / recommendations.length)
    : 0);
  $: totalRecommendations = (recommendations.length || 0) + (alternatePaths.length || 0);

  // Initialize expanded details array
  $: if (recommendations.length > 0 && expandedDetails.length === 0) {
    expandedDetails = new Array(recommendations.length).fill(false);
  }

  // Lifecycle
  onMount(() => {
    console.log('Results component mounted with data:', {
      recommendationsCount: recommendations.length,
      alternatePathsCount: alternatePaths.length,
      jobLinksCount: jobLinks.length,
      summaryData: summaryData
    });
    
    if (recommendations.length > 0) {
      showToast(`Found ${recommendations.length} perfect career matches for you!`, 'success');
    }
  });

  // Helper functions
  const getMatchGradient = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 80) return 'from-blue-500 to-cyan-500';
    if (percentage >= 70) return 'from-purple-500 to-indigo-500';
    if (percentage >= 60) return 'from-amber-500 to-orange-500';
    return 'from-slate-500 to-gray-500';
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#8b5cf6';
    if (percentage >= 60) return '#f59e0b';
    return '#64748b';
  };

  const getCareerIcon = (title: string, industry?: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('programmer') || titleLower.includes('engineer')) 
      return careerIcons['Developer'];
    if (titleLower.includes('analyst') || titleLower.includes('data')) 
      return careerIcons['Analyst'];
    if (titleLower.includes('designer') || titleLower.includes('creative')) 
      return careerIcons['Designer'];
    if (titleLower.includes('manager') || titleLower.includes('director')) 
      return careerIcons['Manager'];
    if (titleLower.includes('engineer') || titleLower.includes('technician')) 
      return careerIcons['Engineer'];
    if (titleLower.includes('specialist') || titleLower.includes('expert')) 
      return careerIcons['Specialist'];
    if (titleLower.includes('coordinator') || titleLower.includes('planner')) 
      return careerIcons['Coordinator'];
    if (titleLower.includes('assistant') || titleLower.includes('support')) 
      return careerIcons['Assistant'];
    
    if (industry) {
      const industryLower = industry.toLowerCase();
      if (industryLower.includes('tech')) return careerIcons['Developer'];
      if (industryLower.includes('business')) return careerIcons['Manager'];
      if (industryLower.includes('health')) return careerIcons['Specialist'];
      if (industryLower.includes('creative')) return careerIcons['Designer'];
    }
    
    return careerIcons['Default'];
  };

  const getCareerGradient = (industry?: string) => {
    if (!industry) return careerGradients['default'];
    
    const industryLower = industry.toLowerCase();
    if (industryLower.includes('tech')) return careerGradients['technology'];
    if (industryLower.includes('business')) return careerGradients['business'];
    if (industryLower.includes('health')) return careerGradients['healthcare'];
    if (industryLower.includes('creative') || industryLower.includes('design')) 
      return careerGradients['creative'];
    if (industryLower.includes('education') || industryLower.includes('training')) 
      return careerGradients['education'];
    if (industryLower.includes('engineer') || industryLower.includes('technical')) 
      return careerGradients['engineering'];
    
    return careerGradients['default'];
  };

  // Generate job search URLs for a career title - ONLY LINKEDIN AND INDEED
  const generateJobLinks = (careerTitle: string): JobLink[] => {
    const encodedTitle = encodeURIComponent(careerTitle);
    
    return [
      {
        platform: 'linkedin',
        url: `${jobPlatforms.linkedin.baseUrl}${encodedTitle}`,
        title: careerTitle
      },
      {
        platform: 'indeed',
        url: `${jobPlatforms.indeed.baseUrl}${encodedTitle}`,
        title: careerTitle
      }
    ];
  };

  // Validate and fix job links
  const getValidJobLinks = (careerTitle: string): JobLink[] => {
    // If career has its own jobLinks property, use those and filter to only LinkedIn/Indeed
    const career = recommendations.find(r => r.title === careerTitle);
    if (career?.jobLinks && career.jobLinks.length > 0) {
      // Filter to only include LinkedIn and Indeed if they exist in the provided links
      return career.jobLinks.filter(link => 
        link.platform.toLowerCase() === 'linkedin' || 
        link.platform.toLowerCase() === 'indeed'
      );
    }
    
    // Otherwise generate links for LinkedIn and Indeed only
    return generateJobLinks(careerTitle);
  };

  // Get platform display info
  const getPlatformInfo = (platform: string) => {
    const platformKey = platform.toLowerCase();
    if (platformKey === 'linkedin' || platformKey === 'indeed') {
      return jobPlatforms[platformKey as keyof typeof jobPlatforms];
    }
    
    // Default fallback
    return {
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      icon: 'fa-solid fa-globe',
      color: '#64748b'
    };
  };

  // Toast system
  const showToast = (message: string, type: ToastType = 'info') => {
    if (activeToast?.message === message) return;
    
    activeToast = { message, type };
    
    setTimeout(() => {
      activeToast = null;
    }, 3000);
  };

  // Toggle details
  const toggleDetails = (index: number) => {
    expandedDetails[index] = !expandedDetails[index];
    expandedDetails = [...expandedDetails];
  };

  // Save results and navigate to dashboard
  const handleContinueToDashboard = async () => {
    try {
      isLoading = true;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please log in to save your results', 'warning');
        // Dispatch event to navigate to login
        dispatch('navigateToLogin');
        return;
      }

      // Prepare assessment data
      const assessmentData = {
        match_score: topMatchScore,
        top_careers: recommendations,
        full_results: {
          recommendations: recommendations,
          alternatePaths: alternatePaths,
          jobLinks: jobLinks,
          summaryData: getSummaryData(),
          userName: userName || 'User'
        }
      };
      
      console.log('Saving assessment data:', assessmentData);

      // Save assessment to database
      const result = await saveAssessment(supabase, user.id, assessmentData, userName);
      
      if (!result.success) {
        showToast('Failed to save assessment results. Please try again.', 'warning');
        isLoading = false;
        return;
      }

      // Store results in localStorage for immediate access
      localStorage.setItem('latestAssessment', JSON.stringify({
        ...assessmentData,
        id: result.assessmentId || 'local-' + Date.now(),
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        user_id: user.id
      }));

      showToast('Assessment results saved successfully!', 'success');

      // Dispatch custom event to parent to navigate to dashboard
      setTimeout(() => {
        dispatch('navigateToDashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Error saving assessment:', error);
      showToast('Failed to save assessment. Please try again.', 'error');
    } finally {
      isLoading = false;
    }
  };

  // Copy link
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
  };

  // Format salary display
  const formatSalary = (salary?: string) => {
    if (!salary) return 'Competitive salary';
    return salary;
  };

  // Start new assessment
  const startNewAssessment = () => {
    dispatch('navigateToHome');
  };

  // Open job search in new tab
  const openJobSearch = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
</script>

<div class="results-page">
  <!-- Toast Notification -->
  {#if activeToast}
    <div class="toast toast--{activeToast.type}" transition:fade>
      <div class="toast-icon">
        {#if activeToast.type === 'success'}
          <div class="icon-wrapper success">
            <i class="fa-solid fa-check-circle"></i>
          </div>
        {:else if activeToast.type === 'warning'}
          <div class="icon-wrapper warning">
            <i class="fa-solid fa-exclamation-circle"></i>
          </div>
        {:else if activeToast.type === 'error'}
          <div class="icon-wrapper error">
            <i class="fa-solid fa-exclamation-triangle"></i>
          </div>
        {:else}
          <div class="icon-wrapper info">
            <i class="fa-solid fa-info-circle"></i>
          </div>
        {/if}
      </div>
      <span class="toast-message">{activeToast.message}</span>
      <button class="toast-close" on:click={() => activeToast = null} aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  {/if}

  <!-- Background Elements -->
  <div class="background-elements">
    <div class="bg-gradient"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
  </div>

  <div class="results-header">
    <div class="header-content">
      <div class="header-title">
        <i class="fa-solid fa-trophy header-icon"></i>
        <h1>Career Pathfinder Results</h1>
      </div>
      <p class="header-subtitle">
        {#if userName}
          Welcome, {userName}! Based on your profile, skills, and preferences, here are your personalized career matches
        {:else}
          Your personalized career matches based on skills, preferences, and academic background
        {/if}
      </p>
    </div>
  </div>

  <div class="full-width-container">
    <section class="results-content">
      <!-- Progress Section -->
      <div class="progress-container">
        <div class="progress-info">
          <div class="progress-step">
            <div class="step-number">1</div>
            <span class="step-label">Profile</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">2</div>
            <span class="step-label">Preferences</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">3</div>
            <span class="step-label">Skills</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">4</div>
            <span class="step-label">Work</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
          </div>
          <div class="progress-step active">
            <div class="step-number">5</div>
            <span class="step-label">Results</span>
          </div>
        </div>
        <div class="progress-text">Step 5 of 5 • 100% complete</div>
      </div>

      <div class="content-header">
        <div class="content-title">
          <h2>Your Career Analysis</h2>
          <p class="content-subtitle">Based on your profile, skills, and preferences, here are your top career matches</p>
        </div>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{topMatchScore}%</div>
              <div class="stat-label">Top Match Score</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{averageMatchScore}%</div>
              <div class="stat-label">Average Match</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
              <i class="fa-solid fa-lightbulb"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{totalRecommendations}</div>
              <div class="stat-label">Total Recommendations</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Career Matches -->
      {#if recommendations.length > 0}
        <div class="section-card">
          <div class="section-header">
            <div class="title-icon" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1)); border-color: rgba(16, 185, 129, 0.3); color: #34d399;">
              <i class="fa-solid fa-check-circle"></i>
            </div>
            <div class="title-content">
              <h3>Top Career Matches</h3>
              <span class="section-subtitle">These roles align best with your skills and preferences</span>
            </div>
            <div class="section-badge">
              <i class="fa-solid fa-crosshairs"></i>
              <span>Best Fit</span>
            </div>
          </div>

          <div class="matches-grid">
            {#each recommendations as match, i}
              <div class="match-card" style="--match-gradient: {match.gradient || getCareerGradient(match.industry)}">
                <div class="match-header">
                  <div class="match-score" style="background: linear-gradient(135deg, {getMatchGradient(match.matchPercentage).replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                    <div class="score-value">{match.matchPercentage}%</div>
                    <div class="score-label">Match</div>
                  </div>
                  <div class="match-title">
                    <h4>{match.title}</h4>
                    {#if match.industry}
                      <span class="match-industry">
                        <i class="fa-solid fa-building"></i> {match.industry}
                      </span>
                    {/if}
                  </div>
                </div>

                <div class="match-content">
                  <div class="match-icon" style="background: linear-gradient(135deg, {getMatchGradient(match.matchPercentage).replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                    <i class="{match.icon || getCareerIcon(match.title, match.industry)}"></i>
                  </div>
                  
                  <div class="match-details">
                    {#if match.strengths && match.strengths.length > 0}
                      <div class="detail-item">
                        <i class="fa-solid fa-check" style="color: {getMatchColor(match.matchPercentage)}"></i>
                        <span>Strengths: {match.strengths.slice(0, 3).join(', ')}</span>
                      </div>
                    {/if}
                    
                    {#if match.salary}
                      <div class="detail-item">
                        <i class="fa-solid fa-dollar-sign" style="color: {getMatchColor(match.matchPercentage)}"></i>
                        <span>Salary: {formatSalary(match.salary)}</span>
                      </div>
                    {/if}
                    
                    {#if match.educationRequired}
                      <div class="detail-item">
                        <i class="fa-solid fa-graduation-cap" style="color: {getMatchColor(match.matchPercentage)}"></i>
                        <span>Education: {match.educationRequired}</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="match-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: {match.matchPercentage}%; background: linear-gradient(90deg, {getMatchGradient(match.matchPercentage).replace('from-', '').replace('to-', '').replace(' ', ', ')})"></div>
                  </div>
                  <div class="progress-labels">
                    <span>Low Fit</span>
                    <span>Perfect Fit</span>
                  </div>
                </div>

                <button class="details-btn" on:click={() => toggleDetails(i)} aria-label="{expandedDetails[i] ? 'Hide' : 'Show'} details for {match.title}">
                  {expandedDetails[i] ? 'Hide Details' : 'Show Details'}
                  <i class="fa-solid fa-chevron-down {expandedDetails[i] ? 'rotate' : ''}"></i>
                </button>

                {#if expandedDetails[i]}
                  <div class="details-section" transition:fade>
                    {#if match.matchReason}
                      <div class="detail-section">
                        <h5>Why This Matches You</h5>
                        <p>{match.matchReason}</p>
                      </div>
                    {/if}
                    
                    {#if match.responsibilities}
                      <div class="detail-section">
                        <h5>Key Responsibilities</h5>
                        <p>{match.responsibilities}</p>
                      </div>
                    {/if}
                    
                    {#if match.requiredSkills && match.requiredSkills.length > 0}
                      <div class="detail-section">
                        <h5>Key Skills Needed</h5>
                        <div class="skills-container">
                          {#each match.requiredSkills as skill}
                            <span class="skill-tag">{skill}</span>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    {#if match.skillsToDevelop && match.skillsToDevelop.length > 0}
                      <div class="detail-section">
                        <h5>Skills to Develop</h5>
                        <div class="skills-container">
                          {#each match.skillsToDevelop as skill}
                            <span class="skill-tag developmental">{skill}</span>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    {#if match.localCompanies && match.localCompanies.length > 0}
                      <div class="detail-section">
                        <h5>Local Companies</h5>
                        <p>{match.localCompanies.join(', ')}</p>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Job Links Section - Now only LinkedIn and Indeed -->
                <div class="job-links-section">
                  <h5 class="job-links-title">
                    <i class="fa-solid fa-briefcase"></i>
                    Find {match.title} Jobs
                  </h5>
                  <div class="job-links-grid two-columns">
                    {#each getValidJobLinks(match.title) as jobLink}
                      <button 
                        class="job-platform-btn"
                        on:click={() => openJobSearch(jobLink.url)}
                        style="--platform-color: {getPlatformInfo(jobLink.platform).color}"
                        title="Search on {getPlatformInfo(jobLink.platform).name}"
                      >
                        <i class="{getPlatformInfo(jobLink.platform).icon}"></i>
                        <span>{getPlatformInfo(jobLink.platform).name}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="section-card">
          <div class="section-header">
            <div class="title-icon" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1)); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">
              <i class="fa-solid fa-exclamation-circle"></i>
            </div>
            <div class="title-content">
              <h3>No Matches Found</h3>
              <span class="section-subtitle">Try adjusting your preferences or skills to get better matches</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Alternative Career Paths -->
      {#if alternatePaths.length > 0}
        <div class="section-card">
          <div class="section-header">
            <div class="title-icon" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1)); border-color: rgba(139, 92, 246, 0.3); color: #a78bfa;">
              <i class="fa-solid fa-compass"></i>
            </div>
            <div class="title-content">
              <h3>Alternative Career Paths</h3>
              <span class="section-subtitle">Explore these related fields that match your transferable skills</span>
            </div>
            <div class="section-badge">
              <i class="fa-solid fa-network-wired"></i>
              <span>Explore</span>
            </div>
          </div>

          <div class="paths-grid">
            {#each alternatePaths as path}
              <div class="path-card" style="--path-gradient: {path.gradient || getMatchGradient(path.matchPercentage)}">
                <div class="path-icon" style="background: linear-gradient(135deg, {getMatchGradient(path.matchPercentage).replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{path.icon || 'fa-solid fa-lightbulb'}"></i>
                </div>
                <div class="path-content">
                  <h4>{path.title}</h4>
                  {#if path.description}
                    <p class="path-description">{path.description}</p>
                  {/if}
                  <div class="path-match">
                    <span class="match-score">{path.matchPercentage}% Match</span>
                    <div class="path-progress">
                      <div class="progress-fill" style="width: {path.matchPercentage}%"></div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Job Search Resources - Using generated links from recommendations -->
      {#if recommendations.length > 0}
        <div class="section-card">
          <div class="section-header">
            <div class="title-icon" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1)); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa;">
              <i class="fa-solid fa-link"></i>
            </div>
            <div class="title-content">
              <h3>Quick Job Search</h3>
              <span class="section-subtitle">Start your job search with these trusted platforms</span>
            </div>
            <div class="section-badge">
              <i class="fa-solid fa-rocket"></i>
              <span>Get Started</span>
            </div>
          </div>

          <div class="resources-grid">
            <!-- Show links for top 3 recommendations -->
            {#each recommendations.slice(0, 3) as match}
              {@const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(match.title)}`}
              {@const indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(match.title)}`}
              
              <!-- LinkedIn Card -->
              <div class="resource-card">
                <div class="resource-icon" style="background: #0A66C2">
                  <i class="fa-brands fa-linkedin"></i>
                </div>
                <div class="resource-content">
                  <h4>{match.title}</h4>
                  <p class="resource-platform">
                    <i class="fa-brands fa-linkedin"></i> LinkedIn
                  </p>
                  <div class="resource-actions">
                    <button class="resource-link" on:click={() => openJobSearch(linkedinUrl)}>
                      View Jobs
                      <i class="fa-solid fa-external-link-alt"></i>
                    </button>
                    <button class="copy-link" on:click={() => copyLink(linkedinUrl)} aria-label="Copy link to clipboard">
                      <i class="fa-solid fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Indeed Card -->
              <div class="resource-card">
                <div class="resource-icon" style="background: #2164F3">
                  <i class="fa-solid fa-briefcase"></i>
                </div>
                <div class="resource-content">
                  <h4>{match.title}</h4>
                  <p class="resource-platform">
                    <i class="fa-solid fa-briefcase"></i> Indeed
                  </p>
                  <div class="resource-actions">
                    <button class="resource-link" on:click={() => openJobSearch(indeedUrl)}>
                      View Jobs
                      <i class="fa-solid fa-external-link-alt"></i>
                    </button>
                    <button class="copy-link" on:click={() => copyLink(indeedUrl)} aria-label="Copy link to clipboard">
                      <i class="fa-solid fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Next Steps & Actions -->
      <div class="section-card">
        <div class="section-header">
          <div class="title-icon" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1)); border-color: rgba(245, 158, 11, 0.3); color: #fbbf24;">
            <i class="fa-solid fa-rocket"></i>
          </div>
          <div class="title-content">
            <h3>Your Action Plan</h3>
            <span class="section-subtitle">Take action to advance your career journey</span>
          </div>
        </div>

        <div class="next-steps">
          <div class="step-card">
            <div class="step-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
              <i class="fa-solid fa-list-check"></i>
            </div>
            <h4>Next Steps</h4>
            <ul>
              {#each getSummaryData().suggestedNextSteps.slice(0, 3) as step}
                <li>{step}</li>
              {/each}
            </ul>
          </div>
          <div class="step-card">
            <div class="step-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
              <i class="fa-solid fa-calendar-alt"></i>
            </div>
            <h4>Timeline</h4>
            <ul>
              {#each getSummaryData().timelineSuggestions.slice(0, 3) as step}
                <li>{step}</li>
              {/each}
            </ul>
          </div>
          <div class="step-card">
            <div class="step-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6)">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <h4>Skill Development</h4>
            <p>Focus on developing key skills mentioned in your top matches</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="action-btn secondary" on:click={startNewAssessment}>
          <i class="fa-solid fa-rotate-left"></i>
          <span>Start New Assessment</span>
        </button>
        <button class="action-btn primary glow" on:click={handleContinueToDashboard} disabled={isLoading}>
          {#if isLoading}
            <div class="button-loader"></div>
            <span>Saving Results...</span>
          {:else}
            <i class="fa-solid fa-check-circle"></i>
            <span>Save & Go to Dashboard</span>
          {/if}
        </button>
      </div>
    </section>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

  :global(:root) {
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    --gradient-secondary: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-error: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  }

  .results-page {
    min-height: 100vh;
    padding: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    font-family: 'Inter', sans-serif;
    color: #f8fafc;
    position: relative;
    overflow-x: hidden;
  }

  /* Background Elements */
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
    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%);
    filter: blur(60px);
  }

  .bg-particle {
    position: absolute;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    border-radius: 50%;
    opacity: 0.1;
    animation: float 20s infinite linear;
  }

  .bg-particle:nth-child(2) {
    top: 20%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #ec4899, #f472b6);
    animation-delay: -5s;
  }

  .bg-particle:nth-child(3) {
    top: 60%;
    right: 15%;
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    animation-delay: -10s;
  }

  .bg-particle:nth-child(4) {
    bottom: 10%;
    left: 20%;
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #10b981, #34d399);
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

  /* Toast Styles */
  .toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
    max-width: 400px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideInRight 0.3s ease;
    transform-origin: top right;
  }

  .toast-icon .icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .icon-wrapper.success {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
  }

  .icon-wrapper.warning {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e293b;
  }

  .icon-wrapper.info {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
  }

  .toast-message {
    flex: 1;
    font-weight: 500;
  }

  .toast-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #f8fafc;
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

  .results-header {
    position: relative;
    z-index: 2;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    padding: 3rem 1.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;
    padding: 0 2rem;
  }

  .header-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .header-icon {
    font-size: 3rem;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 20px rgba(99, 102, 241, 0.3));
  }

  .results-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #f8fafc, #cbd5e1);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    font-family: 'Poppins', sans-serif;
    letter-spacing: -0.025em;
  }

  .header-subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Full width container */
  .full-width-container {
    width: 100%;
    max-width: 100%;
    padding: 0 1rem;
    position: relative;
    z-index: 2;
  }

  .results-content {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(20px);
    padding: 2.5rem 3rem;
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 100px rgba(99, 102, 241, 0.1);
    margin-bottom: 3rem;
  }

  /* Progress Section */
  .progress-container {
    margin-bottom: 3rem;
  }

  .progress-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 0.5rem;
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 2;
    flex: 1;
    min-width: 0;
  }

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.3s ease;
  }

  .progress-step.active .step-number {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    border-color: #6366f1;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    transform: scale(1.1);
  }

  .step-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
    transition: all 0.3s ease;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .progress-step.active .step-label {
    color: #f8fafc;
    font-weight: 600;
  }

  .progress-line {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    min-width: 20px;
  }

  .progress-bar {
    width: 100%;
    height: 100%;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #818cf8 100%);
    transition: width 0.5s ease;
    border-radius: 2px;
  }

  .progress-text {
    text-align: center;
    font-size: 0.875rem;
    color: #94a3b8;
    margin-top: 0.5rem;
  }

  /* Content Header */
  .content-header {
    margin-bottom: 2.5rem;
  }

  .content-title h2 {
    font-size: 2.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #f8fafc, #cbd5e1);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    font-family: 'Poppins', sans-serif;
    margin-bottom: 0.5rem;
  }

  .content-subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    max-width: 800px;
    margin-bottom: 2rem;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
  }

  /* Section Cards */
  .section-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    padding: 2.5rem;
    margin-bottom: 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .section-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--section-gradient, linear-gradient(90deg, #6366f1, #818cf8));
    opacity: 0.5;
  }

  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
  }

  .title-icon {
    width: 64px;
    height: 64px;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    border: 1px solid;
  }

  .title-content {
    flex: 1;
  }

  .title-content h3 {
    font-size: 1.5rem;
    margin: 0;
    color: #f8fafc;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
  }

  .section-subtitle {
    font-size: 1rem;
    color: #94a3b8;
    margin-top: 0.5rem;
    display: block;
  }

  .section-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1.25rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
  }

  .section-badge i {
    color: #f59e0b;
  }

  /* Matches Grid */
  .matches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .match-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .match-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .match-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .match-score {
    width: 70px;
    height: 70px;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    flex-shrink: 0;
  }

  .score-value {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .score-label {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .match-title {
    flex: 1;
  }

  .match-title h4 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #f8fafc;
    font-weight: 600;
  }

  .match-industry {
    font-size: 0.875rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .match-content {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .match-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    flex-shrink: 0;
  }

  .match-details {
    flex: 1;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .match-progress {
    margin-bottom: 1.5rem;
  }

  .match-progress .progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .match-progress .progress-fill {
    height: 100%;
    transition: width 1s ease;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .details-btn {
    width: 100%;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
    margin-bottom: 1rem;
  }

  .details-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  .details-btn .fa-chevron-down {
    transition: transform 0.3s ease;
  }

  .details-btn .fa-chevron-down.rotate {
    transform: rotate(180deg);
  }

  .details-section {
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 1.5rem;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .detail-section h5 {
    font-size: 1rem;
    color: #f8fafc;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .detail-section p {
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
  }

  .skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .skill-tag {
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    padding: 0.5rem 0.875rem;
    border-radius: 2rem;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .skill-tag.developmental {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.2);
  }

  /* Job Links Section */
  .job-links-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .job-links-title {
    font-size: 1rem;
    color: #f8fafc;
    margin-bottom: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .job-links-title i {
    color: #6366f1;
  }

  .job-links-grid {
    display: grid;
    gap: 0.75rem;
  }

  .job-links-grid.two-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  .job-platform-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .job-platform-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: var(--platform-color, #6366f1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .job-platform-btn i {
    font-size: 1.1rem;
    color: var(--platform-color, #6366f1);
    transition: all 0.2s ease;
  }

  .job-platform-btn:hover i {
    transform: scale(1.1);
  }

  /* Paths Grid */
  .paths-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .path-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    transition: all 0.3s ease;
  }

  .path-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .path-icon {
    width: 56px;
    height: 56px;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    flex-shrink: 0;
  }

  .path-content {
    flex: 1;
  }

  .path-content h4 {
    font-size: 1.125rem;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .path-description {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .path-match {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .path-match .match-score {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
  }

  .path-progress {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .path-progress .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--path-gradient-colors));
    transition: width 1s ease;
  }

  /* Resources Grid */
  .resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .resource-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 1.5rem;
    display: flex;
    gap: 1.25rem;
    transition: all 0.3s ease;
  }

  .resource-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .resource-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    flex-shrink: 0;
  }

  .resource-content {
    flex: 1;
  }

  .resource-content h4 {
    font-size: 1.125rem;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .resource-platform {
    font-size: 0.875rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .resource-actions {
    display: flex;
    gap: 0.75rem;
  }

  .resource-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .resource-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  .copy-link {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  /* Next Steps */
  .next-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .step-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }

  .step-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .step-icon {
    width: 56px;
    height: 56px;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    margin: 0 auto 1rem;
  }

  .step-card h4 {
    font-size: 1.125rem;
    color: #f8fafc;
    margin: 0 0 0.75rem 0;
    font-weight: 600;
  }

  .step-card p, .step-card ul {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
  }

  .step-card ul {
    padding-left: 1.25rem;
  }

  .step-card li {
    margin-bottom: 0.5rem;
  }

  .step-card li:last-child {
    margin-bottom: 0;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 3rem;
    gap: 1.5rem;
  }

  .action-btn {
    padding: 1.125rem 2.25rem;
    border: none;
    border-radius: 1rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    min-width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  .action-btn.primary.glow {
    box-shadow: 
      0 5px 25px rgba(16, 185, 129, 0.4),
      0 0 50px rgba(16, 185, 129, 0.2);
    animation: glow 2s infinite;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #34d399, #10b981);
    transform: translateY(-2px);
    box-shadow: 
      0 10px 30px rgba(16, 185, 129, 0.5),
      0 0 60px rgba(16, 185, 129, 0.3);
  }

  .action-btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #475569;
    box-shadow: none;
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 
        0 5px 25px rgba(16, 185, 129, 0.4),
        0 0 50px rgba(16, 185, 129, 0.2);
    }
    50% {
      box-shadow: 
        0 5px 35px rgba(16, 185, 129, 0.6),
        0 0 70px rgba(16, 185, 129, 0.3);
    }
  }

  .button-loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 1400px) {
    .results-content {
      max-width: 1200px;
      padding: 2.5rem;
    }
  }

  @media (max-width: 1200px) {
    .matches-grid {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
    
    .paths-grid, .resources-grid, .next-steps {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .results-content {
      max-width: 1000px;
      padding: 2rem;
    }
    
    .section-card {
      padding: 2rem;
    }
    
    .match-content {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .action-buttons {
      flex-direction: column;
      gap: 1rem;
    }
    
    .action-btn {
      width: 100%;
      min-width: auto;
    }
  }

  @media (max-width: 768px) {
    .results-page {
      padding: 0;
    }

    .toast {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }

    .results-header {
      padding: 2rem 1rem;
    }

    .results-header h1 {
      font-size: 2rem;
    }

    .header-subtitle {
      font-size: 1rem;
    }

    .results-content {
      padding: 1.75rem;
      margin: 0 0.5rem;
      border-radius: 1.5rem;
    }

    .content-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .content-title h2 {
      font-size: 1.75rem;
    }

    .summary-stats {
      grid-template-columns: 1fr;
    }

    .matches-grid, .paths-grid, .resources-grid, .next-steps {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .title-icon {
      width: 56px;
      height: 56px;
      font-size: 1.5rem;
    }

    .section-badge {
      align-self: flex-start;
    }

    .job-links-grid.two-columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .progress-info {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .progress-step {
      flex: 0 0 calc(20% - 1rem);
      margin-bottom: 1rem;
    }
    
    .progress-line {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .results-content {
      padding: 1.5rem;
    }

    .section-card {
      padding: 1.5rem;
    }

    .match-card {
      padding: 1.25rem;
    }

    .match-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .match-score {
      width: 60px;
      height: 60px;
    }

    .progress-step {
      flex: 0 0 calc(50% - 1rem);
    }
    
    .progress-step:nth-child(9) {
      display: none;
    }
    
    .progress-step:nth-child(10) {
      display: none;
    }
    
    .progress-step:nth-child(11) {
      display: none;
    }
    
    .progress-info {
      justify-content: space-around;
    }
    
    .action-btn {
      padding: 1rem 1.5rem;
    }
  }
</style>