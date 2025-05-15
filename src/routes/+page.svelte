<script lang="ts">
	import MarkdownIt from "markdown-it";

	let textToSummarize = "";
	let summaryHistory: { original: string; summary: string }[] = [];
	const md = MarkdownIt();

	async function generateSummary() {
		if (!textToSummarize.trim()) return;

		try {
			const request = await fetch("http://localhost:5173/api/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: textToSummarize,
					task: "summarize",
				}),
			});

			const apiResponse = await request.json();
			const summary = apiResponse?.message || "Could not generate summary.";

			summaryHistory = [
				...summaryHistory,
				{
					original: textToSummarize,
					summary: summary,
				},
			];
		} catch (error) {
			console.error("Error generating summary:", error);
			summaryHistory = [
				...summaryHistory,
				{
					original: textToSummarize,
					summary: "Failed to generate summary.",
				},
			];
		} finally {
			textToSummarize = "";
		}
	}
</script>

<main class="mx-auto max-w-3xl p-4">
	<h1 class="mb-4 text-center text-2xl font-bold">Text Summarizer</h1>

	<div class="mb-6 rounded bg-white p-4 shadow">
		<textarea bind:value={textToSummarize} placeholder="Enter text to summarize..." class="min-h-[150px] w-full resize-y rounded border p-2"
		></textarea>

		<button
			on:click={generateSummary}
			class="mt-3 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
			disabled={!textToSummarize.trim()}
		>
			Summarize
		</button>
	</div>

	{#if summaryHistory.length > 0}
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Summary History</h2>

			{#each summaryHistory as item, i (i)}
				<div class="rounded bg-white p-4 shadow">
					<div class="mb-2">
						<h3 class="font-medium text-gray-700">Original Text:</h3>
						<p class="line-clamp-2 text-sm text-gray-600">{item.original}</p>
					</div>

					<div>
						<h3 class="font-medium text-gray-700">Summary:</h3>
						<div class="prose prose-sm">
							{@html md.render(item.summary)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>
