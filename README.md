# ASCII Generative Sequencer

A browser-based music sequencer that combines ASCII pattern notation with AI assistance for creating and modifying musical sequences.

## Features

- 🎵 **ASCII Pattern DSL**: Create music using simple text-based syntax
- 🤖 **AI Assistant**: Get help from AI to generate and modify patterns
- 🎧 **Real-time Audio**: High-quality audio synthesis with Tone.js
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Live Visualizations**: Real-time audio visualizations and feedback
- 🔄 **Pattern Sharing**: Share and discover patterns with the community

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
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
ascii-generative-sequencer/
├── apps/
│   ├── web/                 # React frontend application
│   └── api/                 # Vercel serverless functions
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configuration
├── docs/                    # Documentation
├── .env.example             # Environment variables template
├── package.json             # Root package.json
├── turbo.json              # Turborepo configuration
└── README.md               # This file
```

## Current Status

### ✅ Completed
- **Project Setup**: Monorepo with pnpm and Turborepo configured
- **Development Environment**: Vite, TypeScript, and build system working
- **Testing Framework**: Vitest and React Testing Library configured
- **Basic Web App**: React app running on http://localhost:3000
- **Package Management**: pnpm workspace with proper dependency management

### 🚧 In Progress
- **ASCII Editor**: CodeMirror 6 integration
- **Audio Engine**: Tone.js implementation
- **AI Integration**: OpenAI API setup

### 📋 Next Steps
- Implement ASCII DSL parser
- Add audio synthesis capabilities
- Integrate AI chat interface
- Create pattern library

## Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm dev:web` - Start only the web app
- `pnpm dev:api` - Start only the API functions
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages

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
