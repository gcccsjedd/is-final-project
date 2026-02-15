<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  const dispatch = createEventDispatcher();
  
  interface LoginData {
    firstName: string;
    lastName: string;
    email: string;
  }
  
  // Form state
  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let rememberMe = false;
  let isSignUp = false;
  let isLoading = false;
  let error = '';
  let successMessage = '';
  let showPassword = false;
  
  // Password strength
  let passwordStrength = 0;
  let passwordFeedback = '';
  
  // Auto-save debounce
  let autoSaveTimer: ReturnType<typeof setTimeout>;
  
  // Confetti animation
  let showConfetti = false;
  
  onMount(() => {
    // Check for saved credentials
    const savedEmail = localStorage.getItem('careerGeenie_email');
    const savedFirstName = localStorage.getItem('careerGeenie_firstName');
    const savedLastName = localStorage.getItem('careerGeenie_lastName');
    const savedRemember = localStorage.getItem('careerGeenie_remember');
    
    if (savedEmail && savedFirstName && savedRemember === 'true') {
      email = savedEmail;
      firstName = savedFirstName;
      lastName = savedLastName || '';
      rememberMe = true;
    }
    
    // Add keyboard shortcuts
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(autoSaveTimer);
    };
  });
  
  function handleKeyPress(event: KeyboardEvent) {
    // Toggle between sign in/sign up with Tab
    if (event.key === 'Tab' && !isLoading) {
      event.preventDefault();
      toggleMode();
    }
    
    // Submit with Enter in form
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit();
    }
  }
  
  function handleBackClick() {
    dispatch('back');
  }
  
  // Auto-save draft for better UX
  function autoSaveDraft() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (email || firstName) {
        localStorage.setItem('careerGeenie_draft_email', email);
        localStorage.setItem('careerGeenie_draft_firstName', firstName);
        localStorage.setItem('careerGeenie_draft_lastName', lastName);
      }
    }, 1000);
  }
  
  // Enhanced password validation
  function checkPasswordStrength(pass: string) {
    let strength = 0;
    const feedback = [];
    
    if (pass.length >= 8) strength += 25;
    else feedback.push('At least 8 characters');
    
    if (/[A-Z]/.test(pass)) strength += 25;
    else feedback.push('One uppercase letter');
    
    if (/[0-9]/.test(pass)) strength += 25;
    else feedback.push('One number');
    
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    else feedback.push('One special character');
    
    passwordStrength = strength;
    passwordFeedback = feedback.length > 0 ? `Add ${feedback.join(', ')}` : '';
  }
  
  async function handleSubmit() {
    error = '';
    successMessage = '';
    isLoading = true;
    
    // Clear any existing timeouts
    clearTimeout(autoSaveTimer);
    
    // Enhanced validation
    const validationErrors: string[] = [];
    
    if (!email.trim()) validationErrors.push('Email is required');
    else if (!isValidEmail(email)) validationErrors.push('Please enter a valid email address');
    
    if (!password.trim()) validationErrors.push('Password is required');
    else if (password.length < 6) validationErrors.push('Password must be at least 6 characters');
    
    if (isSignUp) {
      if (!firstName.trim()) validationErrors.push('First name is required');
      if (!lastName.trim()) validationErrors.push('Last name is required');
      
      if (passwordStrength < 50) validationErrors.push('Please use a stronger password');
    }
    
    if (validationErrors.length > 0) {
      error = validationErrors.join('. ');
      isLoading = false;
      return;
    }
    
    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
      
      handleRememberMe();
      
    } catch (err: unknown) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        error = formatErrorMessage(err.message);
      } else {
        error = 'An unexpected error occurred. Please try again.';
      }
    } finally {
      isLoading = false;
    }
  }
  
  async function handleSignUp() {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: fullName,
        }
      }
    });
    
    if (authError) throw authError;
    
    if (authData.user) {
      // Create user profile in your database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            email: email.trim(),
            created_at: new Date().toISOString(),
          }
        ]);
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here - user is created in auth, just profile failed
      }
      
      // Natural success message
      successMessage = `Welcome aboard, ${firstName.trim()}! Your account has been created successfully. We've sent a verification email to ${email.trim()} - please check your inbox.`;
      
      // Show subtle celebration
      showConfetti = true;
      setTimeout(() => showConfetti = false, 2000);
      
      // Dispatch success with user data
      const userData: LoginData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      };
      
      setTimeout(() => {
        dispatch('loginSuccess', userData);
      }, 3000);
    }
  }
  
  async function handleSignIn() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    
    if (authError) throw authError;
    
    if (authData.user) {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', authData.user.id)
        .single();
      
      // Natural welcome back message
      const userName = profileData?.first_name || authData.user.email?.split('@')[0] || 'there';
      successMessage = `Welcome back, ${userName}! You're being redirected to your dashboard...`;
      
      const userData: LoginData = {
        firstName: profileData?.first_name || authData.user.email?.split('@')[0] || 'User',
        lastName: profileData?.last_name || '',
        email: authData.user.email || email.trim()
      };
      
      // Store session
      if (rememberMe) {
        localStorage.setItem('supabase_auth_token', JSON.stringify(authData.session));
      }
      
      // Subtle success indication
      const submitBtn = document.querySelector('.submit-button');
      if (submitBtn) {
        submitBtn.classList.add('success-pulse');
        setTimeout(() => submitBtn.classList.remove('success-pulse'), 1500);
      }
      
      setTimeout(() => {
        dispatch('loginSuccess', userData);
      }, 2000);
    }
  }
  
  function formatErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
      'Email not confirmed': 'Please verify your email address before signing in. Check your inbox for the verification link.',
      'User already registered': 'This email is already registered. Please sign in or use a different email address.',
      'Password should be at least 6 characters': 'For your security, please use a password with at least 6 characters.',
      'Unable to validate email address: invalid format': 'Please enter a valid email address (e.g., name@example.com).',
    };
    
    return errorMap[error] || 'We encountered an issue. Please try again in a moment.';
  }
  
  function handleRememberMe() {
    if (rememberMe) {
      localStorage.setItem('careerGeenie_email', email.trim());
      localStorage.setItem('careerGeenie_firstName', firstName.trim() || email.split('@')[0]);
      localStorage.setItem('careerGeenie_lastName', lastName.trim());
      localStorage.setItem('careerGeenie_remember', 'true');
      localStorage.setItem('careerGeenie_last_login', new Date().toISOString());
    } else {
      localStorage.removeItem('careerGeenie_email');
      localStorage.removeItem('careerGeenie_firstName');
      localStorage.removeItem('careerGeenie_lastName');
      localStorage.removeItem('careerGeenie_remember');
    }
  }
  
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function toggleMode() {
    isSignUp = !isSignUp;
    error = '';
    successMessage = '';
    passwordStrength = 0;
    passwordFeedback = '';
    
    // Animate transition
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      loginCard.classList.add('mode-transition');
      setTimeout(() => {
        loginCard.classList.remove('mode-transition');
      }, 300);
    }
  }
  
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
  
  // Check if user is already logged in
  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // User is already logged in, fetch profile and dispatch success
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        const userData: LoginData = {
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          email: profileData.email
        };
        dispatch('loginSuccess', userData);
      }
    }
  }
  
  // Run session check on mount
  onMount(() => {
    checkSession();
  });
</script>

<div class="login-container">
  <!-- Confetti overlay -->
  {#if showConfetti}
    <div class="confetti-overlay">
      {#each Array(20) as _, i}
        <div class="confetti" style={`--delay: ${i * 0.1}s; --x: ${Math.random() * 100}%; --rotation: ${Math.random() * 360}deg;`}>
          🎉
        </div>
      {/each}
    </div>
  {/if}
  
  <div class="login-header">
    <button 
      class="back-button" 
      on:click={handleBackClick}
      aria-label="Go back to home"
      disabled={isLoading}
      title="Back to Home"
    >
      <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span class="back-text">Home</span>
    </button>
    
    <div class="header-content">
      <div class="logo-wrapper">
        <img 
          src="/logo1-Photoroom.png" 
          alt="CareerGeenie Logo" 
          class="logo-image"
        />
      </div>
      
      <h1 class="login-title">
        {isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
      </h1>
      <p class="login-subtitle">
        {isSignUp 
          ? 'Join our community of ambitious students and career seekers'
          : 'Sign in to continue your personalized career journey'}
      </p>
    </div>
  </div>
  
  <div class="login-card" transition:fade={{ duration: 300 }}>
    <div class="card-header">
      <div class="mode-indicator">
        <button 
          class:active={!isSignUp}
          on:click={() => isSignUp ? toggleMode() : null}
          disabled={isLoading || !isSignUp}
          aria-label="Switch to Sign In"
        >
          <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2"/>
            <path d="M19 4H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Sign In</span>
        </button>
        <button 
          class:active={isSignUp}
          on:click={() => !isSignUp ? toggleMode() : null}
          disabled={isLoading || isSignUp}
          aria-label="Switch to Sign Up"
        >
          <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M20 8v6M23 11h-6" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Sign Up</span>
        </button>
        <div class="mode-slider" class:signup={isSignUp}></div>
      </div>
    </div>
    
    <form class="form" on:submit|preventDefault={handleSubmit}>
      {#if isSignUp}
        <div class="name-fields" transition:slide>
          <div class="input-group">
            <label for="firstName">
              <svg class="input-icon-label" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>First Name *</span>
            </label>
            <div class="input-wrapper">
              <input
                id="firstName"
                type="text"
                placeholder="Alex"
                bind:value={firstName}
                disabled={isLoading}
                on:input={autoSaveDraft}
                required
                aria-describedby="firstName-help"
              />
              <div class="input-hint" id="firstName-help">Your given name</div>
            </div>
          </div>
          
          <div class="input-group">
            <label for="lastName">
              <svg class="input-icon-label" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>Last Name *</span>
            </label>
            <div class="input-wrapper">
              <input
                id="lastName"
                type="text"
                placeholder="Johnson"
                bind:value={lastName}
                disabled={isLoading}
                on:input={autoSaveDraft}
                required
                aria-describedby="lastName-help"
              />
              <div class="input-hint" id="lastName-help">Your family name</div>
            </div>
          </div>
        </div>
      {/if}
      
      <div class="input-group">
        <label for="email">
          <svg class="input-icon-label" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Email Address *</span>
        </label>
        <div class="input-wrapper">
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            bind:value={email}
            disabled={isLoading}
            on:input={autoSaveDraft}
            required
            aria-describedby="email-help"
          />
          <div class="input-hint" id="email-help">We'll never share your email</div>
        </div>
      </div>
      
      <div class="input-group">
        <label for="password">
          <svg class="input-icon-label" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Password *</span>
        </label>
        <div class="input-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
            bind:value={password}
            disabled={isLoading}
            on:input={() => {
              if (isSignUp) checkPasswordStrength(password);
            }}
            required
          />
          <button 
            type="button" 
            class="password-toggle"
            on:click={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              {#if showPassword}
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M2 2l20 20"/>
              {:else}
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              {/if}
            </svg>
          </button>
        </div>
        
        {#if isSignUp && password}
          <div class="password-strength">
            <div class="strength-bar">
              {#each Array(4) as _, i}
                <div 
                  class:filled={passwordStrength >= (i + 1) * 25}
                  class:active={passwordStrength > 0}
                ></div>
              {/each}
            </div>
            <div class="strength-info">
              <span class="strength-text">
                {passwordStrength === 0 ? 'Start typing' : 
                 passwordStrength < 50 ? 'Weak' : 
                 passwordStrength < 75 ? 'Good' : 'Strong'}
              </span>
              {#if passwordFeedback}
                <div class="password-feedback">{passwordFeedback}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
      
      {#if !isSignUp}
        <div class="form-options">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={rememberMe}
              disabled={isLoading}
            />
            <span class="checkmark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="checkbox-text">
              <span>Keep me signed in</span>
              <small>Recommended for personal devices</small>
            </span>
          </label>
        </div>
      {/if}
      
      {#if error}
        <div class="error-message" in:fade out:fade>
          <svg class="error-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div class="error-content">
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
          <button 
            class="error-dismiss" 
            on:click={() => error = ''}
            aria-label="Dismiss error"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      {/if}
      
      {#if successMessage}
        <div class="success-message" in:fade out:fade>
          <svg class="success-icon" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="success-content">
            <strong>{isSignUp ? 'Welcome aboard!' : 'Success!'}</strong>
            <p>{successMessage}</p>
          </div>
          <div class="success-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
      {/if}
      
      <button 
        class="submit-button {isSignUp ? 'signup' : 'signin'}" 
        type="submit" 
        disabled={isLoading}
        title={isSignUp ? 'Create your account' : 'Sign in to your account'}
      >
        {#if isLoading}
          <div class="spinner" aria-hidden="true"></div>
          <span class="button-text">
            {isSignUp ? 'Creating account...' : 'Signing in...'}
          </span>
        {:else}
          <svg class="button-icon" viewBox="0 0 24 24" fill="none">
            {#if isSignUp}
              <path d="M18 9l3 3-3 3M3 12h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" stroke-width="2"/>
            {:else}
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" stroke-width="2"/>
              <polyline points="10 17 15 12 10 7" stroke="currentColor" stroke-width="2"/>
              <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
            {/if}
          </svg>
          <span class="button-text">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </span>
        {/if}
      </button>
      
      <div class="switch-mode">
        <p>
          {isSignUp ? 'Already have an account?' : 'New to CareerGeenie?'}
          <button 
            type="button" 
            class="switch-button"
            on:click={toggleMode}
            disabled={isLoading}
            title={isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
          >
            {isSignUp ? 'Sign in instead' : 'Create an account'}
          </button>
        </p>
      </div>
      
      <div class="login-footer">
        <div class="security-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>Your data is securely encrypted and never shared</span>
        </div>
      </div>
    </form>
  </div>
</div>

<style>
  /* Enhanced CSS with modern design system */
  :global(:root) {
    --primary: #4361ee;
    --primary-dark: #3a56d4;
    --primary-light: #eef2ff;
    --secondary: #7209b7;
    --success: #06d6a0;
    --success-dark: #05c090;
    --error: #ef476f;
    --warning: #ffd166;
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
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
    --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
    --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
    --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --radius-sm: 0.375rem;
    --radius: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1rem;
    --radius-xl: 1.5rem;
    --radius-full: 9999px;
  }
  
  .login-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
    position: relative;
    overflow-x: hidden;
  }
  
  .confetti-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
  }
  
  .confetti {
    position: absolute;
    top: -20px;
    left: var(--x);
    font-size: 1.5rem;
    animation: confetti-fall 2s ease-in-out var(--delay) forwards;
    opacity: 0;
    transform: rotate(var(--rotation));
  }
  
  @keyframes confetti-fall {
    0% {
      opacity: 0;
      transform: translateY(-20px) rotate(0deg);
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) rotate(360deg);
    }
  }
  
  .login-header {
    width: 100%;
    max-width: 28rem;
    margin-bottom: 2rem;
    position: relative;
    z-index: 10;
  }
  
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-full);
    color: var(--gray-700);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
    margin-bottom: 1rem;
  }
  
  .back-button:hover:not(:disabled) {
    background: var(--gray-50);
    border-color: var(--gray-300);
    color: var(--primary);
    transform: translateX(-2px);
    box-shadow: var(--shadow);
  }
  
  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .back-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .logo-image {
    height: 60px;
    width: auto;
    object-fit: contain;
  }
  
  .header-content {
    text-align: center;
  }
  
  .login-title {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--gray-900);
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }
  
  .login-subtitle {
    font-size: 1.125rem;
    color: var(--gray-600);
    line-height: 1.6;
    max-width: 24rem;
    margin: 0 auto;
  }
  
  .login-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: 2.5rem;
    width: 100%;
    max-width: 28rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    z-index: 10;
    border: 1px solid var(--gray-100);
    margin-bottom: 2rem;
    transition: all 0.3s ease;
  }
  
  .card-header {
    margin-bottom: 2rem;
  }
  
  .mode-indicator {
    display: flex;
    position: relative;
    background: var(--gray-100);
    border-radius: var(--radius);
    padding: 0.25rem;
  }
  
  .mode-indicator button {
    flex: 1;
    padding: 0.875rem 1.5rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .mode-indicator button.active {
    color: var(--primary);
  }
  
  .mode-indicator button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .mode-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .mode-slider {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    width: calc(50% - 0.25rem);
    height: calc(100% - 0.5rem);
    background: white;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }
  
  .mode-slider.signup {
    transform: translateX(100%);
  }
  
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .name-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    .name-fields {
      grid-template-columns: 1fr;
    }
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .input-group label {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-weight: 600;
    color: var(--gray-800);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .input-icon-label {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--gray-500);
  }
  
  .input-wrapper {
    position: relative;
  }
  
  .input-wrapper input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    background: white;
    color: var(--gray-900);
  }
  
  .input-wrapper input::placeholder {
    color: var(--gray-400);
  }
  
  .input-wrapper input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
  
  .input-wrapper input:disabled {
    background: var(--gray-50);
    color: var(--gray-400);
    cursor: not-allowed;
  }
  
  .input-hint {
    font-size: 0.75rem;
    color: var(--gray-500);
    margin-top: 0.25rem;
    padding-left: 0.25rem;
  }
  
  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    transition: color 0.2s;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .password-toggle:hover {
    color: var(--gray-600);
    background: var(--gray-100);
  }
  
  .password-toggle svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .password-strength {
    margin-top: 0.5rem;
  }
  
  .strength-bar {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.375rem;
  }
  
  .strength-bar div {
    flex: 1;
    height: 0.375rem;
    background: var(--gray-200);
    border-radius: var(--radius-full);
    transition: all 0.3s ease;
  }
  
  .strength-bar div.filled {
    background: var(--success);
  }
  
  .strength-bar div.filled:nth-child(1) { background: #ef476f; }
  .strength-bar div.filled:nth-child(2) { background: #ffd166; }
  .strength-bar div.filled:nth-child(3) { background: #06d6a0; }
  .strength-bar div.filled:nth-child(4) { background: #118ab2; }
  
  .strength-bar div.active {
    animation: pulseBar 1.5s ease-in-out infinite;
  }
  
  @keyframes pulseBar {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .strength-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .strength-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gray-700);
  }
  
  .password-feedback {
    font-size: 0.75rem;
    color: var(--gray-500);
  }
  
  .form-options {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0.5rem 0;
  }
  
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
  }
  
  .checkbox-label input {
    display: none;
  }
  
  .checkmark {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--gray-300);
    border-radius: var(--radius-sm);
    background: white;
    transition: all 0.2s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .checkmark svg {
    width: 0.875rem;
    height: 0.875rem;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
  }
  
  .checkbox-label input:checked + .checkmark {
    background: var(--primary);
    border-color: var(--primary);
  }
  
  .checkbox-label input:checked + .checkmark svg {
    opacity: 1;
    transform: scale(1);
  }
  
  .checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .checkbox-text span {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--gray-800);
  }
  
  .checkbox-text small {
    color: var(--gray-500);
    font-size: 0.75rem;
  }
  
  .error-message, .success-message {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--radius);
    animation: slideIn 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }
  
  .error-message {
    background: linear-gradient(135deg, #fff5f5, #fed7d7);
    border: 1px solid #feb2b2;
    color: #c53030;
  }
  
  .success-message {
    background: linear-gradient(135deg, #f0fff4, #c6f6d5);
    border: 1px solid #9ae6b4;
    color: #276749;
  }
  
  .error-icon, .success-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .error-content, .success-content {
    flex: 1;
  }
  
  .error-content strong, .success-content strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .error-content p, .success-content p {
    font-size: 0.875rem;
    line-height: 1.5;
    color: inherit;
  }
  
  .error-dismiss {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .error-dismiss:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .error-dismiss svg {
    width: 1rem;
    height: 1rem;
  }
  
  .success-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background: var(--success);
    animation: progress 2s linear forwards;
  }
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  .submit-button {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border: none;
    border-radius: var(--radius);
    padding: 1rem 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin: 0.5rem 0;
    position: relative;
    overflow: hidden;
  }
  
  .submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.75s;
  }
  
  .submit-button:hover:not(:disabled)::before {
    left: 100%;
  }
  
  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  .submit-button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
  }
  
  :global(.submit-button.success-pulse) {
    animation: successPulse 1.5s ease-in-out;
  }
  
  @keyframes successPulse {
    0%, 100% { background: linear-gradient(135deg, var(--primary), var(--secondary)); }
    50% { background: linear-gradient(135deg, var(--success), var(--success-dark)); }
  }
  
  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .button-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .switch-mode {
    text-align: center;
    margin: 1rem 0;
  }
  
  .switch-mode p {
    color: var(--gray-600);
    font-size: 0.9375rem;
  }
  
  .switch-button {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 600;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin-left: 0.25rem;
    position: relative;
    transition: color 0.2s;
  }
  
  .switch-button:hover:not(:disabled) {
    color: var(--primary-dark);
  }
  
  .switch-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .login-footer {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--gray-200);
  }
  
  .security-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--gray-500);
    background: var(--gray-50);
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius);
  }
  
  .security-note svg {
    width: 1rem;
    height: 1rem;
    color: var(--success);
  }
  
  /* Animations */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Responsive Design */
  @media (max-width: 640px) {
    .login-container {
      padding: 1rem;
    }
    
    .login-card {
      padding: 2rem 1.5rem;
    }
    
    .login-title {
      font-size: 2rem;
    }
  }
  
  @media (max-width: 480px) {
    .login-header {
      margin-bottom: 1.5rem;
    }
    
    .login-card {
      padding: 1.5rem 1.25rem;
    }
    
    .login-title {
      font-size: 1.75rem;
    }
    
    .login-subtitle {
      font-size: 1rem;
    }
    
    .logo-image {
      height: 50px;
    }
  }
</style>