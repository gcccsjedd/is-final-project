import type { RequestHandler } from '@sveltejs/kit';
import { createAccount } from '$lib/server/db';

export const POST: RequestHandler = async () => {
    const account = await createAccount();

	if (!account) {
		return new Response(JSON.stringify({ error: 'Failed to create account' }), { status: 500 });
	}

	return new Response(JSON.stringify(account), {
		status: 201,
		headers: { 'Content-Type': 'application/json' }
	});
};
