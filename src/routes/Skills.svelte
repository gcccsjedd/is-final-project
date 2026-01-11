<!-- Skills.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';  // Corrected import path
  
  const dispatch = createEventDispatcher();

  // Types for better type safety
  type SkillData = {
    strengths: string[];
    technicalSkills: string[];
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

  export let data: SkillData = {
    strengths: [],
    technicalSkills: []
  };

  export let progressWidth = '50%';

  // Reactive state
  let searchQuery = '';
  let isLoading = false;
  let selectedCategory = 'all';
  let activeToast: { message: string; type: ToastType } | null = null;

  // Constants
  const STRENGTH_LIMIT = 3;
  const SKILLS_LIMIT = 6;

  const strengthOptions = [
    { id: 'leadership', label: 'Leadership', value: 'leadership', icon: 'fa-solid fa-crown', description: 'Guiding and motivating teams', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'teamwork', label: 'Teamwork', value: 'teamwork', icon: 'fa-solid fa-people-group', description: 'Collaborating effectively with others', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'creativity', label: 'Creativity', value: 'creativity', icon: 'fa-solid fa-palette', description: 'Generating innovative ideas', gradient: 'from-pink-500 to-rose-500' },
    { id: 'problem-solving', label: 'Problem Solving', value: 'problem-solving', icon: 'fa-solid fa-puzzle-piece', description: 'Analyzing and resolving challenges', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'adaptability', label: 'Adaptability', value: 'adaptability', icon: 'fa-solid fa-arrows-rotate', description: 'Adjusting to changing circumstances', gradient: 'from-amber-500 to-orange-500' },
    { id: 'communication', label: 'Communication', value: 'communication', icon: 'fa-solid fa-comments', description: 'Expressing ideas clearly', gradient: 'from-sky-500 to-blue-500' },
    { id: 'time-management', label: 'Time Management', value: 'time-management', icon: 'fa-solid fa-clock', description: 'Prioritizing tasks efficiently', gradient: 'from-violet-500 to-purple-500' },
    { id: 'critical-thinking', label: 'Critical Thinking', value: 'critical-thinking', icon: 'fa-solid fa-brain', description: 'Evaluating information logically', gradient: 'from-indigo-500 to-blue-500' }
  ];

  const technicalSkillCategories = [
    {
      id: 'healthcare',
      name: 'Healthcare & Medicine',
      icon: 'fa-solid fa-stethoscope',
      gradient: 'from-rose-500 to-pink-500',
      skills: [
        { id: 'patient-care', label: 'Patient Care', value: 'patient-care', category: 'healthcare' },
        { id: 'medical-diagnosis', label: 'Medical Diagnosis', value: 'medical-diagnosis', category: 'healthcare' },
        { id: 'pharmaceutical', label: 'Pharmaceutical Knowledge', value: 'pharmaceutical', category: 'healthcare' },
        { id: 'medical-research', label: 'Medical Research', value: 'medical-research', category: 'healthcare' },
        { id: 'lab-techniques', label: 'Lab Techniques', value: 'lab-techniques', category: 'healthcare' }
      ]
    },
    {
      id: 'technology',
      name: 'Technology & IT',
      icon: 'fa-solid fa-laptop-code',
      gradient: 'from-purple-500 to-indigo-500',
      skills: [
        { id: 'programming', label: 'Programming', value: 'programming', category: 'technology' },
        { id: 'web-development', label: 'Web Development', value: 'web-development', category: 'technology' },
        { id: 'mobile-development', label: 'Mobile Development', value: 'mobile-development', category: 'technology' },
        { id: 'data-analysis', label: 'Data Analysis', value: 'data-analysis', category: 'technology' },
        { id: 'cybersecurity', label: 'Cybersecurity', value: 'cybersecurity', category: 'technology' }
      ]
    },
    {
      id: 'business',
      name: 'Business & Management',
      icon: 'fa-solid fa-building',
      gradient: 'from-amber-500 to-orange-500',
      skills: [
        { id: 'project-management', label: 'Project Management', value: 'project-management', category: 'business' },
        { id: 'financial-analysis', label: 'Financial Analysis', value: 'financial-analysis', category: 'business' },
        { id: 'marketing-strategy', label: 'Marketing Strategy', value: 'marketing-strategy', category: 'business' },
        { id: 'sales-skills', label: 'Sales Skills', value: 'sales-skills', category: 'business' },
        { id: 'business-planning', label: 'Business Planning', value: 'business-planning', category: 'business' }
      ]
    },
    {
      id: 'creative',
      name: 'Creative & Design',
      icon: 'fa-solid fa-paintbrush',
      gradient: 'from-pink-500 to-rose-500',
      skills: [
        { id: 'graphic-design', label: 'Graphic Design', value: 'graphic-design', category: 'creative' },
        { id: 'ui-ux-design', label: 'UI/UX Design', value: 'ui-ux-design', category: 'creative' },
        { id: 'video-editing', label: 'Video Editing', value: 'video-editing', category: 'creative' },
        { id: 'content-writing', label: 'Content Writing', value: 'content-writing', category: 'creative' },
        { id: 'digital-illustration', label: 'Digital Illustration', value: 'digital-illustration', category: 'creative' }
      ]
    },
    {
      id: 'research',
      name: 'Research & Academics',
      icon: 'fa-solid fa-book-open',
      gradient: 'from-emerald-500 to-teal-500',
      skills: [
        { id: 'academic-writing', label: 'Academic Writing', value: 'academic-writing', category: 'research' },
        { id: 'data-collection', label: 'Data Collection', value: 'data-collection', category: 'research' },
        { id: 'statistical-analysis', label: 'Statistical Analysis', value: 'statistical-analysis', category: 'research' },
        { id: 'literature-review', label: 'Literature Review', value: 'literature-review', category: 'research' },
        { id: 'presentation-skills', label: 'Presentation Skills', value: 'presentation-skills', category: 'research' }
      ]
    },
    {
      id: 'education',
      name: 'Education & Teaching',
      icon: 'fa-solid fa-chalkboard-user',
      gradient: 'from-yellow-500 to-amber-500',
      skills: [
        { id: 'lesson-planning', label: 'Lesson Planning', value: 'lesson-planning', category: 'education' },
        { id: 'classroom-management', label: 'Classroom Management', value: 'classroom-management', category: 'education' },
        { id: 'tutoring', label: 'Tutoring', value: 'tutoring', category: 'education' },
        { id: 'educational-technology', label: 'Educational Technology', value: 'educational-technology', category: 'education' },
        { id: 'curriculum-development', label: 'Curriculum Development', value: 'curriculum-development', category: 'education' }
      ]
    },
    {
      id: 'engineering',
      name: 'Engineering & Technical',
      icon: 'fa-solid fa-gears',
      gradient: 'from-violet-500 to-purple-500',
      skills: [
        { id: 'cad-design', label: 'CAD Design', value: 'cad-design', category: 'engineering' },
        { id: 'prototyping', label: 'Prototyping', value: 'prototyping', category: 'engineering' },
        { id: 'technical-drawing', label: 'Technical Drawing', value: 'technical-drawing', category: 'engineering' },
        { id: 'materials-science', label: 'Materials Science', value: 'materials-science', category: 'engineering' },
        { id: 'quality-control', label: 'Quality Control', value: 'quality-control', category: 'engineering' }
      ]
    },
    {
      id: 'social-sciences',
      name: 'Social Sciences',
      icon: 'fa-solid fa-globe',
      gradient: 'from-blue-500 to-cyan-500',
      skills: [
        { id: 'research-methodology', label: 'Research Methodology', value: 'research-methodology', category: 'social-sciences' },
        { id: 'data-interpretation', label: 'Data Interpretation', value: 'data-interpretation', category: 'social-sciences' },
        { id: 'survey-design', label: 'Survey Design', value: 'survey-design', category: 'social-sciences' },
        { id: 'policy-analysis', label: 'Policy Analysis', value: 'policy-analysis', category: 'social-sciences' },
        { id: 'cross-cultural', label: 'Cross-cultural Communication', value: 'cross-cultural', category: 'social-sciences' }
      ]
    },
    {
      id: 'administrative',
      name: 'Administrative & Office',
      icon: 'fa-solid fa-file',
      gradient: 'from-slate-500 to-gray-500',
      skills: [
        { id: 'office-administration', label: 'Office Administration', value: 'office-administration', category: 'administrative' },
        { id: 'data-entry', label: 'Data Entry', value: 'data-entry', category: 'administrative' },
        { id: 'bookkeeping', label: 'Bookkeeping', value: 'bookkeeping', category: 'administrative' },
        { id: 'event-planning', label: 'Event Planning', value: 'event-planning', category: 'administrative' },
        { id: 'records-management', label: 'Records Management', value: 'records-management', category: 'administrative' }
      ]
    },
    {
      id: 'communications',
      name: 'Communications & Media',
      icon: 'fa-solid fa-broadcast-tower',
      gradient: 'from-fuchsia-500 to-pink-500',
      skills: [
        { id: 'social-media', label: 'Social Media Management', value: 'social-media', category: 'communications' },
        { id: 'public-speaking', label: 'Public Speaking', value: 'public-speaking', category: 'communications' },
        { id: 'journalism', label: 'Journalism', value: 'journalism', category: 'communications' },
        { id: 'digital-marketing', label: 'Digital Marketing', value: 'digital-marketing', category: 'communications' },
        { id: 'brand-management', label: 'Brand Management', value: 'brand-management', category: 'communications' }
      ]
    }
  ];

  const allSkills = technicalSkillCategories.flatMap(category => 
    category.skills.map(skill => ({ ...skill, categoryId: category.id }))
  );

  const skillCategories = [
    { id: 'all', name: 'All Skills', icon: 'fa-solid fa-border-all', gradient: 'from-gray-500 to-slate-500' },
    ...technicalSkillCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      gradient: cat.gradient
    }))
  ];

  const strengthLookup = new Map(strengthOptions.map(opt => [opt.value, opt]));
  const skillLookup = new Map(allSkills.map(skill => [skill.value, skill]));
  const skillCategoryLookup = new Map();
  
  technicalSkillCategories.forEach(category => {
    category.skills.forEach(skill => {
      skillCategoryLookup.set(skill.value, category);
    });
  });

  // FIXED: Proper completion checks
  $: selectedSkillsCount = data.technicalSkills.length;
  $: selectedStrengthsCount = data.strengths.length;
  
  $: hasSelections = data.strengths.length > 0 || 
                     data.technicalSkills.length > 0;
  
  // FIXED: Both sections must be completed
  $: isFormComplete = data.strengths.length > 0 && 
                      data.technicalSkills.length > 0;

  $: completionCount = (data.strengths.length > 0 ? 1 : 0) +
                       (data.technicalSkills.length > 0 ? 1 : 0);

  $: filteredSkills = (() => {
    const query = searchQuery.trim().toLowerCase();
    const categoryFilter = selectedCategory;
    
    if (!query && categoryFilter === 'all') {
      return allSkills;
    }

    return allSkills.filter(skill => {
      const matchesSearch = !query || 
        skill.label.toLowerCase().includes(query) || 
        skill.value.toLowerCase().includes(query);
      
      const matchesCategory = categoryFilter === 'all' || skill.categoryId === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  })();

  onMount(() => {
    console.log('Skills component mounted');
    console.log('Initial skills state:', {
      strengths: data.strengths.length,
      technicalSkills: data.technicalSkills.length,
      isFormComplete: isFormComplete
    });
  });

  const getStrengthIcon = (value: string) => strengthLookup.get(value)?.icon || 'fa-solid fa-question';
  const getStrengthLabel = (value: string) => strengthLookup.get(value)?.label || value;
  const getStrengthGradient = (value: string) => strengthLookup.get(value)?.gradient || 'from-gray-500 to-slate-500';
  
  const getSkillCategory = (value: string) => skillCategoryLookup.get(value);
  const getSkillLabel = (value: string) => skillLookup.get(value)?.label || value;
  
  const isStrengthDisabled = (value: string) => 
    data.strengths.length >= STRENGTH_LIMIT && !data.strengths.includes(value);
  
  const isTechnicalSkillDisabled = (value: string) => 
    data.technicalSkills.length >= SKILLS_LIMIT && !data.technicalSkills.includes(value);

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

  const handleStrengthChange = (value: string) => {
    data.strengths = handleMultiSelect(data.strengths, value, STRENGTH_LIMIT, 'strength');
  };

  const handleTechnicalSkillChange = (value: string) => {
    data.technicalSkills = handleMultiSelect(data.technicalSkills, value, SKILLS_LIMIT, 'skill');
  };

  const handleCategoryFilter = (categoryId: string) => {
    selectedCategory = categoryId;
  };

  const clearSearch = () => {
    searchQuery = '';
    selectedCategory = 'all';
  };

  const clearAllSelections = () => {
    data.strengths = [];
    data.technicalSkills = [];
    showToast('All selections cleared', 'info');
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    if (activeToast?.message === message) return;
    
    activeToast = { message, type };
    
    setTimeout(() => {
      activeToast = null;
    }, 3000);
  };

  // FIXED: Enhanced goNext function with detailed validation
  const goNext = async () => {
    console.log('Next button clicked');
    console.log('Current skills state:', {
      strengths: data.strengths.length,
      technicalSkills: data.technicalSkills.length,
      isFormComplete: isFormComplete
    });
    
    // Detailed validation
    if (data.strengths.length === 0) {
      showToast('Please select at least one strength', 'warning');
      return;
    }
    
    if (data.technicalSkills.length === 0) {
      showToast('Please select at least one skill', 'warning');
      return;
    }
    
    // All validations passed
    isLoading = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const completionData = {
        strengths: data.strengths,
        technicalSkills: data.technicalSkills,
        timestamp: new Date().toISOString()
      };
      
      console.log('Dispatching complete event with data:', completionData);
      dispatch('complete', completionData);
      
    } catch (error) {
      console.error('Error saving skills:', error);
      showToast('Failed to save skills. Please try again.', 'warning');
    } finally {
      isLoading = false;
    }
  };

  const goBack = () => {
    dispatch('back');
  };
</script>

<div class="skills-page">
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

  <div class="background-elements">
    <div class="bg-gradient"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
    <div class="bg-particle"></div>
  </div>

  <div class="skills-header">
    <div class="header-content">
      <div class="header-title">
        <i class="fa-solid fa-graduation-cap header-icon"></i>
        <h1>Career Pathfinder</h1>
      </div>
      <p class="header-subtitle">Build your student profile with academic strengths and developing skills</p>
    </div>
  </div>

  <div class="full-width-container">
    <section class="skills-content">
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
          <div class="progress-step active">
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
        <div class="progress-text">Step 3 of 5 • {Math.round(parseInt(progressWidth))}% complete</div>
      </div>

      <div class="content-header">
        <div class="content-title">
          <h2>Showcase Your Skills</h2>
          <p class="content-subtitle">Highlight your academic strengths and technical skills for career opportunities</p>
        </div>
        <div class="selection-counter">
          <div class="counter-badge">
            <i class="fa-solid fa-check"></i>
            <span>{selectedSkillsCount + selectedStrengthsCount}/{SKILLS_LIMIT + STRENGTH_LIMIT} selections</span>
          </div>
        </div>
      </div>

      {#if hasSelections}
        <div class="selection-preview" transition:fade>
          <div class="preview-header">
            <div class="preview-title">
              <i class="fa-solid fa-badge-check preview-icon"></i>
              <h3>Your Selections</h3>
              <span class="preview-count">({selectedStrengthsCount + selectedSkillsCount} items)</span>
            </div>
            <button class="clear-all" on:click={clearAllSelections} aria-label="Clear all selections">
              <i class="fa-solid fa-trash"></i> Clear All
            </button>
          </div>
          <div class="preview-items">
            {#if data.strengths.length > 0}
              <div class="preview-category">
                <div class="category-header">
                  <h4>Strengths</h4>
                  <span class="category-count">{selectedStrengthsCount}/{STRENGTH_LIMIT}</span>
                </div>
                <div class="preview-tags">
                  {#each data.strengths as strength}
                    <span class="preview-tag" transition:scale style="--tag-gradient: var(--gradient-{strength})">
                      <div class="tag-icon" style="background: linear-gradient(135deg, {getStrengthGradient(strength).replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                        <i class="{getStrengthIcon(strength)}"></i>
                      </div>
                      <span class="tag-label">{getStrengthLabel(strength)}</span>
                      <button 
                        class="remove-tag" 
                        on:click={() => handleStrengthChange(strength)}
                        aria-label="Remove {getStrengthLabel(strength)}"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if data.technicalSkills.length > 0}
              <div class="preview-category">
                <div class="category-header">
                  <h4>Skills</h4>
                  <span class="category-count">{selectedSkillsCount}/{SKILLS_LIMIT}</span>
                </div>
                <div class="preview-tags">
                  {#each data.technicalSkills as skillValue}
                    {@const category = getSkillCategory(skillValue)}
                    {@const skillLabel = getSkillLabel(skillValue)}
                    <span class="preview-tag skill-tag" transition:scale>
                      <div class="tag-icon" style="background: linear-gradient(135deg, {category?.gradient?.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                        <i class="{category?.icon}"></i>
                      </div>
                      <span class="tag-label">{skillLabel}</span>
                      <button 
                        class="remove-tag" 
                        on:click={() => handleTechnicalSkillChange(skillValue)}
                        aria-label="Remove {skillLabel}"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <div class="question-card strengths-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon strengths-icon">
              <i class="fa-solid fa-star"></i>
            </div>
            <div class="title-content">
              <h3>Personal Strengths</h3>
              <span class="question-subtitle">Select up to {STRENGTH_LIMIT} that best represent you</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-heart"></i>
            <span>Personal</span>
          </div>
        </div>
        
        <div class="options-grid strength-options">
          {#each strengthOptions as option (option.id)}
            <label 
              class="option-card strength-option {isStrengthDisabled(option.value) ? 'disabled' : ''} {data.strengths.includes(option.value) ? 'selected' : ''}"
              style="--option-gradient: {option.gradient}"
              title="{option.description}"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={data.strengths.includes(option.value)}
                on:change={() => handleStrengthChange(option.value)}
                disabled={isStrengthDisabled(option.value)}
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
        
        {#if selectedStrengthsCount > 0}
          <div class="selection-count">
            <div class="count-progress">
              <div class="progress-track">
                <div class="progress-fill" style="width: {(selectedStrengthsCount / STRENGTH_LIMIT) * 100}%"></div>
              </div>
              <span>{selectedStrengthsCount}/{STRENGTH_LIMIT} selected</span>
            </div>
            {#if selectedStrengthsCount === STRENGTH_LIMIT}
              <div class="limit-reached">
                <i class="fa-solid fa-check-circle"></i>
                <span>Maximum selections reached</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="question-card skills-card">
        <div class="question-header">
          <div class="question-title">
            <div class="title-icon skills-icon">
              <i class="fa-solid fa-wrench"></i>
            </div>
            <div class="title-content">
              <h3>Technical & Academic Skills</h3>
              <span class="question-subtitle">Select up to {SKILLS_LIMIT} skills relevant to your major</span>
            </div>
          </div>
          <div class="question-badge">
            <i class="fa-solid fa-book"></i>
            <span>Academic</span>
          </div>
        </div>
        
        <div class="skills-controls">
          <div class="search-box">
            <div class="search-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <input 
              type="text" 
              placeholder="Search skills..." 
              class="skill-search" 
              bind:value={searchQuery}
              aria-label="Search skills"
            />
            {#if searchQuery}
              <button class="clear-search" on:click={clearSearch} aria-label="Clear search">
                <i class="fa-solid fa-xmark"></i>
              </button>
            {:else}
              <div class="search-hint">
                <i class="fa-solid fa-info-circle"></i>
                <span>Type to filter skills</span>
              </div>
            {/if}
          </div>
          
          <div class="category-filters">
            {#each skillCategories as category (category.id)}
              <button 
                class="category-filter {selectedCategory === category.id ? 'active' : ''}"
                on:click={() => handleCategoryFilter(category.id)}
                style="--filter-gradient: {category.gradient}"
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
        
        {#if searchQuery && filteredSkills.length === 0}
          <div class="no-results">
            <div class="no-results-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <p>No skills found for "{searchQuery}"</p>
            <small>Try a different search term or browse all categories</small>
            <button class="clear-search-btn" on:click={clearSearch}>
              Clear Search
            </button>
          </div>
        {/if}
        
        <div class="options-grid skill-options">
          {#each filteredSkills as skill (skill.id)}
            {#key skill.value}
              {@const category = getSkillCategory(skill.value)}
              <label 
                class="option-card skill-option {isTechnicalSkillDisabled(skill.value) ? 'disabled' : ''} {data.technicalSkills.includes(skill.value) ? 'selected' : ''}"
                style="--option-gradient: {category?.gradient}"
              >
                <input
                  type="checkbox"
                  value={skill.value}
                  checked={data.technicalSkills.includes(skill.value)}
                  on:change={() => handleTechnicalSkillChange(skill.value)}
                  disabled={isTechnicalSkillDisabled(skill.value)}
                  aria-label="{skill.label}"
                />
                <div class="option-content">
                  <div class="option-icon" style="background: linear-gradient(135deg, {category?.gradient?.replace('from-', '').replace('to-', '').replace(' ', ', ')})">
                    <i class="{category?.icon}"></i>
                  </div>
                  <div class="option-details">
                    <span class="option-label">{skill.label}</span>
                    <span class="option-description">{category?.name}</span>
                  </div>
                  <div class="option-check">
                    <div class="checkmark">
                      <i class="fa-solid fa-check"></i>
                    </div>
                  </div>
                </div>
              </label>
            {/key}
          {/each}
        </div>
        
        {#if selectedSkillsCount > 0}
          <div class="selection-count">
            <div class="count-progress">
              <div class="progress-track">
                <div class="progress-fill" style="width: {(selectedSkillsCount / SKILLS_LIMIT) * 100}%"></div>
              </div>
              <span>{selectedSkillsCount}/{SKILLS_LIMIT} selected</span>
            </div>
            {#if selectedSkillsCount === SKILLS_LIMIT}
              <div class="limit-reached">
                <i class="fa-solid fa-check-circle"></i>
                <span>Maximum selections reached</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-buttons">
        <button class="nav-button back-button" type="button" on:click={goBack}>
          <i class="fa-solid fa-chevron-left"></i>
          <span>Back to Preferences</span>
        </button>
        
        <div class="completion-status">
          <div class="status-content">
            {#if isFormComplete}
              <div class="status-icon complete">
                <i class="fa-solid fa-check-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Ready to Continue</span>
                <!-- FIXED: Shows 2/2 when complete -->
                <span class="status-subtitle">2/2 sections completed</span>
              </div>
            {:else}
              <div class="status-icon incomplete">
                <i class="fa-solid fa-exclamation-circle"></i>
              </div>
              <div class="status-text">
                <span class="status-title">Complete All Sections</span>
                <!-- FIXED: Shows actual completion count -->
                <span class="status-subtitle">{completionCount}/2 sections done</span>
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
            <span>Continue to Work</span>
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
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    --gradient-secondary: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-accent: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-error: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    
    --gradient-leadership: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    --gradient-teamwork: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --gradient-creativity: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    --gradient-problem-solving: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    --gradient-adaptability: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --gradient-communication: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
    --gradient-time-management: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    --gradient-critical-thinking: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  }

  .skills-page {
    min-height: 100vh;
    padding: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    font-family: 'Inter', sans-serif;
    color: #f8fafc;
    position: relative;
    overflow-x: hidden;
  }

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

  .skills-header {
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

  .skills-header h1 {
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

  .full-width-container {
    width: 100%;
    max-width: 100%;
    padding: 0 1rem;
    position: relative;
    z-index: 2;
  }

  .skills-content {
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

  .preview-tag:not(.skill-tag) .tag-icon {
    background: var(--tag-gradient, var(--gradient-primary));
    color: white;
  }

  .skill-tag .tag-icon {
    background: linear-gradient(135deg, #6366f1, #818cf8);
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

  .strengths-icon {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .skills-icon {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #818cf8;
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

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

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

  @media (max-width: 1400px) {
    .skills-content {
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
    .skills-content {
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
    .skills-page {
      padding: 0;
    }

    .toast {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }

    .skills-header {
      padding: 2rem 1rem;
    }

    .skills-header h1 {
      font-size: 2rem;
    }

    .header-subtitle {
      font-size: 1rem;
    }

    .skills-content {
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
    .skills-content {
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