import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { config } from 'dotenv';

config();

async function textToSpeech(filePath: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not found in environment variables');
  }

  const client = new ElevenLabsClient({ apiKey });

  try {
    const text = readFileSync(filePath, 'utf-8');
    
    if (!text.trim()) {
      throw new Error('Input file is empty');
    }

    console.log(`Converting text to speech: ${filePath}`);
    
    const audio = await client.textToSpeech.convert('pNInz6obpgDQGcFmaJgB', {
      text,
      modelId: 'eleven_monolingual_v1',
    });

    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    
    const fileNameWithoutExt = basename(filePath, extname(filePath));
    const outputPath = resolve(filePath, '..', `${fileNameWithoutExt}.mp3`);
    
    writeFileSync(outputPath, audioBuffer);
    
    console.log(`Audio saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during text-to-speech conversion:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm start <path-to-text-file>');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  await textToSpeech(filePath);
}

main().catch(console.error);