# Project Brief: ASCII Generative Sequencer (Web Edition)

## Executive Summary

The ASCII Generative Sequencer is a browser-native, text-driven music workstation that combines an ASCII editor for modular sequencing with an AI-powered chat interface. The left pane features a CodeMirror-based editor with custom DSL syntax, while the right pane provides natural language control via LLM integration (OpenAI or in-browser WebLLM). The solution addresses the complexity barrier in music production by making advanced sequencing accessible through familiar text-based interfaces and conversational AI, targeting both live coders and traditional music producers seeking more intuitive workflows.

## Problem Statement

Current music production tools suffer from several critical pain points:

- **Complexity Overload**: Traditional DAWs like Ableton Live, Logic Pro, and FL Studio require extensive learning curves, with hundreds of features that overwhelm new users
- **Limited Accessibility**: Professional music software is expensive ($200-600+ licenses) and requires powerful hardware, excluding many potential creators
- **Fragmented Workflows**: Musicians must switch between multiple tools for composition, sequencing, and live performance, creating workflow friction
- **Steep Learning Curve**: Even text-based tools like TidalCycles require deep programming knowledge, limiting adoption to technical users
- **Platform Lock-in**: Desktop software ties users to specific operating systems and hardware configurations

The impact is significant: millions of potential music creators are excluded from professional-quality music production due to these barriers. Existing solutions either sacrifice power for simplicity (basic mobile apps) or require extensive technical expertise (programming-based tools).

## Proposed Solution

The ASCII Generative Sequencer revolutionizes music creation through a browser-based, dual-pane interface that democratizes advanced music production:

**Core Innovation**: A custom ASCII DSL that combines the readability of traditional music notation with the power of modern sequencing, enhanced by AI-driven natural language control.

**Key Differentiators**:
- **Zero Installation**: Runs entirely in the browser with Web Audio API
- **Conversational Control**: Natural language requests automatically generate and modify sequences
- **Progressive Complexity**: Simple patterns for beginners, advanced features for experts
- **Cross-Platform**: Works on any device with a modern browser
- **Open Architecture**: Extensible through Web Audio Modules and Faust integration

**Technical Foundation**: Built on Tone.js for audio processing, CodeMirror 6 for editing, and WebLLM for offline AI capabilities, ensuring both performance and accessibility.

## Target Users

### Primary User Segment: Live Coders & Technical Musicians

**Demographics**:
- Age: 25-45
- Technical background: Software developers, engineers, or tech-savvy musicians
- Income: $50K-150K annually
- Location: Urban/suburban areas with good internet connectivity

**Current Behaviors**:
- Use TidalCycles, SuperCollider, or Max/MSP for live coding
- Participate in algorave communities and live coding meetups
- Share code snippets and patterns on GitHub, forums
- Perform at electronic music venues and festivals

**Pain Points**:
- Complex setup and configuration of live coding environments
- Limited portability of desktop-based tools
- Steep learning curve for new languages and frameworks
- Difficulty sharing and collaborating on musical code

**Goals**:
- Create unique, generative musical performances
- Collaborate with other live coders
- Perform live without technical failures
- Learn new algorithmic composition techniques

### Secondary User Segment: Music Producers Seeking Simplicity

**Demographics**:
- Age: 18-35
- Musical background: Hobbyist to semi-professional producers
- Technical comfort: Basic to intermediate
- Income: $25K-75K annually

**Current Behaviors**:
- Use free/cheap DAWs like GarageBand, Reaper, or online tools
- Watch YouTube tutorials for music production
- Share music on SoundCloud, Bandcamp, social media
- Struggle with complex software interfaces

**Pain Points**:
- Overwhelmed by traditional DAW complexity
- Limited budget for professional software
- Want more creative control than simple apps provide
- Difficulty translating musical ideas to software

**Goals**:
- Create professional-quality music without complex software
- Learn music theory and composition through practice
- Collaborate with other musicians online
- Build a portfolio of original compositions

## Goals & Success Metrics

### Business Objectives
- **User Adoption**: 10,000 active users within 6 months of launch
- **Engagement**: Average session duration of 45+ minutes
- **Retention**: 40% monthly active user retention rate
- **Community Growth**: 1,000+ shared patterns in community library
- **Revenue**: $50K ARR through premium features and API access

### User Success Metrics
- **Onboarding Completion**: 80% of users complete first pattern creation
- **Feature Discovery**: 60% of users try AI chat interface within first week
- **Pattern Sharing**: 25% of users share at least one pattern publicly
- **Learning Progression**: Users advance from basic to intermediate patterns within 30 days
- **Performance Success**: 90% of live performances complete without technical issues

### Key Performance Indicators (KPIs)
- **Daily Active Users (DAU)**: Target 2,000 DAU by month 6
- **Pattern Creation Rate**: 5+ new patterns per user per month
- **AI Interaction Rate**: 70% of sessions include AI chat usage
- **Cross-Platform Usage**: 40% of users access from mobile devices
- **Community Engagement**: 15% of users contribute to community features

## MVP Scope

### Core Features (Must Have)
- **ASCII Editor**: CodeMirror 6 with custom Lezer grammar, Vim keybindings, and syntax highlighting
- **Basic Audio Engine**: Tone.js integration with sample playback, 3 basic synths (kick, hat, pad), and essential effects
- **AI Chat Interface**: OpenAI API integration with pattern generation and modification capabilities
- **Pattern Library**: 10+ example patterns covering different genres and complexity levels
- **Transport Controls**: Play/pause, tempo adjustment, swing control, and basic metronome
- **Export Functionality**: Audio export to WAV/MP3 and pattern sharing via URL
- **Responsive Design**: Works on desktop, tablet, and mobile browsers
- **User Gesture Audio**: Proper autoplay policy compliance with "Start Audio" button

### Out of Scope for MVP
- Web MIDI integration
- Web Audio Modules (WAM) hosting
- Multi-user collaboration features
- Advanced DSP and custom audio worklets
- Offline AI capabilities (WebLLM)
- Plugin marketplace or third-party integrations
- Advanced pattern analysis and suggestions
- Social features beyond basic sharing

### MVP Success Criteria
The MVP is successful when users can create, modify, and perform basic musical patterns using both the ASCII editor and AI chat interface, with the system running reliably across major browsers and devices.

## Post-MVP Vision

### Phase 2 Features
- **Web MIDI Integration**: Hardware controller support and external device communication
- **Advanced AI Capabilities**: In-browser WebLLM for offline operation and enhanced pattern generation
- **Collaborative Features**: Real-time multi-user editing and performance capabilities
- **Plugin Ecosystem**: Web Audio Modules support with Faust integration for custom effects
- **Advanced Pattern Tools**: Euclidean rhythms, probability-based generation, and algorithmic composition
- **Mobile Optimization**: Native app wrappers and touch-optimized interfaces

### Long-term Vision
Within 2 years, the ASCII Generative Sequencer becomes the leading browser-based music production platform, serving as a bridge between traditional music production and live coding communities. The platform will support a thriving ecosystem of user-generated content, educational resources, and collaborative performances.

### Expansion Opportunities
- **Educational Market**: Integration with music education platforms and curriculum
- **Professional Tools**: Advanced features for commercial music production
- **API Platform**: Third-party integrations with existing music software
- **Hardware Partnerships**: Integration with MIDI controllers and audio interfaces
- **Live Performance**: Venue partnerships and performance streaming capabilities

## Technical Considerations

### Platform Requirements
- **Target Platforms**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Browser/OS Support**: Progressive enhancement with graceful degradation for older browsers
- **Performance Requirements**: <100ms audio latency, 60fps UI, <50MB memory footprint

### Technology Preferences
- **Frontend**: Vanilla JavaScript with modern ES6+ features, CSS Grid/Flexbox for layout
- **Backend**: None required for MVP (fully client-side), future API for collaboration features
- **Database**: IndexedDB for local storage, future cloud storage for user data
- **Hosting/Infrastructure**: Static hosting (Netlify/Vercel) with CDN for global performance

### Architecture Considerations
- **Repository Structure**: Monorepo with separate modules for editor, audio engine, and AI integration
- **Service Architecture**: Modular design with clear separation between UI, audio processing, and AI services
- **Integration Requirements**: OpenAI API, Web Audio API, Web MIDI API (future), WebRTC (future)
- **Security/Compliance**: HTTPS-only operation, user data privacy compliance, secure API key management

## Constraints & Assumptions

### Constraints
- **Budget**: $5K initial development budget, $2K monthly operational costs
- **Timeline**: 6-month MVP development timeline with 2-month beta testing phase
- **Resources**: Solo developer with occasional contractor support for specialized tasks
- **Technical**: Must work within browser security limitations and Web Audio API constraints

### Key Assumptions
- Users are willing to learn a new text-based interface for music creation
- AI-generated patterns will be sufficiently musical and useful for users
- Browser-based audio performance will meet user expectations for latency and quality
- The live coding community will embrace a browser-based alternative to desktop tools
- Mobile users will accept text-based music creation despite touch interface limitations

## Risks & Open Questions

### Key Risks
- **Browser Compatibility**: Audio timing inconsistencies across different browsers and devices
- **AI Quality**: LLM-generated patterns may not meet musical quality standards
- **User Adoption**: Text-based interface may not appeal to visual learners
- **Performance**: Complex patterns may cause audio dropouts on lower-end devices
- **Competition**: Established players may quickly copy key features

### Open Questions
- What is the optimal balance between simplicity and power in the DSL syntax?
- How can we ensure AI-generated patterns are musically coherent and genre-appropriate?
- What monetization model will work best for a browser-based music tool?
- How can we build a sustainable community around pattern sharing and collaboration?
- What are the legal implications of AI-generated musical content?

### Areas Needing Further Research
- User testing with target segments to validate interface design
- Performance benchmarking across different devices and browsers
- Legal research on AI-generated content and copyright implications
- Market analysis of browser-based music tools and user adoption patterns
- Technical feasibility of advanced features like real-time collaboration

## Appendices

### A. Research Summary
This project brief is based on analysis of existing live coding tools (TidalCycles, SuperCollider), browser-based music applications (Web Audio API examples), and AI-assisted creative tools. Key insights include the growing popularity of live coding communities, the success of browser-based creative tools, and the potential for AI to lower barriers to music creation.

### B. Stakeholder Input
Initial feedback from live coding community members indicates strong interest in a browser-based solution that reduces setup complexity while maintaining the power and flexibility of text-based music creation.

### C. References
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js Framework](https://tonejs.github.io/)
- [CodeMirror 6 Documentation](https://codemirror.net/)
- [TidalCycles Community](https://tidalcycles.org/)
- [Strudel Live Coding Platform](https://strudel.cc/)

## Current Project Status

### ✅ Completed Foundation
1. **Development Environment**: Monorepo setup with pnpm and Turborepo
2. **Build System**: Vite configured with TypeScript and hot reloading
3. **Testing Framework**: Vitest and React Testing Library configured
4. **Basic Web App**: React application running on http://localhost:3000
5. **Package Management**: pnpm workspace with proper dependency management
6. **Code Quality**: ESLint and Prettier configured for consistent code style

### 🚧 Currently In Progress
1. **ASCII Editor**: CodeMirror 6 integration with custom DSL syntax
2. **Audio Engine**: Tone.js implementation for Web Audio API
3. **AI Integration**: OpenAI API setup and integration
4. **Component Architecture**: React component structure and routing

### 📋 Next Implementation Steps
1. Create basic ASCII DSL grammar and parser using Lezer
2. Implement core audio engine with sample playback and basic synthesis
3. Design and prototype the dual-pane interface layout
4. Integrate OpenAI API for pattern generation and modification
5. Create initial pattern library with diverse examples
6. Implement user gesture audio policy compliance
7. Set up cross-browser compatibility testing
8. Create comprehensive project documentation
9. Establish user feedback collection system
10. Deploy to staging environment for testing

### PM Handoff
This Project Brief provides the full context for ASCII Generative Sequencer (Web Edition). Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.
