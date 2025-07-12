import { resolve } from 'path';
import { config } from 'dotenv';
import { TextToSpeech, TextToSpeechConfig } from './text-to-speech';

config();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm start <path-to-text-file> [voice-name] [model-id]');
    console.error('Examples:');
    console.error('  npm start text.txt');
    console.error('  npm start text.txt "Rachel"');
    console.error('  npm start text.txt "Rachel" "eleven_flash_v2_5"');
    console.error('  npm start text.txt --list-voices');
    process.exit(1);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not found in environment variables');
  }

  const tts = new TextToSpeech(apiKey);

  if (args[1] === '--list-voices') {
    console.log('Available voices:');
    try {
      const voices = await tts.getAvailableVoices();
      voices.forEach(voice => {
        console.log(`- ${voice.name} (${voice.voice_id}) - ${voice.description || 'No description'}`);
      });
    } catch (error) {
      console.error('Error fetching voices:', error);
      process.exit(1);
    }
    return;
  }

  const filePath = resolve(args[0]);
  const voiceName = args[1] || process.env.DEFAULT_VOICE_NAME;
  const modelId = args[2] || process.env.DEFAULT_MODEL_ID;

  try {
    let voiceId: string | undefined;
    
    // Use voice ID directly from env if provided
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

    await tts.convertFileToSpeech(filePath, voiceId, config);
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

main().catch(console.error);