# ASCII Generative Sequencer

A browser-based music sequencer that combines ASCII pattern notation with AI assistance for creating and modifying musical sequences.

## Demo: https://llm-music.roytown.net/

<img width="600" alt="image" src="https://github.com/user-attachments/assets/91eb25d1-d473-4330-a255-a0a98aa0ff2f" />


## Features

- 🎵 **ASCII Pattern DSL**: Create music using simple text-based syntax
- 🎛️ **Modular Effects**: EQ, compressor, amplifier, filter, distortion, delay, reverb, chorus, phaser — per-instrument or master
- 🎹 **ADSR Envelopes**: Full attack/decay/sustain/release control per instrument for long tails and shaped sounds
- 🥁 **12 Procedural Samples**: kick, snare, hihat, clap, kick808, rim, tom, cowbell, shaker, crash, openhat, perc
- 🎯 **Velocity Dynamics**: `X` (accent), `x` (normal), `o` (ghost note) for expressive patterns
- 🎼 **Note/Pitch System**: Assign MIDI notes or Hz frequencies to any instrument
- 🎶 **Groove & Swing**: Subdivision-aware swing (8th/16th/quarter), humanize, rush, drag — per-instrument or master
- 🔊 **LFO Modulation**: Route LFOs to amp, filter, pan, delay time/feedback
- 🤖 **AI Assistant**: Generate and modify patterns with natural language
- 🎧 **Real-time Audio**: Web Audio API engine with live parameter updates
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Live Visualizations**: Real-time audio visualizations and feedback
- 🌍 **Groove Templates**: 13 genre presets — MPC swing, bossa nova, afrobeat, dilla feel, clave, reggae, and more
- 🔄 **Pattern Library**: Browse, search, and load from a collection of sample patterns
- 🔐 **Authentication**: Supabase magic link and password authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Audio**: Tone.js (Transport/scheduling) + Web Audio API (synthesis/effects)
- **Editor**: CodeMirror 6 with custom DSL syntax highlighting
- **AI**: Multi-provider (OpenAI, Anthropic, Google Gemini)
- **Backend**: Vercel Serverless Functions (`api/` directory)
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: Turborepo with pnpm for build optimization
- **Testing**: Vitest, React Testing Library
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

> [!IMPORTANT]
> **API Development**: If you are working on the AI or backend, run `pnpm dev:api` instead of `vercel dev`. The standalone Express server handles local ESM correctly and avoids the latency/hang issues sometimes seen with `vercel dev` in complex mono-repos.

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

### Triggering Samples
Assign preloaded samples to instruments and trigger them with `seq`:

```ascii
TEMPO 122

# Built-in: kick, snare, hihat, clap, kick808, rim, tom, cowbell, shaker, crash, openhat, perc
sample kick: kick808
sample snare: snare gain=1
sample hat: openhat
sample cow: cowbell

seq kick: X...x...o...x...
seq snare: ....X.......o...
seq hat: x.x.x.x.x.x.x.x.
seq cow: x.......x.......
```

Notes:
- 12 procedural samples are preloaded: kick, snare, hihat, clap, kick808, rim, tom, cowbell, shaker, crash, openhat, perc
- If no `sample` line is provided, the engine tries a sample matching the instrument name; otherwise it falls back to a synthesized sound.
- Optional `gain` per sample maps −3..+3 steps (~3 dB/step).

### ADSR Envelopes & Velocity
Control note shape and dynamics:

```ascii
TEMPO 120

# ADSR envelope per instrument (long release = long tails)
env kick: attack=0.01 decay=0.1 sustain=0.5 release=1.0
env snare: attack=0.005 decay=0.08 sustain=0.3 release=0.3

# Velocity: X=accent (1.0), x=normal (0.7), o=ghost (0.3)
seq kick: X...x...o...x...
seq snare: ....X.......o...
```

### Per-Instrument Effects, Chorus, Phaser & Pitch
```ascii
TEMPO 130

# Per-instrument delay (only snare gets echo)
delay snare: time=0.375 feedback=0.3 mix=0.4
# Per-instrument reverb (only hihat gets verb)
reverb hihat: mix=0.5 decay=1.5

# Master chorus and phaser
chorus master: rate=1.5 depth=0.4 mix=0.3
phaser master: rate=0.5 depth=0.6 stages=4 mix=0.2

# Pitch assignment (MIDI or Hz)
note bass: 36
note lead: 440hz

seq kick: X...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
seq bass: x...x...x...x...
seq lead: ....x.......x...
```

### Groove & Swing
Add swing, humanize, rush, or drag feel without manually shifting notes:

```ascii
TEMPO 124

# 8th-note swing (default) — standard swing feel
groove master: type=swing amount=0.6 subdivision=8n

seq kick:  X...X...X...X...
seq snare: ....X.......X...
seq hihat: x.x.x.x.x.x.x.x.
```

Subdivision controls which rhythmic level swing operates at:
- `8n` (default) — delays off-beat 8th notes, standard swing
- `16n` — delays off-beat 16th notes, subtle hi-hat shuffle
- `4n` — delays off-beat quarter notes, half-time feel

Other groove types:
```ascii
TEMPO 88

# Per-instrument groove for a J Dilla lazy feel
groove kick: type=drag amount=0.3
groove hihat: type=humanize amount=0.4 steps=all

seq kick:  X..x..x...X.x...
seq snare: ....X..o....X...
seq hihat: x.x.x.x.x.x.x.x.
```

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
llm-music/
├── api/                     # Vercel serverless functions
│   ├── _lib/                # Shared API utilities (auth, system prompt, providers)
│   └── ai/                  # AI generation endpoint
├── apps/
│   └── web/                 # React frontend application
├── packages/
│   └── shared/              # Shared types and utilities (Zod schemas)
├── docs/                    # Documentation
├── .env.example             # Environment variables template
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── turbo.json               # Turborepo configuration
└── README.md                # This file
```

## Current Status

### ✅ Completed
- **Modular Synth Engine**: Tone.js Transport + Web Audio API engine with ADSR envelopes, 12 procedural samples, velocity dynamics, per-instrument and master effects chains
- **Effects Suite**: EQ, compressor, amplifier, filter, distortion, delay, reverb, chorus, phaser, pan — all with real-time parameter updates
- **LFO Modulation**: Routable to amp, filter.freq, filter.q, pan, delay.time, delay.feedback
- **Groove System**: Subdivision-aware swing (8n/16n/4n), humanize, rush, drag, plus 13 genre groove templates (MPC swing, bossa nova, afrobeat, clave, dilla feel, etc.)
- **Note/Pitch System**: MIDI note or Hz frequency assignment per instrument
- **AI Integration**: Multi-provider (OpenAI, Anthropic, Gemini) pattern generation and modification with auto-intent detection
- **Authentication**: Supabase magic link and password auth
- **Testing**: 446+ tests passing (Vitest + React Testing Library)
- **ASCII Editor**: CodeMirror 6 with inline playhead, step coloring, click-to-toggle
- **Pattern Library**: 12 sample patterns with search, filter, one-click loading
- **Visualization System**: Step sequencer, waveform, and volume visualizations
- **Production Deployment**: Vercel CI/CD pipeline

## Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm dev:web` - Start only the web app
- `pnpm dev:api` - Start the local API server (Express, for AI features)
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm deploy` - Full deployment with all checks
- `pnpm deploy:quick` - Quick deployment (skip tests)
- `pnpm deploy:prod` - Deploy to production

### Adding New Features

1. **Types**: Add to `apps/web/src/types/` or `packages/shared/src/types/`
2. **Components**: Add to `apps/web/src/components/`
3. **API Routes**: Add to `api/` (top-level, Vercel serverless)
4. **Utilities**: Add to `packages/shared/src/utils/`

## ASCII Pattern DSL

The sequencer uses a custom Domain Specific Language (DSL) for creating patterns:

```ascii
TEMPO 120

seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

### DSL Syntax

| Keyword | Example | Description |
|---------|---------|-------------|
| `TEMPO` | `TEMPO 120` | Set tempo in BPM (60–200) |
| `seq` | `seq kick: X.x.o...` | Sequence pattern (`X`=accent, `x`=normal, `o`=ghost, `.`=rest), 16 steps |
| `sample` | `sample hat: openhat` | Assign sample (kick, snare, hihat, clap, kick808, rim, tom, cowbell, shaker, crash, openhat, perc) |
| `groove` | `groove master: type=swing amount=0.6` | Timing feel; types: `swing`, `humanize`, `rush`, `drag`, `template` |
| `eq` | `eq kick: low=2 mid=-1 high=1` | 3-band EQ; `low\|mid\|high = -3..+3` |
| `amp` | `amp master: gain=2` | Amplifier gain; `-3..+3` (~3 dB/step) |
| `comp` | `comp master: threshold=-24 ratio=4` | Compressor; `threshold -60..0`, `ratio 1..20`, `attack`, `release`, `knee` |
| `filter` | `filter kick: type=lowpass freq=800 q=1` | Filter; types: lowpass, highpass, bandpass |
| `delay` | `delay snare: time=0.375 feedback=0.3 mix=0.4` | Delay (per-instrument or master) |
| `reverb` | `reverb hihat: mix=0.5 decay=1.5` | Reverb (per-instrument or master) |
| `distort` | `distort master: amount=0.3 mix=0.5` | Distortion |
| `pan` | `pan hihat: 0.3` | Stereo pan; `-1` (left) to `1` (right) |
| `env` | `env kick: attack=0.01 decay=0.1 sustain=0.5 release=1.0` | ADSR envelope |
| `chorus` | `chorus master: rate=1.5 depth=0.4 mix=0.3` | Chorus effect |
| `phaser` | `phaser master: rate=0.5 depth=0.6 stages=4 mix=0.3` | Phaser; stages: 2, 4, 8, 12 |
| `note` | `note bass: 36` or `note lead: 440hz` | Pitch assignment (MIDI 0–127 or Hz) |
| `lfo` | `lfo kick.amp: rate=5Hz depth=0.5 wave=sine` | LFO modulation; targets: amp, filter.freq, filter.q, pan, delay.time, delay.feedback |
| `#` / `//` | `# Comment` or `seq k: x... // comment` | Comments (ignored) |

### Groove & Swing Details

Swing operates at configurable subdivision levels:
- `subdivision=8n` (default) — delays off-beat 8th notes, standard swing
- `subdivision=16n` — delays off-beat 16th notes, subtle shuffle
- `subdivision=4n` — delays off-beat quarter notes, half-time feel

Use `type=template` with `name=<preset>` for genre-specific grooves:
- **Swing**: `mpc-swing-54`, `mpc-swing-58`, `mpc-swing-62`, `mpc-swing-66`, `mpc-swing-71`
- **Latin**: `bossa-nova`, `son-clave-3-2`, `rumba-clave-3-2`
- **African**: `afrobeat-12-8`
- **Reggae**: `reggae-one-drop`
- **Funk**: `second-line`, `go-go-swing`, `dilla-feel`

```ascii
groove master: type=template name=bossa-nova amount=0.8
```

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

### Deployment

The app is deployed on Vercel with CI/CD via GitHub Actions. See [docs/ENVIRONMENT-SETUP.md](docs/ENVIRONMENT-SETUP.md) for environment variable configuration.

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
- 🐛 [Report Issues](https://github.com/goggledefogger/llm-music/issues)
- 💬 [Discussions](https://github.com/goggledefogger/llm-music/discussions)

## Roadmap

- [x] Advanced audio effects (ADSR, chorus, phaser, per-instrument FX)
- [x] Expanded sample bank (12 procedural samples)
- [x] Velocity-sensitive patterns
- [x] Tone.js integration (Transport/scheduling)
- [x] Groove & swing system (subdivision-aware + genre templates)
- [x] Multi-provider AI (OpenAI, Anthropic, Gemini)
- [ ] MIDI controller support
- [ ] Audio export (WAV/MP3)
- [ ] Collaborative real-time editing
- [ ] FM synthesis and wavetable oscillators
- [ ] Sample upload (user-provided WAV/MP3)

---

Built with ❤️ for the music production community
