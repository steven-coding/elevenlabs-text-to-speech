import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, extname, basename } from 'path';

export interface Voice {
  voice_id: string;
  name: string;
  samples?: any[];
  category?: string;
  fine_tuning?: {
    is_allowed_to_fine_tune: boolean;
  };
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface TextToSpeechConfig {
  modelId?: string;
  languageCode?: string;
  voiceSettings?: VoiceSettings;
  outputFormat?: string;
  applyTextNormalization?: 'auto' | 'on' | 'off';
}

export class TextToSpeech {
  private client: ElevenLabsClient;
  private apiKey: string;
  private defaultVoiceId: string;
  private defaultConfig: TextToSpeechConfig;

  constructor(apiKey: string, defaultVoiceId?: string, config?: TextToSpeechConfig) {
    this.client = new ElevenLabsClient({ apiKey });
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId || 'pNInz6obpgDQGcFmaJgB';
    this.defaultConfig = {
      modelId: 'eleven_multilingual_v2',
      ...config
    };
  }

  async getAvailableVoices(searchTerm?: string, category?: string): Promise<Voice[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v2/voices?' + new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(category && { category }),
        page_size: '100'
      }), {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async findVoiceByName(name: string): Promise<Voice | null> {
    const voices = await this.getAvailableVoices(name);
    return voices.find(voice => voice.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async convertTextToSpeech(
    text: string,
    voiceId?: string,
    config?: TextToSpeechConfig
  ): Promise<Buffer> {
    const finalVoiceId = voiceId || this.defaultVoiceId;
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const audio = await this.client.textToSpeech.convert(finalVoiceId, {
        text,
        modelId: finalConfig.modelId,
        ...(finalConfig.languageCode && { language_code: finalConfig.languageCode }),
        ...(finalConfig.voiceSettings && { voice_settings: finalConfig.voiceSettings }),
        ...(finalConfig.outputFormat && { output_format: finalConfig.outputFormat }),
        ...(finalConfig.applyTextNormalization && { 
          apply_text_normalization: finalConfig.applyTextNormalization 
        })
      });

      const chunks: Uint8Array[] = [];
      const reader = audio.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error during text-to-speech conversion:', error);
      throw error;
    }
  }

  async convertFileToSpeech(
    filePath: string,
    voiceId?: string,
    config?: TextToSpeechConfig,
    outputPath?: string
  ): Promise<string> {
    try {
      const text = readFileSync(filePath, 'utf-8');
      
      if (!text.trim()) {
        throw new Error('Input file is empty');
      }

      console.log(`Converting text to speech: ${filePath}`);
      
      const audioBuffer = await this.convertTextToSpeech(text, voiceId, config);
      
      const finalOutputPath = outputPath || (() => {
        const fileNameWithoutExt = basename(filePath, extname(filePath));
        return resolve(filePath, '..', `${fileNameWithoutExt}.mp3`);
      })();
      
      writeFileSync(finalOutputPath, audioBuffer);
      
      console.log(`Audio saved to: ${finalOutputPath}`);
      return finalOutputPath;
    } catch (error) {
      console.error('Error during file conversion:', error);
      throw error;
    }
  }

  setDefaultVoice(voiceId: string): void {
    this.defaultVoiceId = voiceId;
  }

  setDefaultConfig(config: TextToSpeechConfig): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  getDefaultVoice(): string {
    return this.defaultVoiceId;
  }

  getDefaultConfig(): TextToSpeechConfig {
    return { ...this.defaultConfig };
  }
}