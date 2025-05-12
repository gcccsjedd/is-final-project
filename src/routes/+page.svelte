<script lang="ts">
    import { Card, Textarea, Button, Spinner, Alert } from "flowbite-svelte";
    
    let text = '';
    let summary = '';
    let isLoading = false;
    let error = '';
    let copySuccess = false;

    async function handleSubmit() {
        if (!text.trim()) {
            error = 'Please enter some text';
            return;
        }

        isLoading = true;
        error = '';
        summary = '';
        
        try {
            const response = await fetch('/api/404notfound-nlp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (!response.ok) {
                error = data.error || 'Failed to summarize text';
            } else {
                summary = data.summary;
            }
        } catch (err) {
            error = 'Failed to connect to the server';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    function copyToClipboard() {
        if (!summary) return;
        
        navigator.clipboard.writeText(summary).then(() => {
            copySuccess = true;
            setTimeout(() => copySuccess = false, 2000);
        });
    }

    function clearAll() {
        text = '';
        summary = '';
        error = '';
    }
</script>

<main class="flex min-h-screen w-screen flex-col items-center justify-center p-4 bg-gray-900">
    <Card size="lg" class="w-full max-w-2xl bg-gray-800 border-gray-700">
        <div class="flex flex-col items-center mb-6">
            <!-- Logo with responsive sizing -->
            <img 
                src="./logo.png" 
                alt="TextSumMistral Logo" 
                class="h-16 w-16 md:h-20 md:w-20 mb-3 object-contain"
            />
            <h1 class="text-2xl md:text-3xl font-bold text-white text-center">
                TextSummistral
            </h1>
            <p class="text-gray-400 text-sm mt-1">AI-Powered Text Summarization</p>
        </div>
        
        {#if error}
            <Alert color="red" class="mb-4">
                {error}
                <button on:click={() => error = ''} class="float-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </Alert>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <Textarea 
                bind:value={text}
                placeholder="Enter your text here..."
                rows={10}
                class="w-full bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                required
            />
            
            <div class="flex gap-3">
                <Button type="submit" disabled={isLoading} class="flex-1 bg-orange-600 hover:bg-orange-700 focus:ring-orange-300 text-white">
                    {#if isLoading}
                        <Spinner class="mr-2" />
                        Processing...
                    {:else}
                        Generate
                    {/if}
                </Button>
                <Button on:click={clearAll} type="button" class="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-300 text-white" outline>
                    Clear
                </Button>
            </div>
        </form>
        
        {#if summary}
            <div class="mt-6">
                <div class="flex justify-between items-center mb-2">
                    <h2 class="text-xl font-semibold text-white">Response:</h2>
                    <div class="flex gap-2">
                        <Button size="xs" on:click={copyToClipboard} class="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white">
                            {#if copySuccess}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Copied!
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                                Copy
                            {/if}
                        </Button>
                    </div>
                </div>
                <div class="p-4 bg-gray-700 rounded-lg whitespace-pre-wrap text-gray-100 border border-gray-600">
                    {summary}
                </div>
            </div>
        {/if}
    </Card>
</main>