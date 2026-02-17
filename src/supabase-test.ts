/**
 * COMPLETE SUPABASE DIAGNOSTIC TEST
 * 
 * HOW TO USE:
 * 1. Add this import to src/main.tsx: import './supabase-test';
 * 2. Restart dev server
 * 3. Open browser console
 * 4. Check the output
 */

console.log('\n\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('🔬 COMPLETE SUPABASE DIAGNOSTIC TEST');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1: Environment Variables
// ============================================================================
console.log('1️⃣  ENVIRONMENT VARIABLES');
console.log('─────────────────────────────────────────────────────────────');

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', url);
console.log('VITE_SUPABASE_ANON_KEY (first 50):', key?.substring(0, 50) + '...');
console.log('Key length:', key?.length);
console.log('URL is defined:', url ? '✅' : '❌ FAILED');
console.log('Key is defined:', key ? '✅' : '❌ FAILED');
console.log('');

// ============================================================================
// TEST 2: Supabase Client Creation
// ============================================================================
console.log('2️⃣  SUPABASE CLIENT CREATION');
console.log('─────────────────────────────────────────────────────────────');

let clientCreated = false;
let supabaseClient;

try {
  const module = await import('./lib/supabase');
  supabaseClient = module.supabase;
  clientCreated = true;
  console.log('Client imported:', '✅');
  console.log('Client object:', supabaseClient);
  console.log('Has auth:', supabaseClient?.auth ? '✅' : '❌ FAILED');
} catch (error) {
  console.error('Client creation:', '❌ FAILED');
  console.error('Error:', error);
}
console.log('');

// ============================================================================
// TEST 3: Client Configuration Inspection
// ============================================================================
if (clientCreated && supabaseClient) {
  console.log('3️⃣  CLIENT CONFIGURATION INSPECTION');
  console.log('─────────────────────────────────────────────────────────────');
  
  // Try to access internal properties (may be private)
  console.log('Client properties:', Object.keys(supabaseClient));
  console.log('Auth properties:', Object.keys(supabaseClient.auth));
  
  // Check if we can see the URL/Key being used
  console.log('');
  console.log('NOTE: The Supabase client is initialized. If requests are failing,');
  console.log('it means the apikey header is not being sent properly.');
  console.log('');
}

// ============================================================================
// TEST 4: Network Request Interception
// ============================================================================
console.log('4️⃣  NETWORK REQUEST MONITORING');
console.log('─────────────────────────────────────────────────────────────');

const originalFetch = window.fetch;
let requestCount = 0;

window.fetch = async function(...args) {
  const [resource, config] = args;
  
  // Only log Supabase auth requests
  if (typeof resource === 'string' && resource.includes('supabase.co/auth')) {
    requestCount++;
    console.log(`\n🌐 Request #${requestCount} to Supabase Auth:`);
    console.log('URL:', resource);
    console.log('Method:', config?.method || 'GET');
    
    // Check headers
    const headers = config?.headers;
    if (headers) {
      console.log('Headers sent:');
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          console.log(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });
      } else {
        Object.entries(headers).forEach(([key, value]) => {
          const val = String(value);
          console.log(`  ${key}: ${val.substring(0, 50)}${val.length > 50 ? '...' : ''}`);
        });
      }
      
      // Check specifically for apikey
      let hasApiKey = false;
      if (headers instanceof Headers) {
        hasApiKey = headers.has('apikey');
      } else {
        hasApiKey = 'apikey' in headers;
      }
      console.log(`\n✓ apikey header present: ${hasApiKey ? '✅ YES' : '❌ NO - THIS IS THE PROBLEM!'}`);
    } else {
      console.log('❌ NO HEADERS - THIS IS THE PROBLEM!');
    }
  }
  
  // Make the actual request
  const response = await originalFetch.apply(this, args);
  
  // Log response for Supabase requests
  if (typeof resource === 'string' && resource.includes('supabase.co/auth')) {
    console.log(`\n📥 Response #${requestCount}:`);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.status === 500) {
      const cloned = response.clone();
      try {
        const body = await cloned.json();
        console.log('Error body:', body);
        console.log('\n❌ 500 ERROR DETECTED!');
        if (body.message?.includes('No API key')) {
          console.log('🔍 Root cause: apikey header is missing from the request');
          console.log('💡 This means the Supabase client is NOT sending the anon key');
        }
      } catch (e) {
        console.log('Could not parse error body');
      }
    }
  }
  
  return response;
};

console.log('Network monitoring active ✅');
console.log('All Supabase auth requests will be logged above when they occur.');
console.log('');

// ============================================================================
// TEST 5: Manual Test API Call
// ============================================================================
if (clientCreated && supabaseClient) {
  console.log('5️⃣  MANUAL API TEST');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Testing getSession() call...\n');
  
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('❌ getSession() failed');
      console.error('Error:', error);
    } else {
      console.log('✅ getSession() succeeded');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ getSession() threw exception');
    console.error('Error:', error);
  }
  console.log('');
}

// ============================================================================
// TEST 6: Direct createClient Test
// ============================================================================
console.log('6️⃣  DIRECT CLIENT CREATION TEST');
console.log('─────────────────────────────────────────────────────────────');
console.log('Creating a NEW client with hardcoded credentials...\n');

try {
  const { createClient } = await import('@supabase/supabase-js');
  
  const testClient = createClient(
    'https://ddxxrzomjyjoldweapuh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHhyem9tanlqb2xkd2VhcHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzY1NzIsImV4cCI6MjA4Njg1MjU3Mn0.bMEYrkRhkkRvP2h2CDjKPlzu4oGz44pYIAJwEXgLBms'
  );
  
  console.log('Test client created ✅');
  console.log('Testing getSession() with hardcoded client...\n');
  
  const { data, error } = await testClient.auth.getSession();
  
  if (error) {
    console.error('❌ Hardcoded client getSession() failed');
    console.error('Error:', error);
    console.log('\n💡 If this fails too, the problem is with Supabase project settings');
  } else {
    console.log('✅ Hardcoded client getSession() succeeded!');
    console.log('Data:', data);
    console.log('\n💡 If this works but your app client doesnt, check how env vars are loaded');
  }
} catch (error) {
  console.error('❌ Test client creation failed');
  console.error('Error:', error);
}
console.log('');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 DIAGNOSTIC SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('1. Try to sign up/register in your app');
console.log('2. Watch the console for network request logs');
console.log('3. Check if apikey header is present in the request');
console.log('4. Compare your app client vs hardcoded test client');
console.log('');
console.log('Common issues:');
console.log('- If apikey is missing: Env vars not loading or client config issue');
console.log('- If hardcoded client works: Problem with import.meta.env');
console.log('- If neither works: Supabase project settings or network issue');
console.log('');
console.log('═══════════════════════════════════════════════════════════\n\n');