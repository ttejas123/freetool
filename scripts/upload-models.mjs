import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'upload';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Error: Supabase URL or Service Role Key missing in .env.local');
  console.log('Current URL:', SUPABASE_URL);
  console.log('Key Status:', SUPABASE_KEY ? (SUPABASE_KEY === 'YOUR_SERVICE_ROLE_KEY' ? 'Placeholder detected' : 'Present') : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODELS_DIR = path.resolve(PROJECT_ROOT, 'node_modules/@imgly/background-removal-data/dist');

async function uploadFile(filePath, bucketPath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(bucketPath, fileBuffer, {
      contentType: filePath.endsWith('.json') ? 'application/json' : 'application/octet-stream',
      upsert: true
    });

  if (error) {
    console.error(`❌ Failed to upload ${bucketPath}:`, error.message);
  } else {
    console.log(`✅ Uploaded: ${bucketPath}`);
  }
}

async function run() {
  if (!fs.existsSync(MODELS_DIR)) {
    console.error('❌ Error: Background removal data not found in node_modules');
    return;
  }

  console.log(`🚀 Uploading AI models to Supabase Bucket: "${BUCKET_NAME}"...`);

  const files = fs.readdirSync(MODELS_DIR);
  
  for (const file of files) {
    const fullPath = path.join(MODELS_DIR, file);
    if (fs.statSync(fullPath).isFile()) {
      // We upload to 'wasm/' prefix in the bucket
      await uploadFile(fullPath, `wasm/${file}`);
    }
  }

  console.log('\n✨ Upload complete!');
  console.log(`🔗 Public Path: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/wasm/`);
}

run();
