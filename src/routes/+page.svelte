<script lang="ts">
  let userInput = "";
  let response = "";
  let loading = false;
  let error = "";

  async function summarizeText() {
    if (!userInput.trim()) {
      response = "Please enter a message.";
      return;
    }

    loading = true;
    response = "";
    error = "";

    try {
      const res = await fetch('/api/summa-mistral-nlp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userInput
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      response = data?.choices?.[0]?.message?.content || 'No response received.';
    } catch (err) {
      if (err instanceof Error) {
        error = `Error: ${err.message}`;
      } else {
        error = 'The API might be an issue.';
      }
    } finally {
      loading = false;
    }
  }
</script>
<style>

  :global(body) {
    background-color: #999;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
  }

  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    /* justify-content: space-between;
    align-items: center; */
    box-sizing: border-box;
  }

 .response-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  /* max-width: 700px; */
  padding: 1rem;
  /* margin: 0 auto; */
  margin-left: 180px;
}

  .response-box {
  max-width: 600px;
  width: 90%;
  margin: 0 auto;
  background-color: #e0f7f4;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(16, 163, 127, 0.3);
  text-align: center;
  font-size: 1.2rem;
  color: #004d40;
}


  .input-area {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    background: #fff;
    padding: 0.75rem;
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    align-items: center;
  }

  textarea {
    width: 300px;
    height: 60px;
    resize: none;
    padding: 0.5rem;
    font-size: 0.9rem;
    border-radius: 8px;
    border: 1px solid #ccc;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background-color: #10a37f;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #999;
    cursor: not-allowed;
  }

  .error {
    color: red;
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
<div class="container">
  <div class="response-area">
    {#if response}
      <div class="response-box">
        <h3>Response:</h3>
        <p>{response}</p>
      </div>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  <div class="input-area">
    <textarea bind:value={userInput} placeholder="Paste your text here..." rows="3" />
    <button on:click={summarizeText} disabled={loading || !userInput}>
      {loading ? "Summarizing..." : "Summarize"}
    </button>
  </div>
</div>
