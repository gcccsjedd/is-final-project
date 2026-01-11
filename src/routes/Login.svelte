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
      
      successMessage = '🎉 Account created successfully! Please check your email to verify your account.';
      
      // Dispatch success with user data
      const userData: LoginData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      };
      
      setTimeout(() => {
        dispatch('loginSuccess', userData);
      }, 2000);
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
      
      successMessage = '✅ Login successful! Redirecting...';
      
      const userData: LoginData = {
        firstName: profileData?.first_name || authData.user.email?.split('@')[0] || 'User',
        lastName: profileData?.last_name || '',
        email: authData.user.email || email.trim()
      };
      
      // Store session
      if (rememberMe) {
        localStorage.setItem('supabase_auth_token', JSON.stringify(authData.session));
      }
      
      setTimeout(() => {
        dispatch('loginSuccess', userData);
      }, 1500);
    }
  }
  
  function formatErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please verify your email address before signing in.',
      'User already registered': 'An account with this email already exists. Please sign in instead.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    };
    
    return errorMap[error] || error || 'An unexpected error occurred. Please try again.';
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
  
  async function handleForgotPassword() {
    if (!email.trim()) {
      error = 'Please enter your email address first';
      return;
    }
    
    if (!isValidEmail(email)) {
      error = 'Please enter a valid email address';
      return;
    }
    
    isLoading = true;
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (resetError) throw resetError;
      
      successMessage = '📧 Password reset link has been sent to your email!';
      
      // Track password reset request
      localStorage.setItem('careerGeenie_password_reset_requested', new Date().toISOString());
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      error = 'Failed to send reset link. Please try again.';
    } finally {
      isLoading = false;
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
  <div class="login-header">
    <button 
      class="back-button" 
      on:click={handleBackClick}
      aria-label="Go back to home"
      disabled={isLoading}
      title="Back to Home"
    >
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
      <span class="back-text">Back to Home</span>
    </button>
    
    <div class="header-content">
      <h1 class="login-title">
        {isSignUp ? 'Begin Your Journey ✨' : 'Welcome Back! 👋'}
      </h1>
      <p class="login-subtitle">
        {isSignUp 
          ? 'Join 50,000+ students who found their perfect career path'
          : 'Continue your personalized career journey'}
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
        >
          Sign In
        </button>
        <button 
          class:active={isSignUp}
          on:click={() => !isSignUp ? toggleMode() : null}
          disabled={isLoading || isSignUp}
        >
          Sign Up
        </button>
        <div class="mode-slider" class:signup={isSignUp}></div>
      </div>
    </div>
    
    <form class="form" on:submit|preventDefault={handleSubmit}>
      {#if isSignUp}
        <div class="name-fields" transition:slide>
          <div class="input-group">
            <label for="firstName">
              <i class="fas fa-user" aria-hidden="true"></i>
              First Name *
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
              <div class="input-icon">
                <i class="fas fa-user" aria-hidden="true"></i>
              </div>
            </div>
            <small id="firstName-help">Your first name</small>
          </div>
          
          <div class="input-group">
            <label for="lastName">
              <i class="fas fa-user" aria-hidden="true"></i>
              Last Name *
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
              <div class="input-icon">
                <i class="fas fa-user" aria-hidden="true"></i>
              </div>
            </div>
            <small id="lastName-help">Your last name</small>
          </div>
        </div>
      {/if}
      
      <div class="input-group">
        <label for="email">
          <i class="fas fa-envelope" aria-hidden="true"></i>
          Email Address *
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
          <div class="input-icon">
            <i class="fas fa-at" aria-hidden="true"></i>
          </div>
        </div>
        <small id="email-help">Enter your email address to get started</small>
      </div>
      
      <div class="input-group">
        <label for="password">
          <i class="fas fa-lock" aria-hidden="true"></i>
          Password *
        </label>
        <div class="input-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
            bind:value={password}
            disabled={isLoading}
            on:input={() => {
              if (isSignUp) checkPasswordStrength(password);
            }}
            required
          />
          <div class="input-icon">
            <i class="fas fa-key" aria-hidden="true"></i>
          </div>
          <button 
            type="button" 
            class="password-toggle"
            on:click={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <i class="fas fa-eye{showPassword ? '-slash' : ''}" aria-hidden="true"></i>
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
            <span class="strength-text">
              {passwordStrength === 0 ? 'Start typing' : 
               passwordStrength < 50 ? 'Weak' : 
               passwordStrength < 75 ? 'Good' : 'Strong'}
            </span>
            {#if passwordFeedback}
              <div class="password-feedback">{passwordFeedback}</div>
            {/if}
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
            <span class="checkmark"></span>
            <span class="checkbox-text">
              <span>Remember me</span>
              <small>Stay logged in for 30 days</small>
            </span>
          </label>
          <button 
            type="button" 
            class="forgot-password"
            on:click={handleForgotPassword}
            disabled={isLoading}
            title="Reset your password"
          >
            Forgot password?
          </button>
        </div>
      {/if}
      
      {#if error}
        <div class="error-message" in:fade out:fade>
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <div class="error-content">
            <strong>Oops!</strong>
            <p>{error}</p>
          </div>
          <button 
            class="error-dismiss" 
            on:click={() => error = ''}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      {/if}
      
      {#if successMessage}
        <div class="success-message" in:fade out:fade>
          <i class="fas fa-check-circle" aria-hidden="true"></i>
          <div class="success-content">
            <strong>Success!</strong>
            <p>{successMessage}</p>
          </div>
        </div>
      {/if}
      
      <button 
        class="submit-button" 
        type="submit" 
        disabled={isLoading}
        title={isSignUp ? 'Create your account' : 'Sign in to your account'}
      >
        {#if isLoading}
          <div class="spinner" aria-hidden="true"></div>
          <span class="button-text">
            {isSignUp ? 'Creating Account...' : 'Signing In...'}
          </span>
        {:else}
          {isSignUp ? 'Create My Account' : 'Sign In to Continue'}
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
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
      
      <div class="login-footer">
        <div class="security-badge">
          <i class="fas fa-shield-alt" aria-hidden="true"></i>
          <span>Bank-level 256-bit SSL encryption</span>
          <i class="fas fa-lock" aria-hidden="true"></i>
        </div>
        <p class="terms">
          By continuing, you agree to our
          <a href="/terms" target="_blank" class="link"> Terms</a>,
          <a href="/privacy" target="_blank" class="link"> Privacy</a>, and
          <a href="/cookies" target="_blank" class="link"> Cookie Policy</a>.
        </p>
      </div>
    </form>
  </div>
  
  <div class="login-features">
    <div class="feature" transition:slide={{ duration: 300 }}>
      <div class="feature-icon">
        <i class="fas fa-bolt" aria-hidden="true"></i>
      </div>
      <h3>AI Career Coach</h3>
      <p>Get personalized career recommendations powered by GPT-4</p>
    </div>
    <div class="feature" transition:slide={{ duration: 300, delay: 150 }}>
      <div class="feature-icon">
        <i class="fas fa-network-wired" aria-hidden="true"></i>
      </div>
      <h3>University Network</h3>
      <p>Connect with students and alumni from your university</p>
    </div>
    <div class="feature" transition:slide={{ duration: 300, delay: 300 }}>
      <div class="feature-icon">
        <i class="fas fa-chart-line" aria-hidden="true"></i>
      </div>
      <h3>Progress Tracking</h3>
      <p>Monitor your career development with detailed analytics</p>
    </div>
  </div>
  
  <div class="login-stats">
    <div class="stat">
      <strong>50K+</strong>
      <span>Active Students</span>
    </div>
    <div class="stat">
      <strong>95%</strong>
      <span>Satisfaction Rate</span>
    </div>
    <div class="stat">
      <strong>24/7</strong>
      <span>Support Available</span>
    </div>
  </div>
</div>

<style>
  /* Enhanced CSS with modern design */
  :global(:root) {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-gradient: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
    --danger-gradient: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
    --glass-bg: rgba(255, 255, 255, 0.95);
    --glass-border: rgba(255, 255, 255, 0.2);
    --shadow-elegant: 0 20px 40px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05);
    --shadow-hover: 0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08);
  }
  
  .login-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: 
      radial-gradient(circle at 0% 0%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
    position: relative;
    overflow-x: hidden;
  }
  
  .login-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
    z-index: 0;
  }
  
  .login-header {
    width: 100%;
    max-width: 500px;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 1;
  }
  
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: 9999px;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 1rem;
  }
  
  .back-button:hover:not(:disabled) {
    background: white;
    border-color: #93c5fd;
    color: #4f46e5;
    transform: translateX(-4px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .header-content {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .login-title {
    font-family: 'Poppins', sans-serif;
    font-size: 2.75rem;
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }
  
  .login-subtitle {
    font-size: 1.125rem;
    color: #4b5563;
    line-height: 1.6;
    opacity: 0.9;
  }
  
  .login-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border-radius: 1.5rem;
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    box-shadow: var(--shadow-elegant);
    position: relative;
    z-index: 1;
    border: 1px solid var(--glass-border);
    margin-bottom: 2rem;
    transition: all 0.3s ease;
  }
  
  .card-header {
    margin-bottom: 1.5rem;
  }
  
  .mode-indicator {
    display: flex;
    position: relative;
    background: #f3f4f6;
    border-radius: 0.5rem;
    padding: 0.25rem;
    margin: 0 auto;
    max-width: 300px;
  }
  
  .mode-indicator button {
    flex: 1;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    border-radius: 0.375rem;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }
  
  .mode-indicator button.active {
    color: #4f46e5;
  }
  
  .mode-slider {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    width: calc(50% - 0.25rem);
    height: calc(100% - 0.5rem);
    background: white;
    border-radius: 0.375rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1;
  }
  
  .mode-slider.signup {
    transform: translateX(100%);
  }
  
  .name-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
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
    margin-bottom: 1rem;
  }
  
  .input-group label {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  .input-wrapper input {
    width: 100%;
    padding: 0.75rem 1.5rem 0.75rem 2.5rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
  }
  
  .input-wrapper input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
  
  .input-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }
  
  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .password-toggle:hover {
    color: #4f46e5;
  }
  
  .password-strength {
    margin-top: 0.5rem;
  }
  
  .strength-bar {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }
  
  .strength-bar div {
    flex: 1;
    height: 4px;
    background: #d1d5db;
    border-radius: 9999px;
    transition: all 0.3s ease;
  }
  
  .strength-bar div.filled {
    background: #10b981;
  }
  
  .strength-bar div.active {
    animation: pulseBar 1.5s infinite;
  }
  
  @keyframes pulseBar {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .strength-text {
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
  }
  
  .password-feedback {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
    padding-left: 0.5rem;
  }
  
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .checkbox-text small {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  .error-message, .success-message {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    animation: slideIn 0.3s ease-out;
  }
  
  .error-message {
    background: linear-gradient(135deg, #ffeaea, #ffcccc);
    border: 2px solid #ff6b6b;
    color: #d32f2f;
  }
  
  .success-message {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
    border: 2px solid #66bb6a;
    color: #388e3c;
  }
  
  .error-content, .success-content {
    flex: 1;
  }
  
  .error-dismiss {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    transition: background-color 0.2s;
  }
  
  .error-dismiss:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .submit-button {
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 1rem 1.5rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
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
    transition: left 0.5s;
  }
  
  .submit-button:hover:not(:disabled)::before {
    left: 100%;
  }
  
  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .switch-mode {
    text-align: center;
    margin: 1.5rem 0;
  }
  
  .switch-button {
    background: none;
    border: none;
    color: #4f46e5;
    font-weight: 600;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin-left: 0.25rem;
    position: relative;
  }
  
  .switch-button::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: #4f46e5;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  .switch-button:hover:not(:disabled)::after {
    width: 100%;
  }
  
  .login-footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .security-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #059669;
    background: #d1fae5;
    padding: 0.5rem 0.75rem;
    border-radius: 9999px;
    margin-bottom: 0.75rem;
    border: 1px solid #a7f3d0;
  }
  
  .login-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    max-width: 1000px;
    margin: 2rem 0;
  }
  
  .feature {
    text-align: center;
    padding: 1.5rem;
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    border: 1px solid var(--glass-border);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .feature:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: var(--shadow-hover);
  }
  
  .feature-icon {
    width: 70px;
    height: 70px;
    background: var(--primary-gradient);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.75rem;
    margin: 0 auto 1rem;
    transition: all 0.3s ease;
  }
  
  .feature:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
  }
  
  .login-stats {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
  }
  
  .stat {
    text-align: center;
    padding: 1rem;
  }
  
  .stat strong {
    display: block;
    font-family: 'Poppins', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
  }
  
  .stat span {
    color: #4b5563;
    font-size: 0.9rem;
    font-weight: 500;
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
  @media (max-width: 1024px) {
    .login-features {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .login-stats {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
  
  @media (max-width: 768px) {
    .login-container {
      padding: 1rem;
    }
    
    .login-title {
      font-size: 2.25rem;
    }
    
    .login-features {
      grid-template-columns: 1fr;
      max-width: 500px;
    }
    
    .form-options {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }
  
  @media (max-width: 480px) {
    .login-card {
      padding: 1.5rem;
    }
    
    .login-title {
      font-size: 2rem;
    }
    
    .feature {
      padding: 1rem;
    }
    
    .stat strong {
      font-size: 2rem;
    }
  }
</style>