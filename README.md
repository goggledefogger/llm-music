# ASCII Generative Sequencer

A browser-based music sequencer that combines ASCII pattern notation with AI assistance for creating and modifying musical sequences.

## Demo: https://llm-music.roytown.net/

<img width="600" alt="image" src="https://github.com/user-attachments/assets/91eb25d1-d473-4330-a255-a0a98aa0ff2f" />


## Features

- 🎵 **ASCII Pattern DSL**: Create music using simple text-based syntax
- 🎛️ **EQ Modules**: Professional-grade equalizer controls with keyboard-friendly syntax
- 🎚️ **Audio Effects**: Compressors, amplifiers, and LFOs with text-only control
- 🤖 **AI Assistant**: Get help from AI to generate and modify patterns
- 🎧 **Real-time Audio**: High-quality audio synthesis with Tone.js
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Live Visualizations**: Real-time audio visualizations and feedback
- 🔄 **Pattern Library**: Browse, search, and load from a collection of sample patterns
- 💾 **Pattern Storage**: Local storage with search and filtering capabilities
- 🎯 **One-Click Loading**: Instantly load patterns into the editor with full audio integration

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Audio**: Tone.js, Web Audio API
- **Editor**: CodeMirror 6 with custom DSL syntax highlighting
- **AI**: OpenAI API integration
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: Turborepo with pnpm for build optimization
- **Testing**: Vitest, React Testing Library, Playwright
- **Package Manager**: pnpm (workspace protocol)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+ (package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ascii-generative-sequencer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server**
   ```bash
   pnpm dev:web
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Example Usage

### Basic Pattern
```ascii
TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

### Pattern with EQ
```ascii
TEMPO 120

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=-1 high=1
eq snare: low=-1 mid=2 high=1

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

### Pattern with EQ, Amp, Compressor, and LFO
```ascii
TEMPO 120

# Master processing
eq master: low=0 mid=0 high=0
amp master: gain=0           # −3..+3 steps (≈3 dB/step)
comp master: threshold=-24 ratio=4 attack=0.01 release=0.25 knee=30

# Per-instrument processing
eq kick: low=3 mid=-1 high=0
amp kick: gain=1
comp kick: threshold=-18 ratio=3 attack=0.005 release=0.2 knee=24

# Tremolo on kick level
lfo kick.amp: rate=5Hz depth=0.5 wave=sine

seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

### Triggering Samples (MVP)
Assign preloaded samples to instruments and trigger them with `seq`:

```ascii
TEMPO 122

# Map instrument names to samples (built-in: kick, snare, hihat, clap)
sample kick: kick
sample snare: snare gain=1
sample hat: hihat

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hat: x.x.x.x.x.x.x.x.
```

Notes:
- For MVP, a small procedural sample bank is preloaded (kick, snare, hihat, clap).
- If no `sample` line is provided, the engine tries a sample matching the instrument name; otherwise it falls back to a synthesized sound.
- Optional `gain` per sample maps −3..+3 steps (~3 dB/step).

## Environment Setup

### Required API Keys

You'll need to set up the following services:

#### 1. Supabase (Database & Auth)
- Create a project at [supabase.com](https://supabase.com)
- Get your project URL and anon key from Settings > API
- Get your service role key from Settings > API (keep this secret!)

#### 2. OpenAI (AI Assistant)
- Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)
- Make sure you have credits in your account

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
ascii-generative-sequencer/
├── apps/
│   ├── web/                 # React frontend application
│   └── api/                 # Vercel serverless functions (planned)
├── packages/
│   └── shared/              # Shared types and utilities
├── docs/                    # Documentation
├── supabase/                # Supabase configuration
├── .env.example             # Environment variables template
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
└── README.md               # This file
```

## Current Status

### ✅ Completed
- **Project Setup**: Monorepo with pnpm and Turborepo configured
- **Development Environment**: Vite, TypeScript, and build system working
- **Testing Framework**: Vitest and React Testing Library configured with 139 tests passing (100% success rate)
- **Web Application**: React app running on http://localhost:3000
- **Package Management**: pnpm workspace with proper dependency management
- **Audio Engine**: Web Audio API engine with master/per-instrument effects (EQ, amp, compressor, LFO)
- **Pattern System**: Boolean-based pattern parsing with real-time validation
- **Pattern Loading System**: Complete pattern library with search, filter, and one-click loading
- **Visualization System**: 6 core visualization components with comprehensive testing
- **Architecture**: Simplified component-based architecture with focused custom hooks
- **ASCII Editor**: CodeMirror 6 integration with inline playhead highlighting, base step coloring, and click-to-toggle steps (reduce-motion supported)
- **Production Deployment**: Successfully deployed to Vercel with CI/CD pipeline
- **Environment Configuration**: Production environment variables configured
- **Build System**: Optimized production build (575KB bundle, 174KB gzipped)

### 🚧 In Progress
- **AI Integration**: OpenAI API setup (mock interface implemented)

### 📋 Next Steps
- Enhance DSL highlighting (Lezer grammar, optional)
- Integrate OpenAI API for AI chat functionality
- Add advanced audio effects and synthesis capabilities
- Set up production Supabase project for full functionality

## Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm dev:web` - Start only the web app
- `pnpm dev:api` - Start only the API functions (planned)
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm deploy` - Full deployment with all checks
- `pnpm deploy:quick` - Quick deployment (skip tests)
- `pnpm deploy:prod` - Deploy to production

### Adding New Features

1. **Types**: Add to `packages/shared/src/types/`
2. **Components**: Add to `apps/web/src/components/`
3. **API Routes**: Add to `apps/api/`
4. **Utilities**: Add to `packages/shared/src/utils/`

## ASCII Pattern DSL

The sequencer uses a custom Domain Specific Language (DSL) for creating patterns:

```ascii
TEMPO 120
SWING 12%
SCALE C major

inst kick: sample("kick.wav")
inst snare: sample("snare.wav")
inst hihat: sample("hihat.wav")

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

### DSL Syntax

- `TEMPO` - Set the tempo in BPM
- `SWING` - Add swing feel (0-50%)
- `SCALE` - Set the musical scale
- `inst` - Define instruments with samples or synthesis
- `seq` - Create sequences using pattern symbols
- `eq name:` - 3-band EQ per module; `low|mid|high = -3..+3`
- `amp name:` - Amplifier gain in steps; `gain = -3..+3` (≈3 dB/step)
- `comp name:` - Compressor; `threshold -60..0`, `ratio 1..20`, `attack 0.001..0.3`, `release 0.02..1`, `knee 0..40`
- `lfo name.amp:` - LFO on amp gain; `rate 0.1..20Hz`, `depth 0..1`, `wave sine|triangle|square|sawtooth`
- Pattern symbols: `x` (hit), `.` (rest), `X` (accent), `o` (ghost)

## AI Assistant

The AI assistant can help you:

- Generate new patterns from descriptions
- Modify existing patterns
- Suggest improvements
- Explain musical concepts
- Convert between different musical styles

Example prompts:
- "Create a drum pattern for a house track"
- "Add more swing to this pattern"
- "Make this pattern more complex"
- "Convert this to a jazz style"

## Deployment

### 🚀 Production Ready

The ASCII Generative Sequencer is **100% ready for production deployment**:

- ✅ **Build**: Production build successful (575KB bundle)
- ✅ **Tests**: All 139 tests passing (100% success rate)
- ✅ **TypeScript**: All errors resolved, strict mode enabled
- ✅ **Performance**: Optimized for production with Vercel Edge Network

### Quick Deploy

```bash
# Full deployment with all checks
pnpm deploy

# Quick deployment (skip tests)
pnpm deploy:quick

# Manual deployment
vercel --prod
```

### Live Demo

**Production URL**: https://ascii-generative-sequencer-5zds7ms6o.vercel.app

*Note: Currently has Vercel Authentication Protection enabled. To make it publicly accessible, disable authentication protection in your Vercel dashboard.*

### Environment Setup

For production deployment, you'll need to set up:

1. **Vercel Account**: [vercel.com](https://vercel.com)
2. **Supabase Project**: [supabase.com](https://supabase.com) (for full functionality)
3. **OpenAI API Key**: [platform.openai.com](https://platform.openai.com/api-keys)

See [docs/ENVIRONMENT-SETUP.md](docs/ENVIRONMENT-SETUP.md) for detailed setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/your-org/ascii-generative-sequencer/issues)
- 💬 [Discussions](https://github.com/your-org/ascii-generative-sequencer/discussions)

## Roadmap

- [ ] Advanced audio effects
- [ ] MIDI controller support
- [ ] Collaborative editing
- [ ] Mobile app
- [ ] Plugin system
- [ ] Advanced AI models
- [ ] Real-time collaboration
- [ ] Audio export formats

---

Built with ❤️ for the music production community
