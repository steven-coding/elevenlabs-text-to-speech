# ElevenLabs Text-to-Speech CLI

A TypeScript console application that converts text files to MP3 audio using the ElevenLabs Text-to-Speech API.

## Features

- Convert text files to high-quality MP3 audio
- Configurable voice selection by name or ID
- Multiple AI model support (Flash, Turbo, Multilingual, etc.)
- Voice settings customization (stability, similarity boost, style)
- Environment-based configuration with CLI override support
- List all available voices

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd elevenlabs-text-to-speech
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your ElevenLabs API key and preferences:
```env
ELEVENLABS_API_KEY=your_api_key_here
DEFAULT_VOICE_NAME=Rachel
DEFAULT_MODEL_ID=eleven_multilingual_v2
DEFAULT_STABILITY=0.5
DEFAULT_SIMILARITY_BOOST=0.8
DEFAULT_STYLE=0.0
DEFAULT_USE_SPEAKER_BOOST=true
```

## Usage

### Basic Usage

Convert a text file using default settings from `.env`:
```bash
npm start path/to/your/textfile.txt
```

### Voice Selection

Use a specific voice by name:
```bash
npm start textfile.txt "Rachel"
```

Use a specific voice and model:
```bash
npm start textfile.txt "Rachel" "eleven_flash_v2_5"
```

### List Available Voices

View all available voices:
```bash
npm start textfile.txt --list-voices
```

### Configuration Priority

The application uses the following priority order:
1. **CLI parameters** (highest priority)
2. **Environment variables** from `.env`
3. **System defaults** (lowest priority)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key (required) | `sk_...` |
| `DEFAULT_VOICE_NAME` | Default voice name | `Rachel` |
| `DEFAULT_VOICE_ID` | Alternative: direct voice ID | `pNInz6obpgDQGcFmaJgB` |
| `DEFAULT_MODEL_ID` | AI model to use | `eleven_multilingual_v2` |
| `DEFAULT_STABILITY` | Voice stability (0.0-1.0) | `0.5` |
| `DEFAULT_SIMILARITY_BOOST` | Similarity boost (0.0-1.0) | `0.8` |
| `DEFAULT_STYLE` | Voice style (0.0-1.0) | `0.0` |
| `DEFAULT_USE_SPEAKER_BOOST` | Enable speaker boost | `true` |

## Available Models

- `eleven_multilingual_v2` - Default multilingual model
- `eleven_flash_v2_5` - Fast generation model
- `eleven_turbo_v2_5` - Turbo speed model
- `eleven_monolingual_v1` - English-only model

## Output

The application creates an MP3 file in the same directory as the input text file with the same name:
- Input: `story.txt`
- Output: `story.mp3`

## API Reference

The project includes a `TextToSpeech` class that can be used programmatically:

```typescript
import { TextToSpeech } from './src/text-to-speech';

const tts = new TextToSpeech('your-api-key');

// Convert text to audio buffer
const audioBuffer = await tts.convertTextToSpeech('Hello world!');

// Convert file to speech
await tts.convertFileToSpeech('input.txt', 'voice-id', { modelId: 'eleven_flash_v2_5' });

// Get available voices
const voices = await tts.getAvailableVoices();
```
