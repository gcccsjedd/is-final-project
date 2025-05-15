

<style>
  @import url('https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&family=Bebas+Neue&family=Dancing+Script:wght@400..700&family=Marck+Script&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Quicksand:wght@300..700&display=swap');

  *{
    font-family:'Montserrat';
  }
  .container {
    width:50vw;
    margin:auto;
    height:90vh;
    padding: 1rem;
    border-radius: 8px;
    font-family: sans-serif;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:1rem;
  }
  h1{
    color:#333;
    padding:0;
    margin:0;
  }
  input {
    width: 100%;
    padding:1rem;
    font-size: 1.25em;
    border-radius:10px;
    border:solid 1px #333;
    outline:none;
  }
  button {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    color:#fff;
    background-color:#333;
    border:none;
    outline:none;
    border-radius:5px;
  }
  .error {
    color: #e53e3e;
    margin-top: 1rem;
  }
  .Output-container {
    display:flex;
    gap:1rem;
  }
  .Output{
    border-top:solid 1px #333333;
    display:flex;
    flex-direction:column;
    gap:.5rem;
    align-items:center;
    background-color:#333;
    color:#fff;
    padding:1rem;
    border-radius:10px;
    width:250px;
  }
  .Output span:first-child{
    font-size:1.5em;
    font-weight:bold;
  }
</style>

<div class="container">

  <h1>Sentiment Analysis Test</h1>
  <input type="text" bind:value={text} placeholder="Type some text…">

  <button on:click={analyze}>Analyze Sentiment</button>

  {#if error}
    <div class="error">Error: {error}</div>
  {:else if result}
    <div class="Output-container">
      <div class="Output">
        <span>{result.sentiment}</span>
        <span>Sentiment</span>
      </div>

      <div class="Output">
        <span>{result.score}</span>
        <span>Score</span>
      </div>

    


    </div>
  {/if}
</div>




<script>
  let text = '';
  let result = null;
  let error = '';

  async function analyze() {
    error = '';
    result = null;
    try {
      const res = await fetch('/api/team-alpha-nlp/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const json = await res.json();
      if (!res.ok) {
        error = json.error || 'Unknown error';
      } else {
        result = json;
      }
    } catch (e) {
      error = e.message;
    }
  }
</script>