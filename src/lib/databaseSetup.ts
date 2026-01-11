// lib/databaseSetup.ts
import { SupabaseClient } from '@supabase/supabase-js';

export async function setupDatabase(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Check if assessments table exists
    const { error: tableError } = await supabase
      .from('assessments')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('Assessments table might not exist. Please run the migration script.');
      return false;
    }

    console.log('Database setup verified');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}