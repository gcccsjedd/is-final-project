<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { Card, Textarea, Button, Spinner, Alert } from "flowbite-svelte";
    
    let text = '';
    let summary = '';
    let isLoading = false;
    let error = '';

    async function handleSubmit() {
        if (!text.trim()) {
            error = 'Please enter some text';
            return;
        }

        isLoading = true;
        error = '';
        summary = '';
        
        try {
            const response = await fetch('/agent', {
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
</script>

<main class="flex min-h-screen w-screen flex-col items-center justify-center p-4">
    <Card size="lg" class="w-full max-w-2xl">
        <h1 class="text-2xl font-bold mb-4">AI Text Summarization</h1>
        
        {#if error}
            <Alert color="red" class="mb-4">
                {error}
            </Alert>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <Textarea 
                bind:value={text}
                placeholder="Enter your text here..."
                rows={10}
                class="w-full"
                required
            />
            
            <Button type="submit" disabled={isLoading} class="w-full">
                {#if isLoading}
                    <Spinner class="mr-2" />
                    Processing...
                {:else}
                    Submit
                {/if}
            </Button>
        </form>
        
        {#if summary}
            <div class="mt-6">
                <h2 class="text-xl font-semibold mb-2">Response:</h2>
                <div class="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {summary}
                </div>
            </div>
        {/if}
    </Card>
</main>