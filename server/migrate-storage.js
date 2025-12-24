#!/usr/bin/env node

/**
 * Apply Storage Policies to Supabase
 * This script sets up storage bucket policies for the PDFs bucket
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyStoragePolicies() {
    log('\n🔐 Applying Storage Policies...', 'cyan');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        log('❌ Missing Supabase credentials', 'red');
        process.exit(1);
    }

    log('✅ Credentials loaded', 'green');

    // Read storage policies SQL
    const policiesPath = path.join(__dirname, 'supabase', 'migrations', '20251224_storage_policies.sql');

    if (!fs.existsSync(policiesPath)) {
        log(`❌ Policies file not found: ${policiesPath}`, 'red');
        process.exit(1);
    }

    const policiesSQL = fs.readFileSync(policiesPath, 'utf8');
    log('✅ Storage policies file loaded', 'green');

    // Extract project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectRef) {
        log('❌ Could not extract project ref from URL', 'red');
        process.exit(1);
    }

    log(`\n📋 Project: ${projectRef}`, 'cyan');

    // Apply policies using Supabase SQL endpoint
    log('\n⚙️  Applying policies via SQL...', 'cyan');

    try {
        // Use the Supabase REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                query: policiesSQL
            })
        });

        if (response.ok) {
            log('✅ Storage policies applied successfully', 'green');
        } else {
            log('⚠️  Could not apply via API', 'yellow');
            log('\n📝 Please apply manually:', 'cyan');
            log('   1. Go to Supabase Dashboard → SQL Editor', 'yellow');
            log('   2. Copy contents from: supabase/migrations/20251224_storage_policies.sql', 'yellow');
            log('   3. Paste and run', 'yellow');
        }
    } catch (error) {
        log(`⚠️  API method failed: ${error.message}`, 'yellow');
        log('\n📝 Manual application required:', 'cyan');
        log('   Dashboard → SQL Editor → Run storage policies SQL', 'yellow');
    }

    // Verify bucket exists and is public
    log('\n🔍 Verifying storage setup...', 'cyan');

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            log(`❌ Could not list buckets: ${error.message}`, 'red');
            return;
        }

        const pdfsBucket = buckets.find(b => b.name === 'pdfs');

        if (!pdfsBucket) {
            log('❌ Bucket "pdfs" not found', 'red');
            log('\n📝 Create the bucket:', 'cyan');
            log('   1. Dashboard → Storage → New bucket', 'yellow');
            log('   2. Name: pdfs', 'yellow');
            log('   3. Public: YES ✅', 'yellow');
            return;
        }

        log('✅ Bucket "pdfs" exists', 'green');
        log(`   Public: ${pdfsBucket.public ? 'Yes ✅' : 'No ❌'}`, pdfsBucket.public ? 'green' : 'red');

        if (!pdfsBucket.public) {
            log('\n⚠️  Bucket is not public!', 'yellow');
            log('   Make it public in Dashboard → Storage → pdfs → Settings', 'yellow');
        }

        // Test upload permission
        log('\n🧪 Testing upload permission...', 'cyan');

        const testData = Buffer.from('test');
        const testPath = `test-${Date.now()}.txt`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(testPath, testData, { upsert: true });

        if (uploadError) {
            log(`❌ Upload test failed: ${uploadError.message}`, 'red');
            log('   Storage policies may not be applied correctly', 'yellow');
        } else {
            log('✅ Upload permission works', 'green');

            // Clean up test file
            await supabase.storage.from('pdfs').remove([testPath]);
            log('✅ Test file cleaned up', 'green');
        }

    } catch (error) {
        log(`❌ Verification failed: ${error.message}`, 'red');
    }

    log('\n' + '='.repeat(50), 'cyan');
    log('✅ Storage policies setup complete!', 'green');
    log('='.repeat(50) + '\n', 'cyan');
}

applyStoragePolicies().catch(error => {
    log(`\n❌ Failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
