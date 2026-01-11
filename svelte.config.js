import adapter from '@sveltejs/adapter-vercel'; // Changed from adapter-auto
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Optional Vercel-specific configuration
			// runtime: 'nodejs18.x', // or 'nodejs20.x', 'edge', 'bun'
			// regions: ['iad1'], // optional: specify deployment regions
			// split: false, // optional: disable/enable route splitting
			// external: [], // optional: externalize dependencies
			// envVarsInUse: [] // optional: explicitly include env vars
		})
	}
};

export default config;