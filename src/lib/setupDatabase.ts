// src/lib/setupDatabase.ts
import { supabase } from './supabase';

export async function setupDatabaseTables() {
  try {
    // Create assessments table if it doesn't exist
    const { error: assessmentsError } = await supabase.rpc('create_assessments_table_if_not_exists');
    
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc('create_profiles_table_if_not_exists');
    
    if (assessmentsError || profilesError) {
      console.warn('Tables might not exist. Please run the SQL migration.');
    }
  } catch (error) {
    console.error('Database setup error:', error);
  }
}