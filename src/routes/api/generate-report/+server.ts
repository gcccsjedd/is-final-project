import { generateReportforAllSentiments } from '$lib/server/model';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { account_id, account_key } = await request.json();

    if (typeof account_id !== 'string' || typeof account_key !== 'string') {
      return json({ error: 'Missing or invalid account_id or account_key' }, { status: 400 });
    }

    const { report } = await generateReportforAllSentiments(account_id, account_key);

    return json({ success: true, report });
  } catch (error) {
    console.error('Error generating sentiment report:', error);
    return json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
