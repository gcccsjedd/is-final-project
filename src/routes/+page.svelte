<script lang="ts">
    let inputText = "";
    let summary = "";
    let isLoading = false;
    let error = "";

    async function summarizeText() {
        if (!inputText.trim()) return;
        isLoading = true;
        error = summary = "";

        try {
            const res = await fetch("/api/cosmos-npl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: inputText })
            });
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.error || "Failed to summarize");
            summary = data.summary;
        } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            isLoading = false;
        }
    }

    const formatMessage = (text: string): string => {
        return text.replace(/<think>[\s\S]*?<\/think>/g, "");
    };
</script>

<div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-center mb-6">📝 Cosmos Text Summarizer</h1>

    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <textarea
        class="w-full h-52 p-4 border border-gray-300 rounded-md text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Paste your article, blog post, or any text here..."
        bind:value={inputText}
    />

    <button
        class="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        on:click={summarizeText}
        disabled={isLoading || !inputText.trim()}
    >
        {isLoading ? "Summarizing..." : "Summarize Text"}
    </button>

    {#if error}
        <div class="mt-4 text-red-600 font-semibold">{error}</div>
    {/if}

   {#if summary}
    <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h2 class="text-xl font-semibold mb-2">📌 Summary:</h2>
        <p class="whitespace-pre-wrap">{formatMessage(summary)}</p>
    </div>
{/if}

</div>