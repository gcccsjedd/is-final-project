<!-- Preferences.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();

  // Type definitions for better type safety
  type WorkPreferenceData = {
    workTypes: string[];
    salaryExpectation: string;
    workMotivation: string;
    educationLevel: string;
    educationField: string;
    workExperience: string;
    strengths?: string[];
    technicalSkills?: string[];
  };

  type ToastType = 'success' | 'warning' | 'info';

  // Modern color palette
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
    background: '#0f172a',
    surface: '#1e293b',
    surfaceLight: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8'
  };

  // Initialize with default values
  export let data: WorkPreferenceData = {
    workTypes: [],
    salaryExpectation: '',
    workMotivation: '',
    educationLevel: '',
    educationField: '',
    workExperience: '',
  };

  export let progressWidth = '33%';

  // Reactive state
  let searchQuery = '';
  let isLoading = false;
  let selectedCategory = 'all';
  let activeToast: { message: string; type: ToastType } | null = null;
  let sessionId = generateSessionId();
  let isSubmitting = false;

  // Constants for options
  const WORK_TYPE_LIMIT = 3;
  
  const workTypeOptions = [
    { id: 'creative', label: 'Creative', value: 'creative', icon: 'fa-solid fa-palette', description: 'Design, writing, arts', gradient: 'from-pink-500 to-rose-500' },
    { id: 'analytical', label: 'Analytical', value: 'analytical', icon: 'fa-solid fa-chart-line', description: 'Data analysis, research', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'technical', label: 'Technical', value: 'technical', icon: 'fa-solid fa-code', description: 'Engineering, programming', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'handsOn', label: 'Hands-on', value: 'handsOn', icon: 'fa-solid fa-wrench', description: 'Construction, manufacturing', gradient: 'from-amber-500 to-orange-500' },
    { id: 'social', label: 'Social', value: 'social', icon: 'fa-solid fa-users', description: 'Teaching, counseling, service', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'structured', label: 'Structured', value: 'structured', icon: 'fa-solid fa-list-check', description: 'Accounting, administration', gradient: 'from-slate-500 to-gray-500' },
    { id: 'leadership', label: 'Leadership', value: 'leadership', icon: 'fa-solid fa-chart-simple', description: 'Team leading, management', gradient: 'from-violet-500 to-purple-500' },
    { id: 'entrepreneurial', label: 'Entrepreneurial', value: 'entrepreneurial', icon: 'fa-solid fa-lightbulb', description: 'Startups, business', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'scientific', label: 'Scientific', value: 'scientific', icon: 'fa-solid fa-flask', description: 'Biology, chemistry', gradient: 'from-red-500 to-pink-500' },
    { id: 'healthcare', label: 'Healthcare', value: 'healthcare', icon: 'fa-solid fa-stethoscope', description: 'Nursing, medicine', gradient: 'from-rose-500 to-pink-500' },
    { id: 'outdoor', label: 'Outdoor', value: 'outdoor', icon: 'fa-solid fa-tree', description: 'Agriculture, forestry', gradient: 'from-green-500 to-emerald-500' },
    { id: 'digital', label: 'Digital', value: 'digital', icon: 'fa-solid fa-globe', description: 'Online work, remote', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'logistical', label: 'Logistical', value: 'logistical', icon: 'fa-solid fa-boxes-stacked', description: 'Supply chain, operations', gradient: 'from-gray-500 to-slate-500' },
    { id: 'artistic', label: 'Artistic', value: 'artistic', icon: 'fa-solid fa-music', description: 'Performing, visual arts', gradient: 'from-fuchsia-500 to-pink-500' },
    { id: 'financial', label: 'Financial', value: 'financial', icon: 'fa-solid fa-dollar-sign', description: 'Banking, investment', gradient: 'from-amber-500 to-yellow-500' },
    { id: 'legal', label: 'Legal', value: 'legal', icon: 'fa-solid fa-scale-balanced', description: 'Law, compliance', gradient: 'from-stone-500 to-neutral-500' },
    { id: 'educational', label: 'Educational', value: 'educational', icon: 'fa-solid fa-book-open', description: 'Teaching, training', gradient: 'from-sky-500 to-blue-500' },
    { id: 'environmental', label: 'Environmental', value: 'environmental', icon: 'fa-solid fa-leaf', description: 'Sustainability', gradient: 'from-lime-500 to-green-500' },
    { id: 'sales', label: 'Sales', value: 'sales', icon: 'fa-solid fa-chart-column', description: 'Business development', gradient: 'from-orange-500 to-amber-500' },
    { id: 'support', label: 'Support', value: 'support', icon: 'fa-solid fa-headset', description: 'HR, office management', gradient: 'from-zinc-500 to-gray-500' }
  ];

  const salaryOptions = [
    { id: 'entry', label: 'Entry Level', value: 'entry', description: 'Starting career journey', icon: 'fa-solid fa-rocket', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'average', label: 'Average', value: 'average', description: 'Industry standards', icon: 'fa-solid fa-chart-line', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'competitive', label: 'Competitive', value: 'competitive', description: 'Above average starting', icon: 'fa-solid fa-trophy', gradient: 'from-amber-500 to-orange-500' }
  ];

  const motivationOptions = [
    { id: 'impact', label: 'Make Impact', value: 'impact', icon: 'fa-solid fa-bullseye', description: 'Creating meaningful change', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'security', label: 'Security', value: 'security', icon: 'fa-solid fa-shield', description: 'Stable employment & growth', gradient: 'from-blue-500 to-indigo-500' },
    { id: 'growth', label: 'Growth', value: 'growth', icon: 'fa-solid fa-chart-line', description: 'Career advancement', gradient: 'from-purple-500 to-pink-500' },
    { id: 'balance', label: 'Balance', value: 'balance', icon: 'fa-solid fa-scale-balanced', description: 'Work-life harmony', gradient: 'from-cyan-500 to-blue-500' }
  ];

  // Updated education options for college years only with Font Awesome icons
  const educationOptions = [
    { id: 'first', label: 'Freshman', value: 'first', description: 'First year student', icon: 'fa-solid fa-user-plus', gradient: 'from-sky-500 to-blue-500' },
    { id: 'second', label: 'Sophomore', value: 'second', description: 'Second year student', icon: 'fa-solid fa-user', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'third', label: 'Junior', value: 'third', description: 'Third year student', icon: 'fa-solid fa-user-check', gradient: 'from-amber-500 to-orange-500' },
    { id: 'fourth', label: 'Senior', value: 'fourth', description: 'Final year student', icon: 'fa-solid fa-user-graduate', gradient: 'from-emerald-500 to-teal-500' }
  ];

  const educationFieldOptions = [
    { id: 'cs', label: 'Computer Science', value: 'Computer Science', icon: 'fa-solid fa-laptop-code', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'engineering', label: 'Engineering', value: 'Engineering', icon: 'fa-solid fa-gears', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'business', label: 'Business', value: 'Business', icon: 'fa-solid fa-building', gradient: 'from-amber-500 to-orange-500' },
    { id: 'health', label: 'Health Sciences', value: 'Health Sciences', icon: 'fa-solid fa-stethoscope', gradient: 'from-rose-500 to-pink-500' },
    { id: 'arts', label: 'Arts & Humanities', value: 'Arts & Humanities', icon: 'fa-solid fa-palette', gradient: 'from-pink-500 to-rose-500' },
    { id: 'science', label: 'Natural Sciences', value: 'Natural Sciences', icon: 'fa-solid fa-atom', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'social', label: 'Social Sciences', value: 'Social Sciences', icon: 'fa-solid fa-users', gradient: 'from-sky-500 to-blue-500' },
    { id: 'education', label: 'Education', value: 'Education', icon: 'fa-solid fa-book-open', gradient: 'from-violet-500 to-purple-500' },
    { id: 'communications', label: 'Communications', value: 'Communications', icon: 'fa-solid fa-comments', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'undeclared', label: 'Undeclared', value: 'Undeclared', icon: 'fa-solid fa-compass', gradient: 'from-slate-500 to-gray-500' }
  ];

  // Work type categories for filtering
  const workTypeCategories = [
    { id: 'all', name: 'All Types', icon: 'fa-solid fa-border-all', gradient: 'from-gray-500 to-slate-500' },
    { id: 'creative', name: 'Creative', icon: 'fa-solid fa-palette', gradient: 'from-pink-500 to-rose-500' },
    { id: 'technical', name: 'Technical', icon: 'fa-solid fa-code', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'business', name: 'Business', icon: 'fa-solid fa-building', gradient: 'from-amber-500 to-orange-500' },
    { id: 'social', name: 'Social', icon: 'fa-solid fa-users', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'scientific', name: 'Scientific', icon: 'fa-solid fa-flask', gradient: 'from-red-500 to-pink-500' },
    { id: 'organizational', name: 'Organizational', icon: 'fa-solid fa-list-check', gradient: 'from-slate-500 to-gray-500' }
  ];

  // Pre-computed lookups for better performance
  const workTypeLookup = new Map(workTypeOptions.map(opt => [opt.value, opt]));
  const salaryLookup = new Map(salaryOptions.map(opt => [opt.value, opt]));
  const motivationLookup = new Map(motivationOptions.map(opt => [opt.value, opt]));
  const educationLookup = new Map(educationOptions.map(opt => [opt.value, opt]));
  const educationFieldLookup = new Map(educationFieldOptions.map(opt => [opt.value, opt]));

  // Helper function to generate session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Optimized reactive declarations
  $: selectedWorkTypesCount = data.workTypes.length;
  
  // FIXED: Proper form completion check - all 5 sections must be filled
  $: isFormComplete = data.workTypes.length > 0 && 
                      data.salaryExpectation !== '' && 
                      data.workMotivation !== '' && 
                      data.educationLevel !== '' && 
                      data.educationField !== '';

  // FIXED: Calculate completion count properly
  $: completionCount = (data.workTypes.length > 0 ? 1 : 0) +
                      (data.salaryExpectation ? 1 : 0) +
                      (data.workMotivation ? 1 : 0) +
                      (data.educationLevel ? 1 : 0) +
                      (data.educationField ? 1 : 0);

  $: hasSelections = data.workTypes.length > 0 || 
                     data.salaryExpectation || 
                     data.workMotivation || 
                     data.educationLevel || 
                     data.educationField;

  // Optimized disabled state checks
  $: isWorkTypeDisabled = (value: string) => 
    data.workTypes.length >= WORK_TYPE_LIMIT && !data.workTypes.includes(value);

  // Optimized filtering with early returns
  $: filteredWorkTypes = (() => {
    const query = searchQuery.trim().toLowerCase();
    const isAllCategory = selectedCategory === 'all';
    
    // Fast path: no filters applied
    if (!query && isAllCategory) {
      return workTypeOptions;
    }

    return workTypeOptions.filter(option => {
      const matchesSearch = !query || 
        option.label.toLowerCase().includes(query) || 
        option.value.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query);
      
      const matchesCategory = isAllCategory || option.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  })();

  // Lifecycle
  onMount(async () => {
    console.log('Preferences component mounted');
    console.log('Initial form state:', {
      workTypes: data.workTypes.length,
      salary: data.salaryExpectation,
      motivation: data.workMotivation,
      educationLevel: data.educationLevel,
      educationField: data.educationField,
      isFormComplete: isFormComplete
    });
  });

  // Optimized event handlers
  const handleMultiSelect = (field: string[], value: string, max: number, type: string) => {
    const index = field.indexOf(value);
    
    if (index === -1) {
      if (field.length < max) {
        showToast(`${type} added`, 'success');
        return [...field, value];
      }
      showToast(`Maximum ${max} ${type}s allowed`, 'warning');
      return field;
    }
    
    showToast(`${type} removed`, 'info');
    return field.filter(item => item !== value);
  };

  const handleWorkTypeChange = (value: string) => {
    data.workTypes = handleMultiSelect(data.workTypes, value, WORK_TYPE_LIMIT, 'work type');
  };

  const handleEducationLevelChange = (value: string) => {
    data.educationLevel = value;
    data.educationField = data.educationField || '';
    showToast('College year updated', 'success');
  };

  const handleSalaryChange = (value: string) => {
    data.salaryExpectation = value;
    showToast('Salary expectation updated', 'success');
  };

  const handleMotivationChange = (value: string) => {
    data.workMotivation = value;
    showToast('Work motivation updated', 'success');
  };

  const handleEducationFieldChange = (value: string) => {
    data.educationField = value;
    showToast('Major/field of study updated', 'success');
  };

  const handleSearch = (event: Event) => {
    searchQuery = (event.target as HTMLInputElement).value;
  };

  const handleCategoryFilter = (categoryId: string) => {
    selectedCategory = categoryId;
  };

  const clearSearch = () => {
    searchQuery = '';
    selectedCategory = 'all';
  };

  const clearAllSelections = () => {
    data.workTypes = [];
    data.salaryExpectation = '';
    data.workMotivation = '';
    data.educationLevel = '';
    data.educationField = '';
    showToast('All selections cleared', 'info');
  };

  // Optimized toast system
  const showToast = (message: string, type: ToastType = 'info') => {
    activeToast = { message, type };
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      if (activeToast?.message === message) {
        activeToast = null;
      }
    }, 3000);
  };

  // FIXED: Simplified navigation - just pass data to parent
  const nextQuestion = async () => {
    console.log('Next button clicked');
    console.log('Current form state:', {
      workTypes: data.workTypes.length,
      salary: data.salaryExpectation,
      motivation: data.workMotivation,
      educationLevel: data.educationLevel,
      educationField: data.educationField,
      isFormComplete: isFormComplete
    });
    
    // Detailed validation with specific error messages
    if (data.workTypes.length === 0) {
      showToast('Please select at least one work type', 'warning');
      return;
    }
    
    if (!data.salaryExpectation) {
      showToast('Please select your salary expectation', 'warning');
      return;
    }
    
    if (!data.workMotivation) {
      showToast('Please select your work motivation', 'warning');
      return;
    }
    
    if (!data.educationLevel) {
      showToast('Please select your college year', 'warning');
      return;
    }
    
    if (!data.educationField) {
      showToast('Please select your major/field of study', 'warning');
      return;
    }
    
    // All validations passed
    isLoading = true;
    
    try {
      // Prepare data for dispatch
      const completionData = {
        workTypes: data.workTypes,
        salaryExpectation: data.salaryExpectation,
        workMotivation: data.workMotivation,
        educationLevel: data.educationLevel,
        educationField: data.educationField,
        workExperience: data.workExperience || 'none',
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      };
      
      console.log('Dispatching complete event with data:', completionData);
      dispatch('complete', completionData);
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('Failed to save preferences. Please try again.', 'warning');
    } finally {
      isLoading = false;
    }
  };

  const goBack = () => {
    dispatch('backToHome');
  };

  // Optimized helper functions using pre-computed lookups
  const getWorkTypeLabel = (value: string) => workTypeLookup.get(value)?.label || value;
  const getWorkTypeIcon = (value: string) => workTypeLookup.get(value)?.icon || '';
  const getWorkTypeGradient = (value: string) => workTypeLookup.get(value)?.gradient || 'from-gray-500 to-slate-500';
  const getSalaryIcon = (value: string) => salaryLookup.get(value)?.icon || '';
  const getSalaryLabel = (value: string) => salaryLookup.get(value)?.label || value;
  const getSalaryGradient = (value: string) => salaryLookup.get(value)?.gradient || 'from-blue-500 to-cyan-500';
  const getMotivationLabel = (value: string) => motivationLookup.get(value)?.label || value;
  const getMotivationIcon = (value: string) => motivationLookup.get(value)?.icon || '';
  const getMotivationGradient = (value: string) => motivationLookup.get(value)?.gradient || 'from-emerald-500 to-teal-500';
  const getEducationLabel = (value: string) => educationLookup.get(value)?.label || value;
  const getEducationIcon = (value: string) => educationLookup.get(value)?.icon || '';
  const getEducationGradient = (value: string) => educationLookup.get(value)?.gradient || 'from-sky-500 to-blue-500';
  const getEducationFieldIcon = (value: string) => educationFieldLookup.get(value)?.icon || '';
  const getEducationFieldGradient = (value: string) => educationFieldLookup.get(value)?.gradient || 'from-purple-500 to-indigo-500';

  // Helper to get education description
  const getEducationDescription = (value: string) => educationLookup.get(value)?.description || '';
</script>

<div class="preferences-page">
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

  <div class="preferences-header">
    <div class="header-content">
      <div class="header-title">
        <i class="fa-solid fa-graduation-cap header-icon"></i>
        <h1>Career Pathfinder</h1>
      </div>
      <p class="header-subtitle">Discover opportunities that match your college journey</p>
    </div>
  </div>

  <div class="full-width-container">
    <section class="preferences-content">
      <!-- Progress Section -->
      <div class="progress-container">
        <div class="progress-info">
          <div class="progress-step">
            <div class="step-number">1</div>
            <span class="step-label">Profile</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progressWidth}"></div>
            </div>
          </div>
          <div class="progress-step active">
            <div class="step-number">2</div>
            <span class="step-label">Preferences</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progressWidth}"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">3</div>
            <span class="step-label">Skills</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progressWidth}"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">4</div>
            <span class="step-label">Work</span>
          </div>
          <div class="progress-line">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progressWidth}"></div>
            </div>
          </div>
          <div class="progress-step">
            <div class="step-number">5</div>
            <span class="step-label">Results</span>
          </div>
        </div>
        <div class="progress-text">Step 2 of 5 • {Math.round(parseInt(progressWidth))}% complete</div>
      </div>

      <div class="content-header">
        <div class="content-title">
          <h2>Shape Your Future</h2>
          <p class="content-subtitle">Select preferences that align with your career aspirations</p>
        </div>
        <div class="selection-counter">
          <div class="counter-badge">
            <i class="fa-solid fa-check"></i>
            <span>{selectedWorkTypesCount}/{WORK_TYPE_LIMIT} selections</span>
          </div>
        </div>
      </div>

      <!-- Selected Preview -->
      {#if hasSelections}
        <div class="selection-preview" transition:fade>
          <div class="preview-header">
            <div class="preview-title">
              <i class="fa-solid fa-badge-check preview-icon"></i>
              <h3>Your Selections</h3>
              <span class="preview-count">({data.workTypes.length + (data.salaryExpectation ? 1 : 0) + (data.workMotivation ? 1 : 0) + (data.educationLevel ? 1 : 0) + (data.educationField ? 1 : 0)} items)</span>
            </div>
            <button class="clear-all" on:click={clearAllSelections} aria-label="Clear all selections">
              <i class="fa-solid fa-trash"></i> Clear All
            </button>
          </div>
          <div class="preview-items">
            {#if data.workTypes.length > 0}
              <div class="preview-category">
                <div class="category-header">
                  <h4>Work Types</h4>
                  <span class="category-count">{data.workTypes.length}/{WORK_TYPE_LIMIT}</span>
                </div>
                <div class="preview-tags">
                  {#each data.workTypes as type}
                    <span class="preview-tag" transition:scale style="--tag-gradient: var(--gradient-{type})">
                      <div class="tag-icon">
                        <i class="{getWorkTypeIcon(type)}"></i>
                      </div>
                      <span class="tag-label">{getWorkTypeLabel(type)}</span>
                      <button 
                        class="remove-tag" 
                        on:click={() => handleWorkTypeChange(type)}
                        aria-label="Remove {getWorkTypeLabel(type)}"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if data.salaryExpectation}
              <div class="preview-category">
                <h4>Salary Expectations</h4>
                <div class="preview-tags">
                  <span class="preview-tag salary-tag">
                    <div class="tag-icon">
                      <i class="{getSalaryIcon(data.salaryExpectation)}"></i>
                    </div>
                    <span class="tag-label">{getSalaryLabel(data.salaryExpectation)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.salaryExpectation = ''}
                      aria-label="Remove salary preference"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
            
            {#if data.workMotivation}
              <div class="preview-category">
                <h4>Motivation</h4>
                <div class="preview-tags">
                  <span class="preview-tag motivation-tag">
                    <div class="tag-icon">
                      <i class="{getMotivationIcon(data.workMotivation)}"></i>
                    </div>
                    <span class="tag-label">{getMotivationLabel(data.workMotivation)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.workMotivation = ''}
                      aria-label="Remove work motivation"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}

            {#if data.educationLevel}
              <div class="preview-category">
                <h4>College Year</h4>
                <div class="preview-tags">
                  <span class="preview-tag education-tag">
                    <div class="tag-icon">
                      <i class="{getEducationIcon(data.educationLevel)}"></i>
                    </div>
                    <span class="tag-label">{getEducationLabel(data.educationLevel)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => { data.educationLevel = ''; data.educationField = ''; }}
                      aria-label="Remove college year"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}

            {#if data.educationField}
              <div class="preview-category">
                <h4>Major/Field of Study</h4>
                <div class="preview-tags">
                  <span class="preview-tag field-tag">
                    <div class="tag-icon">
                      <i class="{getEducationFieldIcon(data.educationField)}"></i>
                    </div>
                    <span class="tag-label">{data.educationField}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.educationField = ''}
                      aria-label="Remove education field"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Work Type Question -->
      <div class="question-card work-type-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon work-icon">
              <i class="fa-solid fa-briefcase"></i>
            </div>
            <div class="title-content">
              <h3>Work Type Interests</h3>
              <span class="question-subtitle">Select up to {WORK_TYPE_LIMIT} that match your career goals</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-star"></i>
            <span>Essential</span>
          </div>
        </div>
        
        <!-- Search and Filter Controls -->
        <div class="skills-controls">
          <div class="search-box">
            <div class="search-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <input 
              type="text" 
              placeholder="Search work types..." 
              class="skill-search" 
              bind:value={searchQuery}
              aria-label="Search work types"
            />
            {#if searchQuery}
              <button class="clear-search" on:click={clearSearch} aria-label="Clear search">
                <i class="fa-solid fa-xmark"></i>
              </button>
            {:else}
              <div class="search-hint">
                <i class="fa-solid fa-info-circle"></i>
                <span>Type to filter options</span>
              </div>
            {/if}
          </div>
          
          <div class="category-filters">
            {#each workTypeCategories as category (category.id)}
              <button 
                class="category-filter {selectedCategory === category.id ? 'active' : ''}"
                on:click={() => handleCategoryFilter(category.id)}
                style="--filter-gradient: var(--gradient-{category.id})"
                title="{category.name}"
                aria-label="Show {category.name} category"
              >
                <div class="filter-icon">
                  <i class="{category.icon}"></i>
                </div>
                <span class="filter-label">{category.name}</span>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Search Results -->
        {#if searchQuery && filteredWorkTypes.length === 0}
          <div class="no-results">
            <div class="no-results-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <p>No work types found for "{searchQuery}"</p>
            <small>Try a different search term or browse all categories</small>
            <button class="clear-search-btn" on:click={clearSearch}>
              Clear Search
            </button>
          </div>
        {/if}
        
        <div class="options-grid work-type-options">
          {#each filteredWorkTypes as option (option.id)}
            <label 
              class="option-card work-option {isWorkTypeDisabled(option.value) ? 'disabled' : ''} {data.workTypes.includes(option.value) ? 'selected' : ''}"
              style="--option-gradient: {option.gradient}"
              title="{option.description}"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={data.workTypes.includes(option.value)}
                on:change={() => handleWorkTypeChange(option.value)}
                disabled={isWorkTypeDisabled(option.value)}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{option.icon}"></i>
                </div>
                <div class="option-details">
                  <span class="option-label">{option.label}</span>
                  <span class="option-description">{option.description}</span>
                </div>
                <div class="option-check">
                  <div class="checkmark">
                    <i class="fa-solid fa-check"></i>
                  </div>
                  <div class="option-badge" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                    {option.category}
                  </div>
                </div>
              </div>
            </label>
          {/each}
        </div>
        
        {#if selectedWorkTypesCount > 0}
          <div class="selection-count">
            <div class="count-progress">
              <div class="progress-track">
                <div class="progress-fill" style="width: {(selectedWorkTypesCount / WORK_TYPE_LIMIT) * 100}%"></div>
              </div>
              <span>{selectedWorkTypesCount}/{WORK_TYPE_LIMIT} selected</span>
            </div>
            {#if selectedWorkTypesCount === WORK_TYPE_LIMIT}
              <div class="limit-reached">
                <i class="fa-solid fa-check-circle"></i>
                <span>Maximum selections reached</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Salary Expectation Question -->
      <div class="question-card salary-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon salary-icon">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
            <div class="title-content">
              <h3>Salary Expectations</h3>
              <span class="question-subtitle">What range are you targeting after graduation?</span>
            </div>
          </div>
        </div>
        <div class="options-grid salary-options">
          {#each salaryOptions as option (option.id)}
            <label class="option-card salary-option {data.salaryExpectation === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="salary"
                value={option.value}
                checked={data.salaryExpectation === option.value}
                on:change={() => handleSalaryChange(option.value)}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{option.icon}"></i>
                </div>
                <div class="option-details">
                  <span class="option-label">{option.label}</span>
                  <span class="option-description">{option.description}</span>
                </div>
                <div class="option-price">
                  <span class="price-label">
                    {#if option.id === 'entry'}
                      $
                    {:else if option.id === 'average'}
                      $$
                    {:else}
                      $$$
                    {/if}
                  </span>
                </div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Motivation Question -->
      <div class="question-card motivation-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon motivation-icon">
              <i class="fa-solid fa-trophy"></i>
            </div>
            <div class="title-content">
              <h3>Career Motivation</h3>
              <span class="question-subtitle">What drives your career satisfaction?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-heart"></i>
            <span>Personal</span>
          </div>
        </div>
        <div class="options-grid motivation-options">
          {#each motivationOptions as option (option.id)}
            <label class="option-card motivation-option {data.workMotivation === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input 
                type="radio" 
                name="motivation" 
                value={option.value}
                checked={data.workMotivation === option.value}
                on:change={() => handleMotivationChange(option.value)}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{option.icon}"></i>
                </div>
                <div class="option-details">
                  <span class="option-label">{option.label}</span>
                  <span class="option-description">{option.description}</span>
                </div>
                <div class="option-check">
                  <div class="checkmark">
                    <i class="fa-solid fa-check"></i>
                  </div>
                </div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- College Year Question -->
      <div class="question-card education-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon education-icon">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div class="title-content">
              <h3>College Year</h3>
              <span class="question-subtitle">Where are you in your academic journey?</span>
            </div>
          </div>
        </div>
        <div class="options-grid education-options">
          {#each educationOptions as option (option.id)}
            <label class="option-card education-option {data.educationLevel === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input 
                type="radio" 
                name="education" 
                value={option.value}
                checked={data.educationLevel === option.value}
                on:change={() => handleEducationLevelChange(option.value)}
                aria-label="{option.label} - {getEducationDescription(option.value)}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{option.icon}"></i>
                </div>
                <div class="option-details">
                  <span class="option-label">{option.label}</span>
                  <span class="option-description">{getEducationDescription(option.value)}</span>
                </div>
                <div class="option-year">
                  <span class="year-badge">
                    {#if option.id === 'first'}
                      1st
                    {:else if option.id === 'second'}
                      2nd
                    {:else if option.id === 'third'}
                      3rd
                    {:else}
                      4th
                    {/if}
                  </span>
                </div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Education Field Question -->
      <div class="question-card field-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon field-icon">
              <i class="fa-solid fa-book-open"></i>
            </div>
            <div class="title-content">
              <h3>Major/Field of Study</h3>
              <span class="question-subtitle">Select your primary academic focus</span>
            </div>
          </div>
        </div>
        <div class="options-grid education-field-options">
          {#each educationFieldOptions as option (option.id)}
            <label class="option-pill field-option {data.educationField === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input 
                type="radio" 
                name="educationField" 
                value={option.value}
                checked={data.educationField === option.value}
                on:change={() => handleEducationFieldChange(option.value)}
                aria-label="{option.label}"
              />
              <div class="option-content">
                <div class="pill-icon" style="background: linear-gradient(135deg, {option.gradient.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                  <i class="{option.icon}"></i>
                </div>
                <span class="pill-label">{option.label}</span>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-buttons">
        <button class="nav-button back-button" type="button" on:click={goBack}>
          <i class="fa-solid fa-chevron-left"></i>
          <span>Back to Home</span>
        </button>
        
        <div class="completion-status">
          <div class="status-content">
            {#if isFormComplete}
              <div class="status-icon complete">
                <i class="fa-solid fa-check-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Ready to Continue</span>
                <span class="status-subtitle">5/5 sections completed</span>
              </div>
            {:else}
              <div class="status-icon incomplete">
                <i class="fa-solid fa-exclamation-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Complete All Sections</span>
                <span class="status-subtitle">{completionCount}/5 sections done</span>
              </div>
            {/if}
          </div>
        </div>
        
        <button 
          class="nav-button next-button {isFormComplete ? 'glow' : ''}" 
          type="button" 
          on:click={nextQuestion}
          disabled={!isFormComplete || isLoading}
        >
          {#if isLoading}
            <div class="button-loader"></div>
            <span>Continue to Skills</span>
          {:else}
            <span>Continue to Skills</span>
            <i class="fa-solid fa-chevron-right"></i>
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
    /* Modern gradient variables */
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    --gradient-secondary: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-accent: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-error: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    
    /* Category gradients */
    --gradient-creative: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    --gradient-technical: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    --gradient-business: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-social: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --gradient-scientific: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    --gradient-organizational: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
    --gradient-all: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  }

  .preferences-page {
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

  .preferences-header {
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

  .preferences-header h1 {
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

  /* Full width container for the form */
  .full-width-container {
    width: 100%;
    max-width: 100%;
    padding: 0 1rem;
    position: relative;
    z-index: 2;
  }

  .preferences-content {
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2.5rem;
    gap: 1.5rem;
  }

  .content-title {
    flex: 1;
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
  }

  .selection-counter .counter-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1.25rem;
    border-radius: 2rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
  }

  .counter-badge i {
    color: #10b981;
    font-size: 1.25rem;
  }

  /* Selection Preview */
  .selection-preview {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    padding: 2rem;
    margin-bottom: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .selection-preview::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #ec4899, #f59e0b, #10b981);
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .preview-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .preview-icon {
    font-size: 1.5rem;
    background: linear-gradient(135deg, #10b981, #34d399);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }

  .selection-preview h3 {
    font-size: 1.5rem;
    margin: 0;
    color: #f8fafc;
    font-weight: 600;
  }

  .preview-count {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-left: 0.5rem;
  }

  .clear-all {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    cursor: pointer;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    font-weight: 500;
    white-space: nowrap;
  }

  .clear-all:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: translateY(-1px);
  }

  .preview-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .preview-category {
    background: rgba(255, 255, 255, 0.03);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .preview-category h4 {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .category-count {
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    color: #cbd5e1;
  }

  .preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .preview-tag {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 500;
    position: relative;
    transition: all 0.2s;
  }

  .preview-tag:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .tag-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .preview-tag:not(.salary-tag):not(.motivation-tag):not(.education-tag):not(.field-tag) .tag-icon {
    background: var(--tag-gradient, var(--gradient-primary));
    color: white;
  }

  .salary-tag .tag-icon {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
  }

  .motivation-tag .tag-icon {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
  }

  .education-tag .tag-icon {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
    color: white;
  }

  .field-tag .tag-icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e293b;
  }

  .tag-label {
    flex: 1;
  }

  .remove-tag {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
  }

  .remove-tag:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  /* Question Cards */
  .question-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1.5rem;
    padding: 2.5rem;
    margin-bottom: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .question-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--card-gradient, linear-gradient(90deg, #6366f1, #818cf8));
    opacity: 0.5;
  }

  .question-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.2),
      0 0 50px rgba(99, 102, 241, 0.1);
  }

  .question-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    gap: 1.5rem;
  }

  .question-title {
    display: flex;
    align-items: center;
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
  }

  .work-icon {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #818cf8;
  }

  .salary-icon {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .motivation-icon {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1));
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
  }

  .education-icon {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1));
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #a78bfa;
  }

  .field-icon {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .title-content h3 {
    font-size: 1.5rem;
    margin: 0;
    color: #f8fafc;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
  }

  .question-subtitle {
    font-size: 1rem;
    color: #94a3b8;
    margin-top: 0.5rem;
    max-width: 800px;
  }

  .question-badge {
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

  .question-badge i {
    color: #f59e0b;
  }

  /* Skills Controls */
  .skills-controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .search-box {
    position: relative;
    max-width: 600px;
  }

  .search-icon {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 1.25rem;
  }

  .skill-search {
    width: 100%;
    padding: 1.25rem 1.25rem 1.25rem 3.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    font-size: 1rem;
    color: #f8fafc;
    transition: all 0.3s ease;
  }

  .skill-search::placeholder {
    color: #94a3b8;
  }

  .skill-search:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .clear-search {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .clear-search:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #f8fafc;
  }

  .search-hint {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #94a3b8;
    pointer-events: none;
  }

  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .category-filter {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1.25rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #cbd5e1;
  }

  .category-filter:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .category-filter.active {
    background: var(--filter-gradient, var(--gradient-all));
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  .filter-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  /* Options Grid */
  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  /* Option Cards */
  .option-card {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    overflow: hidden;
  }

  .option-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--option-gradient, linear-gradient(90deg, #6366f1, #818cf8));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .option-card:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .option-card:hover:not(.disabled)::before {
    opacity: 1;
  }

  .option-card.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: transparent;
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(99, 102, 241, 0.1);
  }

  .option-card.selected::before {
    opacity: 1;
  }

  .option-card.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  }

  .option-card input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .option-content {
    display: flex;
    align-items: center;
    padding: 1.75rem;
    position: relative;
  }

  .option-icon {
    width: 64px;
    height: 64px;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    color: white;
    margin-right: 1.25rem;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--option-gradient-colors));
  }

  .option-details {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .option-label {
    font-size: 1.125rem;
    color: #f8fafc;
    font-weight: 600;
    margin-bottom: 0.375rem;
  }

  .option-description {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .option-check {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .checkmark {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #34d399);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s ease;
  }

  .option-card.selected .checkmark {
    opacity: 1;
    transform: scale(1);
  }

  .option-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    color: white;
    font-weight: 500;
    text-transform: capitalize;
  }

  .option-price .price-label {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fbbf24;
    font-family: 'Poppins', sans-serif;
  }

  .option-year .year-badge {
    font-size: 1.125rem;
    font-weight: 600;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 1rem;
  }

  /* Option Pills */
  .option-pill {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 2rem;
    padding: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: center;
  }

  .option-pill:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .option-pill.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: transparent;
    box-shadow: 
      0 5px 20px rgba(0, 0, 0, 0.2),
      0 0 10px rgba(99, 102, 241, 0.1);
  }

  .option-pill input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .option-pill .option-content {
    display: flex;
    flex-direction: column;
    padding: 2rem 1rem;
    gap: 1rem;
  }

  .pill-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    margin: 0 auto;
    background: linear-gradient(135deg, var(--option-gradient-colors));
  }

  .pill-label {
    font-size: 0.95rem;
    color: #f8fafc;
    font-weight: 500;
  }

  .option-pill.selected .pill-label {
    font-weight: 600;
  }

  /* No results message */
  .no-results {
    text-align: center;
    padding: 4rem 2rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .no-results-icon {
    font-size: 3.5rem;
    color: #64748b;
    margin-bottom: 1.5rem;
  }

  .no-results p {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .no-results small {
    font-size: 0.875rem;
    display: block;
    margin-bottom: 2rem;
  }

  .clear-search-btn {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
    border: none;
    padding: 0.875rem 1.75rem;
    border-radius: 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .clear-search-btn:hover {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  /* Selection Count */
  .selection-count {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .count-progress {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .progress-track {
    width: 160px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-track .progress-fill {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  .count-progress span {
    font-size: 0.95rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .limit-reached {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    padding: 0.75rem 1.25rem;
    border-radius: 1rem;
    color: #34d399;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Navigation Buttons */
  .navigation-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 3.5rem;
    gap: 2rem;
  }

  .nav-button {
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

  .back-button {
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    color: #f8fafc;
  }

  .next-button {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
    border: none;
    position: relative;
    overflow: hidden;
  }

  .next-button.glow {
    box-shadow: 
      0 5px 25px rgba(99, 102, 241, 0.4),
      0 0 50px rgba(99, 102, 241, 0.2);
    animation: glow 2s infinite;
  }

  .next-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    transform: translateY(-2px);
    box-shadow: 
      0 10px 30px rgba(99, 102, 241, 0.5),
      0 0 60px rgba(99, 102, 241, 0.3);
  }

  .next-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #475569;
    box-shadow: none;
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 
        0 5px 25px rgba(99, 102, 241, 0.4),
        0 0 50px rgba(99, 102, 241, 0.2);
    }
    50% {
      box-shadow: 
        0 5px 35px rgba(99, 102, 241, 0.6),
        0 0 70px rgba(99, 102, 241, 0.3);
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

  .completion-status {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.05);
    padding: 1.25rem 1.75rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .status-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .status-icon.complete {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
  }

  .status-icon.incomplete {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e293b;
  }

  .status-text {
    display: flex;
    flex-direction: column;
  }

  .status-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .status-subtitle {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 1400px) {
    .preferences-content {
      max-width: 1200px;
      padding: 2.5rem;
    }
  }

  @media (max-width: 1200px) {
    .options-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
    
    .preview-items {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .preferences-content {
      max-width: 1000px;
      padding: 2rem;
    }
    
    .question-card {
      padding: 2rem;
    }
    
    .option-content {
      padding: 1.5rem;
    }
    
    .option-icon {
      width: 56px;
      height: 56px;
      font-size: 1.5rem;
      margin-right: 1rem;
    }
  }

  @media (max-width: 900px) {
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

  @media (max-width: 768px) {
    .preferences-page {
      padding: 0;
    }

    .toast {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }

    .preferences-header {
      padding: 2rem 1rem;
    }

    .preferences-header h1 {
      font-size: 2rem;
    }

    .header-subtitle {
      font-size: 1rem;
    }

    .preferences-content {
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

    .preview-items {
      grid-template-columns: 1fr;
    }

    .options-grid {
      grid-template-columns: 1fr;
    }

    .navigation-buttons {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .nav-button {
      width: 100%;
      min-width: auto;
    }

    .completion-status {
      order: 1;
    }

    .skills-controls {
      flex-direction: column;
    }

    .category-filters {
      justify-content: center;
      flex-wrap: wrap;
    }

    .category-filter {
      font-size: 0.8rem;
      padding: 0.5rem 1rem;
    }

    .question-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .title-icon {
      width: 56px;
      height: 56px;
      font-size: 1.5rem;
    }

    .question-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .question-badge {
      align-self: flex-start;
    }
  }

  @media (max-width: 640px) {
    .progress-step {
      flex: 0 0 calc(33.333% - 1rem);
    }
    
    .step-label {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .preferences-content {
      padding: 1.5rem;
    }

    .question-card {
      padding: 1.5rem;
    }

    .option-content {
      padding: 1.25rem;
    }

    .option-icon {
      width: 48px;
      height: 48px;
      font-size: 1.25rem;
      margin-right: 0.75rem;
    }

    .option-label {
      font-size: 1rem;
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
    
    .nav-button {
      padding: 1rem 1.5rem;
    }
    
    .status-content {
      padding: 1rem;
    }
  }
</style>