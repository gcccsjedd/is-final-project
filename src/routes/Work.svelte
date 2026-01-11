<!-- WorkPreferences.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();

  // Types
  interface WorkPreferences {
    learningStyle: string;
    collaborationPreference: string;
    timePreference: string;
    guidancePreference: string;
    workPace: string;
  }

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

  export let data: WorkPreferences = {
    learningStyle: '',
    collaborationPreference: '',
    timePreference: '',
    guidancePreference: '',
    workPace: ''
  };

  export let progressWidth = '75%';

  // Reactive state
  let isLoading = false;
  let selectedCategory = 'all';
  let activeToast: { message: string; type: ToastType } | null = null;

  const learningStyleOptions = [
    { id: 'visual', label: 'Visual Learner', value: 'visual', icon: 'fa-solid fa-eye', description: 'Learn best with diagrams and visuals', gradient: 'from-purple-500 to-pink-500' },
    { id: 'auditory', label: 'Auditory Learner', value: 'auditory', icon: 'fa-solid fa-headphones', description: 'Learn best by listening', gradient: 'from-sky-500 to-blue-500' },
    { id: 'kinesthetic', label: 'Hands-on Learner', value: 'kinesthetic', icon: 'fa-solid fa-hand-sparkles', description: 'Learn by doing and practicing', gradient: 'from-emerald-500 to-green-500' },
    { id: 'reading', label: 'Reading/Writing', value: 'reading', icon: 'fa-solid fa-book-open', description: 'Learn best through reading and writing', gradient: 'from-amber-500 to-yellow-500' }
  ];

  const collaborationOptions = [
    { id: 'study-group', label: 'Study Groups', value: 'study-group', icon: 'fa-solid fa-people-group', description: 'Prefer working in study groups', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'solo', label: 'Independent', value: 'solo', icon: 'fa-solid fa-user', description: 'Prefer working alone on assignments', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'mixed', label: 'Mix of Both', value: 'mixed', icon: 'fa-solid fa-users-line', description: 'Enjoy both group and solo work', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'partner', label: 'Partner Work', value: 'partner', icon: 'fa-solid fa-user-group', description: 'Prefer working with one partner', gradient: 'from-pink-500 to-rose-500' }
  ];

  const timePreferenceOptions = [
    { id: 'morning', label: 'Morning Person', value: 'morning', icon: 'fa-solid fa-sun', description: 'Most productive in the morning', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'afternoon', label: 'Afternoon', value: 'afternoon', icon: 'fa-solid fa-clock', description: 'Most productive in the afternoon', gradient: 'from-orange-500 to-red-500' },
    { id: 'evening', label: 'Evening/Night', value: 'evening', icon: 'fa-solid fa-moon', description: 'Most productive in evenings', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'flexible-time', label: 'Flexible', value: 'flexible-time', icon: 'fa-solid fa-clock-rotate-left', description: 'Productive at different times', gradient: 'from-slate-500 to-gray-500' }
  ];

  const guidanceOptions = [
    { id: 'structured', label: 'Structured Guidance', value: 'structured', icon: 'fa-solid fa-list-check', description: 'Prefer clear instructions and deadlines', gradient: 'from-blue-500 to-indigo-500' },
    { id: 'autonomous', label: 'Self-Directed', value: 'autonomous', icon: 'fa-solid fa-person-running', description: 'Prefer setting own goals and pace', gradient: 'from-green-500 to-emerald-500' },
    { id: 'mentorship', label: 'Mentorship', value: 'mentorship', icon: 'fa-solid fa-user-tie', description: 'Prefer regular feedback and guidance', gradient: 'from-purple-500 to-pink-500' },
    { id: 'collaborative', label: 'Collaborative', value: 'collaborative', icon: 'fa-solid fa-comments', description: 'Prefer shared decision making', gradient: 'from-teal-500 to-cyan-500' }
  ];

  const paceOptions = [
    { id: 'fast', label: 'Fast-paced', value: 'fast', icon: 'fa-solid fa-gauge-high', description: 'Thrive in dynamic, busy environments', gradient: 'from-red-500 to-orange-500' },
    { id: 'steady', label: 'Steady Pace', value: 'steady', icon: 'fa-solid fa-chart-line', description: 'Prefer consistent, predictable work', gradient: 'from-blue-500 to-sky-500' },
    { id: 'balanced', label: 'Balanced', value: 'balanced', icon: 'fa-solid fa-sliders', description: 'Mix of focused work and breaks', gradient: 'from-green-500 to-emerald-500' },
    { id: 'project-based', label: 'Project-based', value: 'project-based', icon: 'fa-solid fa-bullseye', description: 'Work intensively on projects', gradient: 'from-purple-500 to-indigo-500' }
  ];

  // Helper function to extract gradient colors
  function getGradientColors(gradientString: string): string {
    if (!gradientString) return '#6366f1, #818cf8';
    
    // Handle different gradient string formats
    if (gradientString.includes('from-') && gradientString.includes('to-')) {
      const colors = gradientString.replace('from-', '').replace('to-', '').split(' ');
      if (colors.length === 2) {
        return `${colors[0]}, ${colors[1]}`;
      }
    }
    
    // Fallback gradients based on common patterns
    if (gradientString.includes('purple') && gradientString.includes('pink')) {
      return '#a855f7, #ec4899';
    } else if (gradientString.includes('sky') && gradientString.includes('blue')) {
      return '#0ea5e9, #3b82f6';
    } else if (gradientString.includes('emerald') && gradientString.includes('green')) {
      return '#10b981, #22c55e';
    } else if (gradientString.includes('amber') && gradientString.includes('yellow')) {
      return '#f59e0b, #eab308';
    } else if (gradientString.includes('indigo') && gradientString.includes('purple')) {
      return '#6366f1, #8b5cf6';
    } else if (gradientString.includes('blue') && gradientString.includes('cyan')) {
      return '#3b82f6, #06b6d4';
    } else if (gradientString.includes('pink') && gradientString.includes('rose')) {
      return '#ec4899, #f43f5e';
    } else if (gradientString.includes('yellow') && gradientString.includes('amber')) {
      return '#eab308, #f59e0b';
    } else if (gradientString.includes('orange') && gradientString.includes('red')) {
      return '#f97316, #ef4444';
    } else if (gradientString.includes('slate') && gradientString.includes('gray')) {
      return '#64748b, #6b7280';
    } else if (gradientString.includes('red') && gradientString.includes('orange')) {
      return '#ef4444, #f97316';
    } else if (gradientString.includes('green') && gradientString.includes('emerald')) {
      return '#22c55e, #10b981';
    } else if (gradientString.includes('purple') && gradientString.includes('indigo')) {
      return '#8b5cf6, #6366f1';
    }
    
    return '#6366f1, #818cf8';
  }

  // Lookups for better performance
  const learningStyleLookup = new Map(learningStyleOptions.map(opt => [opt.value, opt]));
  const collaborationLookup = new Map(collaborationOptions.map(opt => [opt.value, opt]));
  const timePreferenceLookup = new Map(timePreferenceOptions.map(opt => [opt.value, opt]));
  const guidanceLookup = new Map(guidanceOptions.map(opt => [opt.value, opt]));
  const paceLookup = new Map(paceOptions.map(opt => [opt.value, opt]));

  // Reactive declarations
  $: hasSelections = (
    data.learningStyle || 
    data.collaborationPreference || 
    data.timePreference || 
    data.guidancePreference || 
    data.workPace
  );

  // All 5 sections must be completed
  $: isFormComplete = (
    data.learningStyle && 
    data.collaborationPreference && 
    data.timePreference && 
    data.guidancePreference && 
    data.workPace
  );

  // Proper completion count calculation
  $: selectedCount = [
    data.learningStyle,
    data.collaborationPreference,
    data.timePreference,
    data.guidancePreference,
    data.workPace
  ].filter(value => value).length;
  
  const totalCount = 5; // Fixed to 5 categories

  // Lifecycle
  onMount(() => {
    console.log('Work Preferences component mounted');
    console.log('Initial work preferences state:', {
      learningStyle: data.learningStyle,
      collaborationPreference: data.collaborationPreference,
      timePreference: data.timePreference,
      guidancePreference: data.guidancePreference,
      workPace: data.workPace,
      isFormComplete: isFormComplete,
      selectedCount: selectedCount
    });
  });

  // Helper functions
  const getOptionIcon = (lookup: Map<string, any>, value: string) => 
    lookup.get(value)?.icon || 'fa-solid fa-question';
  
  const getOptionLabel = (lookup: Map<string, any>, value: string) => 
    lookup.get(value)?.label || value;
  
  const getOptionGradient = (lookup: Map<string, any>, value: string) => 
    lookup.get(value)?.gradient || 'from-gray-500 to-slate-500';
  
  const getOptionDescription = (lookup: Map<string, any>, value: string) => 
    lookup.get(value)?.description || '';

  // Event handlers
  const handleSelectionChange = (field: keyof WorkPreferences, value: string, displayName: string) => {
    data[field] = value;
    showToast(`${displayName} selected`, 'success');
  };

  const clearAllSelections = () => {
    data.learningStyle = '';
    data.collaborationPreference = '';
    data.timePreference = '';
    data.guidancePreference = '';
    data.workPace = '';
    showToast('All selections cleared', 'info');
  };

  // Toast system
  const showToast = (message: string, type: ToastType = 'info') => {
    if (activeToast?.message === message) return;
    
    activeToast = { message, type };
    
    setTimeout(() => {
      activeToast = null;
    }, 3000);
  };

  // Enhanced navigation with detailed validation
  const goNext = async () => {
    console.log('Next button clicked - Generating career recommendations');
    console.log('Current work preferences state:', {
      learningStyle: data.learningStyle,
      collaborationPreference: data.collaborationPreference,
      timePreference: data.timePreference,
      guidancePreference: data.guidancePreference,
      workPace: data.workPace,
      isFormComplete: isFormComplete
    });
    
    const requiredFields = [
      { field: 'learningStyle', name: 'learning style' },
      { field: 'collaborationPreference', name: 'collaboration preference' },
      { field: 'timePreference', name: 'time preference' },
      { field: 'guidancePreference', name: 'guidance preference' },
      { field: 'workPace', name: 'work pace' }
    ];
    
    // Detailed validation with specific messages
    for (const { field, name } of requiredFields) {
      if (!data[field as keyof WorkPreferences]) {
        showToast(`Please select your ${name}`, 'warning');
        return;
      }
    }
    
    // All validations passed
    isLoading = true;
    
    try {
      // Prepare data for dispatch - include ALL data
      const completionData = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      console.log('Dispatching complete event with data for AI processing:', completionData);
      
      // Emit the complete event - the parent will handle API call
      dispatch('complete', completionData);
      
    } catch (error) {
      console.error('Error in goNext:', error);
      showToast('Failed to proceed. Please try again.', 'warning');
      isLoading = false;
    }
  };
  
  const goBack = () => {
    console.log('Going back to skills');
    dispatch('back');
  };
</script>

<div class="work-page">
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

  <div class="work-header">
    <div class="header-content">
      <div class="header-title">
        <i class="fa-solid fa-briefcase header-icon"></i>
        <h1>Career Pathfinder</h1>
      </div>
      <p class="header-subtitle">Define your ideal work environment and study preferences for better career matches</p>
    </div>
  </div>

  <div class="full-width-container">
    <section class="work-content">
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
          <div class="progress-step">
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
          <div class="progress-step active">
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
        <div class="progress-text">Step 4 of 5 • {Math.round(parseInt(progressWidth))}% complete</div>
      </div>

      <div class="content-header">
        <div class="content-title">
          <h2>Work & Study Preferences</h2>
          <p class="content-subtitle">Define your ideal work environment, learning style, and collaboration preferences</p>
        </div>
        <div class="selection-counter">
          <div class="counter-badge">
            <i class="fa-solid fa-check"></i>
            <!-- Shows proper selection count -->
            <span>{selectedCount}/{totalCount} selections</span>
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
              <span class="preview-count">({selectedCount} items)</span>
            </div>
            <button class="clear-all" on:click={clearAllSelections} aria-label="Clear all selections">
              <i class="fa-solid fa-trash"></i> Clear All
            </button>
          </div>
          <div class="preview-items">
            {#if data.learningStyle}
              <div class="preview-category">
                <h4>Learning Style</h4>
                <div class="preview-tags">
                  <span class="preview-tag" transition:scale style="--tag-gradient: {getOptionGradient(learningStyleLookup, data.learningStyle)}">
                    <div class="tag-icon" style="background: linear-gradient(135deg, {getGradientColors(getOptionGradient(learningStyleLookup, data.learningStyle))})">
                      <i class="{getOptionIcon(learningStyleLookup, data.learningStyle)}"></i>
                    </div>
                    <span class="tag-label">{getOptionLabel(learningStyleLookup, data.learningStyle)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.learningStyle = ''}
                      aria-label="Remove learning style"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
            
            {#if data.collaborationPreference}
              <div class="preview-category">
                <h4>Collaboration</h4>
                <div class="preview-tags">
                  <span class="preview-tag" transition:scale style="--tag-gradient: {getOptionGradient(collaborationLookup, data.collaborationPreference)}">
                    <div class="tag-icon" style="background: linear-gradient(135deg, {getGradientColors(getOptionGradient(collaborationLookup, data.collaborationPreference))})">
                      <i class="{getOptionIcon(collaborationLookup, data.collaborationPreference)}"></i>
                    </div>
                    <span class="tag-label">{getOptionLabel(collaborationLookup, data.collaborationPreference)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.collaborationPreference = ''}
                      aria-label="Remove collaboration preference"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
            
            {#if data.timePreference}
              <div class="preview-category">
                <h4>Time Preference</h4>
                <div class="preview-tags">
                  <span class="preview-tag" transition:scale style="--tag-gradient: {getOptionGradient(timePreferenceLookup, data.timePreference)}">
                    <div class="tag-icon" style="background: linear-gradient(135deg, {getGradientColors(getOptionGradient(timePreferenceLookup, data.timePreference))})">
                      <i class="{getOptionIcon(timePreferenceLookup, data.timePreference)}"></i>
                    </div>
                    <span class="tag-label">{getOptionLabel(timePreferenceLookup, data.timePreference)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.timePreference = ''}
                      aria-label="Remove time preference"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
            
            {#if data.guidancePreference}
              <div class="preview-category">
                <h4>Guidance Style</h4>
                <div class="preview-tags">
                  <span class="preview-tag" transition:scale style="--tag-gradient: {getOptionGradient(guidanceLookup, data.guidancePreference)}">
                    <div class="tag-icon" style="background: linear-gradient(135deg, {getGradientColors(getOptionGradient(guidanceLookup, data.guidancePreference))})">
                      <i class="{getOptionIcon(guidanceLookup, data.guidancePreference)}"></i>
                    </div>
                    <span class="tag-label">{getOptionLabel(guidanceLookup, data.guidancePreference)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.guidancePreference = ''}
                      aria-label="Remove guidance preference"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                </div>
              </div>
            {/if}
            
            {#if data.workPace}
              <div class="preview-category">
                <h4>Work Pace</h4>
                <div class="preview-tags">
                  <span class="preview-tag" transition:scale style="--tag-gradient: {getOptionGradient(paceLookup, data.workPace)}">
                    <div class="tag-icon" style="background: linear-gradient(135deg, {getGradientColors(getOptionGradient(paceLookup, data.workPace))})">
                      <i class="{getOptionIcon(paceLookup, data.workPace)}"></i>
                    </div>
                    <span class="tag-label">{getOptionLabel(paceLookup, data.workPace)}</span>
                    <button 
                      class="remove-tag" 
                      on:click={() => data.workPace = ''}
                      aria-label="Remove work pace"
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

      <!-- Learning Style Question -->
      <div class="question-card learning-style-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon learning-style-icon">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div class="title-content">
              <h3>Learning Style</h3>
              <span class="question-subtitle">How do you learn best?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-book-open"></i>
            <span>Learning</span>
          </div>
        </div>
        <div class="options-grid">
          {#each learningStyleOptions as option (option.id)}
            <label class="option-card {data.learningStyle === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="learningStyle"
                value={option.value}
                checked={data.learningStyle === option.value}
                on:change={() => handleSelectionChange('learningStyle', option.value, 'Learning style')}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {getGradientColors(option.gradient)})">
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

      <!-- Collaboration Preference Question -->
      <div class="question-card collaboration-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon collaboration-icon">
              <i class="fa-solid fa-people-group"></i>
            </div>
            <div class="title-content">
              <h3>Collaboration Style</h3>
              <span class="question-subtitle">How do you prefer to work on projects?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-user-tie"></i>
            <span>Teamwork</span>
          </div>
        </div>
        <div class="options-grid">
          {#each collaborationOptions as option (option.id)}
            <label class="option-card {data.collaborationPreference === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="collaboration"
                value={option.value}
                checked={data.collaborationPreference === option.value}
                on:change={() => handleSelectionChange('collaborationPreference', option.value, 'Collaboration preference')}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {getGradientColors(option.gradient)})">
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

      <!-- Time Preference Question -->
      <div class="question-card time-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon time-icon">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div class="title-content">
              <h3>Productivity Time</h3>
              <span class="question-subtitle">When are you most focused and productive?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-alarm-clock"></i>
            <span>Schedule</span>
          </div>
        </div>
        <div class="options-grid">
          {#each timePreferenceOptions as option (option.id)}
            <label class="option-card {data.timePreference === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="timePreference"
                value={option.value}
                checked={data.timePreference === option.value}
                on:change={() => handleSelectionChange('timePreference', option.value, 'Time preference')}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {getGradientColors(option.gradient)})">
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

      <!-- Guidance Preference Question -->
      <div class="question-card guidance-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon guidance-icon">
              <i class="fa-solid fa-user-tie"></i>
            </div>
            <div class="title-content">
              <h3>Guidance Preference</h3>
              <span class="question-subtitle">What type of supervision do you prefer?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-list-check"></i>
            <span>Management</span>
          </div>
        </div>
        <div class="options-grid">
          {#each guidanceOptions as option (option.id)}
            <label class="option-card {data.guidancePreference === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="guidance"
                value={option.value}
                checked={data.guidancePreference === option.value}
                on:change={() => handleSelectionChange('guidancePreference', option.value, 'Guidance preference')}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {getGradientColors(option.gradient)})">
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

      <!-- Work Pace Question -->
      <div class="question-card pace-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon pace-icon">
              <i class="fa-solid fa-gauge-high"></i>
            </div>
            <div class="title-content">
              <h3>Work Pace</h3>
              <span class="question-subtitle">What tempo suits your work style?</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-stopwatch"></i>
            <span>Pace</span>
          </div>
        </div>
        <div class="options-grid">
          {#each paceOptions as option (option.id)}
            <label class="option-card {data.workPace === option.value ? 'selected' : ''}"
                   style="--option-gradient: {option.gradient}">
              <input
                type="radio"
                name="workPace"
                value={option.value}
                checked={data.workPace === option.value}
                on:change={() => handleSelectionChange('workPace', option.value, 'Work pace')}
                aria-label="{option.label} - {option.description}"
              />
              <div class="option-content">
                <div class="option-icon" style="background: linear-gradient(135deg, {getGradientColors(option.gradient)})">
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

      <!-- Navigation Buttons -->
      <div class="navigation-buttons">
        <button class="nav-button back-button" type="button" on:click={goBack}>
          <i class="fa-solid fa-chevron-left"></i>
          <span>Back to Skills</span>
        </button>
        
        <div class="completion-status">
          <div class="status-content">
            {#if isFormComplete}
              <div class="status-icon complete">
                <i class="fa-solid fa-check-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Ready to See Results</span>
                <!-- Shows 5/5 when complete -->
                <span class="status-subtitle">{totalCount}/{totalCount} sections completed</span>
              </div>
            {:else}
              <div class="status-icon incomplete">
                <i class="fa-solid fa-exclamation-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Complete All Sections</span>
                <!-- Shows actual completion count -->
                <span class="status-subtitle">{selectedCount}/{totalCount} sections done</span>
              </div>
            {/if}
          </div>
        </div>
        
        <button 
          class="nav-button next-button {isFormComplete ? 'glow' : ''}" 
          type="button" 
          on:click={goNext}
          disabled={!isFormComplete || isLoading}
        >
          {#if isLoading}
            <div class="button-loader"></div>
            <span>Processing...</span>
          {:else}
            <span>See Results</span>
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
  }

  .work-page {
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

  .work-header {
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
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 4px 20px rgba(99, 102, 241, 0.3));
  }

  .work-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #f8fafc, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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

  .work-content {
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
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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

  .preview-category h4 {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
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

  .preview-tag .tag-icon {
    background: var(--tag-gradient, var(--gradient-primary));
    color: white;
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

  .learning-style-icon {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(192, 132, 252, 0.1));
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #c084fc;
  }

  .collaboration-icon {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1));
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
  }

  .time-icon {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .guidance-icon {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #818cf8;
  }

  .pace-icon {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1));
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
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
    .work-content {
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
    .work-content {
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
    .work-page {
      padding: 0;
    }

    .toast {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }

    .work-header {
      padding: 2rem 1rem;
    }

    .work-header h1 {
      font-size: 2rem;
    }

    .header-subtitle {
      font-size: 1rem;
    }

    .work-content {
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
    .work-content {
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