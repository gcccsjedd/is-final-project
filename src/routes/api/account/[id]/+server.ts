import type { RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;

	if (!id) {
		return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400 });
	}

	const { data, error } = await supabase
		.from('accounts')
		.select('id')
		.eq('id', id)
		.single();

	if (error) {
		// If it's a "not found" error, just respond with exists: false
		if (error.code === 'PGRST116' || error.details?.includes('Results contain 0 rows')) {
			return new Response(JSON.stringify({ exists: false }), { status: 200 });
		}
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}

	return new Response(JSON.stringify({ exists: !!data }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
