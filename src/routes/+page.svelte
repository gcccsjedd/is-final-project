<script>
  let text = '';
  let result = null;
  let error = '';
  let history = [];

  async function analyze() {
    error = '';
    result = null;

    if (!text.trim()) {
      error = "Please enter some text.";
      return;
    }

    try {
      const res = await fetch('/api/InferNet/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const json = await res.json();

      if (!res.ok) {
        error = json.error || 'Unknown error';
      } else {
        result = json;
        history = [{ text, ...json }, ...history]; 
        text = ''; 
      }
    } catch (e) {
      error = e.message;
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

  * {
    font-family: 'Montserrat', sans-serif;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    background-color: #000000;
  }

  .container {
    max-width: 700px;
    margin: 5vh auto;
    padding: 2rem;
    background: rgb(243, 159, 159);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(90, 90, 90, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h1 {
    font-weight: 700;
    font-size: 2rem;
    color: #1f2937;
    text-align: center;
  }

  input {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    outline: none;
  }

  input:focus {
    border-color: #6366f1;
  }

  button {
    background-color: #636363;
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .error {
    color: #dc2626;
    background-color: #fee2e2;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.95rem;
    text-align: center;
  }

  .Output-container {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .Output {
    flex: 1;
    background-color: #4b5563;
    color: white;
    padding: 1.25rem;
    border-radius: 12px;
    text-align: center;
  }

  .Output span:first-child {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .history {
    margin-top: 1rem;
  }

  .history-item {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: #f3f4f6;
  }

  .history-item h3 {
    margin: 0;
    font-size: 1rem;
    color: #1f2937;
  }

  .history-item p {
    margin: 0.25rem 0 0;
    font-size: 0.95rem;
    color: #4b5563;
  }
</style>

<div class="container">
  <h1>InferNet Sentiment Analysis Test</h1>

  <input
    type="text"
    bind:value={text}
    placeholder="Type a text…"
    on:keydown={(e) => {
      if (e.key === 'Enter') analyze();
    }}
  />

  <button on:click={analyze}>Enter</button>

  {#if error}
    <div class="error">⚠️ {error}</div>
  {/if}

  {#if result}
    <div class="Output-container">
      <div class="Output">
        <span>{result.sentiment}</span>
      
      </div>
      <div class="Output">
        <span>{result.score}</span>
       
      </div>
    </div>
  {/if}

  {#if history.length > 0}
    <div class="history">
      <h2>Previous Results</h2>
      {#each history as item (item.text + item.score)}
        <div class="history-item">
          <h3>“{item.text}”</h3>
          <p><strong>Sentiment:</strong> {item.sentiment}</p>
          <p><strong>Score:</strong> {item.score}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>
