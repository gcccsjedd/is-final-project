import { createClient } from '@supabase/supabase-js';
import { env } from "$env/dynamic/private";
import { v4 as uuidv4 } from 'uuid';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export async function insertSentimentAnalysis(data: {
  account_id: string;    // account ID
  account_key: string;   // UUID key to verify
  sentiment: string;
  score: number;
  summary: string;
}) {
  // Check if account exists with matching id and account_key
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', data.account_id)
    .eq('account_key', data.account_key)
    .single();

  if (accountError || !account) {
    console.error('Account verification failed:', accountError?.message || 'No matching account');
    throw new Error('Invalid account ID or key');
  }

  // Insert sentiment data after verification
  const { error, data: inserted } = await supabase
    .from('sentiments')
    .insert({
      account_id: data.account_id,
      sentiment: data.sentiment,
      score: data.score,
      summary: data.summary,
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error.message);
    throw new Error('Failed to insert sentiment data');
  }

  return inserted;
}

export async function getSentimentById(id: number | string) {
  const { data, error } = await supabase
    .from('sentiments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fetch sentiment error:', error.message);
    throw new Error('Failed to fetch sentiment');
  }

  return data;
}

export async function getSentimentsByAccountId(account_id: string) {
  const { data, error } = await supabase
    .from('sentiments')
    .select('*')
    .eq('account_id', account_id);

  if (error) {
    console.error('Fetch sentiments error:', error.message);
    throw new Error('Failed to fetch sentiments');
  }

  return data;
}

export async function createAccount() {
  const account_key = uuidv4();

  const { data, error } = await supabase
    .from('accounts')
    .insert({ account_key })
    .select()
    .single();

  if (error) {
    console.error('Create account error:', error.message);
    throw new Error('Failed to create account');
  }

  return data;
}