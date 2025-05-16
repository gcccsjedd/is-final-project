<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    
    let userInput = '';
    let isLoading = false;
    let response = '';
    let error = '';
    let animateResponse = false;
    let charCount = 0;
    let maxChars = 1000;
    
    onMount(() => {
        // Focus on the textarea when page loads
        const textarea = document.getElementById('message-input');
        if (textarea) textarea.focus();
    });
    
    function updateCharCount() {
        charCount = userInput.length;
    }
    
    async function processNLP() {
        if (!userInput.trim()) {
            error = 'Please enter some text';
            return;
        }
        
        isLoading = true;
        error = '';
        response = '';
        animateResponse = false;
        
        try {
            const res = await fetch('/api/team-lastnerve-nlp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput })
            });
            
            const data = await res.json();
            
            if (data.success) {
                response = data.response;
                setTimeout(() => {
                    animateResponse = true;
                }, 100);
            } else {
                error = data.error || 'Failed to process your request';
            }
        } catch (err) {
            error = 'An error occurred while processing your request';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
        // Submit on Ctrl+Enter or Cmd+Enter
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            processNLP();
        }
    }
    
    function clearInput() {
        userInput = '';
        charCount = 0;
    }
    
    function copyResponse() {
        navigator.clipboard.writeText(response);
        // Visual feedback could be added here
    }
</script>

<div class="app-container">
    <div class="card">
        <div class="header">
            <h1>AI Text Processor</h1>
        </div>
        
        <div class="input-section">
            <div class="textarea-container">
                <textarea 
                    id="message-input"
                    bind:value={userInput}
                    on:input={updateCharCount}
                    on:keydown={handleKeyDown}
                    placeholder="Enter your text here..."
                    disabled={isLoading}
                    maxlength={maxChars}
                ></textarea>
                
                <div class="input-actions">
                    <span class="char-count {charCount > maxChars * 0.8 ? 'near-limit' : ''}">
                        {charCount}/{maxChars}
                    </span>
                    
                    {#if userInput.trim()}
                        <button class="clear-btn" on:click={clearInput} disabled={isLoading} aria-label="Clear input">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>
            
            <button 
                class="process-btn"
                on:click={processNLP}
                disabled={isLoading || !userInput.trim()}
            >
                {#if isLoading}
                    <div class="spinner"></div>
                    Processing...
                {:else}
                    Process with AI
                {/if}
            </button>
        </div>
        
        {#if error}
            <div class="error-message" in:fade>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
            </div>
        {/if}
        
        {#if response}
            <div class="response-section {animateResponse ? 'show' : ''}">
                <div class="response-header">
                    <h2>AI Response</h2>
                    <button class="copy-btn" on:click={copyResponse} title="Copy to clipboard" aria-label="Copy AI response to clipboard">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                <div class="response-content">
                    {response}
                </div>
            </div>
        {/if}
    </div>
    
    <footer>
        <p>Results may vary based on input complexity.</p>
    </footer>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    
    :global(body) {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f9ff 0%, #e3eeff 100%);
        color: #2d3748;
        line-height: 1.6;
    }
    
    .app-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 4rem);
    }
    
    .card {
        background-color: white;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(71, 119, 217, 0.07), 0 6px 12px rgba(71, 119, 217, 0.05);
        padding: 2.5rem;
        margin-bottom: 2rem;
        flex-grow: 1;
        border: 1px solid rgba(224, 235, 255, 0.8);
        transition: all 0.3s ease;
    }
    
    .header {
        text-align: center;
        margin-bottom: 2.5rem;
    }
    
    h1 {
        color: #3182ce;
        font-weight: 600;
        font-size: 2rem;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
    }
    
    
    .input-section {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-bottom: 2rem;
    }
    
    .textarea-container {
        position: relative;
        width: 100%;
    }
    
    textarea {
        width: 100%;
        min-height: 180px;
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: all 0.3s ease;
        background-color: #f8faff;
        color: #2d3748;
        box-sizing: border-box;
        line-height: 1.6;
    }
    
    textarea:focus {
        outline: none;
        border-color: #63b3ed;
        box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
        background-color: white;
    }
    
    textarea::placeholder {
        color: #a0aec0;
    }
    
    .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
        padding: 0 0.25rem;
    }
    
    .char-count {
        font-size: 0.85rem;
        color: #a0aec0;
    }
    
    .char-count.near-limit {
        color: #ed8936;
    }
    
    .clear-btn {
        background: none;
        border: none;
        color: #a0aec0;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .clear-btn:hover {
        color: #718096;
        background-color: #f7fafc;
    }
    
    .process-btn {
        align-self: flex-end;
        background-color: #3182ce;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .process-btn:hover {
        background-color: #2b6cb0;
        box-shadow: 0 4px 8px rgba(49, 130, 206, 0.2);
        transform: translateY(-1px);
    }
    
    .process-btn:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .error-message {
        background-color: #fff5f5;
        color: #e53e3e;
        padding: 1rem 1.25rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border-left: 4px solid #e53e3e;
    }
    
    .response-section {
        background-color: #f8faff;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.5s ease;
    }
    
    .response-section.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .response-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .response-section h2 {
        color: #3182ce;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }
    
    .copy-btn {
        background: none;
        border: none;
        color: #a0aec0;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
    }
    
    .copy-btn:hover {
        color: #3182ce;
        background-color: rgba(49, 130, 206, 0.1);
    }
    
    .response-content {
        line-height: 1.7;
        color: #4a5568;
        white-space: pre-wrap;
        font-size: 1rem;
    }
    
    footer {
        text-align: center;
        font-size: 0.85rem;
        color: #718096;
        margin-top: auto;
        padding-top: 2rem;
    }
    
    /* Animation for fading in elements */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .card {
            padding: 1.5rem;
            border-radius: 12px;
        }
        
        h1 {
            font-size: 1.75rem;
        }
        
        .process-btn {
            align-self: stretch;
        }
    }
</style>