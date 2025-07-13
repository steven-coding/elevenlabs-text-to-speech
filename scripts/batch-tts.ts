#!/usr/bin/env ts-node

import { resolve, join, extname, basename } from 'path';
import { readdirSync, statSync, existsSync } from 'fs';
import { config } from 'dotenv';
import { TextToSpeech, TextToSpeechConfig } from '../src/text-to-speech';

config();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: ts-node scripts/batch-tts.ts <directory> [voice-name] [model-id]');
    console.error('Examples:');
    console.error('  ts-node scripts/batch-tts.ts ./test');
    console.error('  ts-node scripts/batch-tts.ts ./test "Rachel"');
    console.error('  ts-node scripts/batch-tts.ts ./test "Rachel" "eleven_flash_v2_5"');
    process.exit(1);
  }

  const directoryPath = resolve(args[0]);
  const voiceName = args[1] || process.env.DEFAULT_VOICE_NAME;
  const modelId = args[2] || process.env.DEFAULT_MODEL_ID;

  if (!existsSync(directoryPath)) {
    console.error(`Directory does not exist: ${directoryPath}`);
    process.exit(1);
  }

  if (!statSync(directoryPath).isDirectory()) {
    console.error(`Path is not a directory: ${directoryPath}`);
    process.exit(1);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not found in environment variables');
  }

  const tts = new TextToSpeech(apiKey);

  // Find voice ID
  let voiceId: string | undefined;
  
  if (process.env.DEFAULT_VOICE_ID && !args[1]) {
    voiceId = process.env.DEFAULT_VOICE_ID;
    console.log(`Using voice ID from env: ${voiceId}`);
  } else if (voiceName) {
    console.log(`Looking for voice: ${voiceName}`);
    const voice = await tts.findVoiceByName(voiceName);
    if (voice) {
      voiceId = voice.voice_id;
      console.log(`Found voice: ${voice.name} (${voice.voice_id})`);
    } else {
      console.warn(`Voice "${voiceName}" not found, using default voice`);
    }
  }

  // Setup configuration
  const config: TextToSpeechConfig = {};
  if (modelId) {
    config.modelId = modelId;
    console.log(`Using model: ${modelId}`);
  }

  // Apply voice settings from env if available
  const voiceSettings: any = {};
  if (process.env.DEFAULT_STABILITY) {
    voiceSettings.stability = parseFloat(process.env.DEFAULT_STABILITY);
  }
  if (process.env.DEFAULT_SIMILARITY_BOOST) {
    voiceSettings.similarity_boost = parseFloat(process.env.DEFAULT_SIMILARITY_BOOST);
  }
  if (process.env.DEFAULT_STYLE) {
    voiceSettings.style = parseFloat(process.env.DEFAULT_STYLE);
  }
  if (process.env.DEFAULT_USE_SPEAKER_BOOST) {
    voiceSettings.use_speaker_boost = process.env.DEFAULT_USE_SPEAKER_BOOST === 'true';
  }

  if (Object.keys(voiceSettings).length > 0) {
    config.voiceSettings = voiceSettings;
    console.log(`Applied voice settings from env:`, voiceSettings);
  }

  // Get all text files in directory
  const files = readdirSync(directoryPath);
  const textFiles = files
    .filter(file => extname(file).toLowerCase() === '.txt')
    .sort(); // Sort alphabetically

  if (textFiles.length === 0) {
    console.log('No text files found in the directory.');
    return;
  }

  console.log(`Found ${textFiles.length} text files:`);
  textFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  // Process each text file
  for (const textFile of textFiles) {
    const textFilePath = join(directoryPath, textFile);
    const fileNameWithoutExt = basename(textFile, '.txt');
    const expectedMp3Path = join(directoryPath, `${fileNameWithoutExt}.mp3`);

    // Check if MP3 already exists
    if (existsSync(expectedMp3Path)) {
      console.log(`Skipping ${textFile} - MP3 already exists: ${fileNameWithoutExt}.mp3`);
      continue;
    }

    try {
      console.log(`Processing: ${textFile}`);
      await tts.convertFileToSpeech(textFilePath, voiceId, config, expectedMp3Path);
      console.log(`✓ Created: ${fileNameWithoutExt}.mp3`);
    } catch (error) {
      console.error(`✗ Failed to process ${textFile}:`, error);
    }
  }

  console.log('\nBatch processing complete!');
}

main().catch(console.error);