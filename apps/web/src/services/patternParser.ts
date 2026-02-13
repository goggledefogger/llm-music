// Basic pattern parser for ASCII Generative Sequencer
import { ParsedPattern, EQModule, AmpModule, CompModule, LFOModule, LFOWave, LFOTarget, SampleModule, FilterModule, FilterType, DelayModule, ReverbModule, PanModule, DistortModule, EnvelopeModule, ChorusModule, PhaserModule, NoteModule } from '../types/app';

export class PatternParser {
  private static readonly DEFAULT_TEMPO = 120;
  private static readonly MAX_STEPS = 32;
  private static readonly VALID_LFO_TARGETS: LFOTarget[] = ['amp', 'filter.freq', 'filter.q', 'pan', 'delay.time', 'delay.feedback'];

  /**
   * Parse a simple ASCII pattern into a structured format
   * Phase 1: Very basic parsing - just tempo and simple sequences
   */
  static parse(pattern: string): ParsedPattern {
    // 1. Split lines and strip comments (inline # and //)
    const lines = pattern.split('\n').map(line => {
      // Remove comments starting with # or //
      const commentIndex = line.search(/(\/\/|#)/);
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex).trim();
      }
      return line.trim();
    }).filter(line => line.length > 0);

    let tempo = this.DEFAULT_TEMPO;
    const instruments: ParsedPattern['instruments'] = {};
    const eqModules: ParsedPattern['eqModules'] = {};
    const sampleModules: ParsedPattern['sampleModules'] = {};
    const ampModules: ParsedPattern['ampModules'] = {};
    const compModules: ParsedPattern['compModules'] = {};
    const filterModules: ParsedPattern['filterModules'] = {};
    const delayModules: ParsedPattern['delayModules'] = {};
    const reverbModules: ParsedPattern['reverbModules'] = {};
    const panModules: ParsedPattern['panModules'] = {};
    const distortModules: ParsedPattern['distortModules'] = {};
    const lfoModules: ParsedPattern['lfoModules'] = {};
    const envelopeModules: ParsedPattern['envelopeModules'] = {};
    const chorusModules: ParsedPattern['chorusModules'] = {};
    const phaserModules: ParsedPattern['phaserModules'] = {};
    const noteModules: ParsedPattern['noteModules'] = {};
    const grooveModules: ParsedPattern['grooveModules'] = {};

    for (const line of lines) {
      // Parse tempo
      if (line.startsWith('TEMPO ')) {
        const tempoMatch = line.match(/TEMPO\s+(\d+)/);
        if (tempoMatch) {
          tempo = Math.max(60, Math.min(200, parseInt(tempoMatch[1], 10)));
        }
        continue;
      }

      // Parse SAMPLE assignment: sample <instrument>: <sampleName> [gain=X]
      if (line.startsWith('sample ')) {
        const sm = line.match(/sample\s+(\w+):\s*(.+)/);
        if (sm) {
          const [, instrumentName, rest] = sm;
          const sample = this.parseSampleString(instrumentName, rest);
          if (sample) {
            sampleModules[instrumentName.toLowerCase()] = sample;
          }
        }
        continue;
      }

      // Parse EQ modules
      if (line.startsWith('eq ')) {
        const eqMatch = line.match(/eq\s+(\w+):\s*(.+)/);
        if (eqMatch) {
          const [, moduleName, eqString] = eqMatch;
          const eqModule = this.parseEQString(moduleName, eqString);
          if (eqModule) {
            eqModules[moduleName.toLowerCase()] = eqModule;
          }
        }
        continue;
      }

      // Parse AMP modules
      if (line.startsWith('amp ')) {
        const ampMatch = line.match(/amp\s+(\w+):\s*(.+)/);
        if (ampMatch) {
          const [, moduleName, ampString] = ampMatch;
          const amp = this.parseAmpString(moduleName, ampString);
          if (amp) {
            ampModules[moduleName.toLowerCase()] = amp;
          }
        }
        continue;
      }

      // Parse COMP modules
      if (line.startsWith('comp ')) {
        const compMatch = line.match(/comp\s+(\w+):\s*(.+)/);
        if (compMatch) {
          const [, moduleName, compString] = compMatch;
          const comp = this.parseCompString(moduleName, compString);
          if (comp) {
            compModules[moduleName.toLowerCase()] = comp;
          }
        }
        continue;
      }

      // Parse FILTER modules
      if (line.startsWith('filter ')) {
        const filterMatch = line.match(/filter\s+(\w+):\s*(.+)/);
        if (filterMatch) {
          const [, moduleName, filterString] = filterMatch;
          const filterModule = this.parseFilterString(moduleName, filterString);
          if (filterModule) {
            filterModules[moduleName.toLowerCase()] = filterModule;
          }
        }
        continue;
      }

      // Parse DELAY modules
      if (line.startsWith('delay ')) {
        const delayMatch = line.match(/delay\s+(\w+):\s*(.+)/);
        if (delayMatch) {
          const [, moduleName, delayString] = delayMatch;
          const delayModule = this.parseDelayString(moduleName, delayString);
          if (delayModule) {
            delayModules[moduleName.toLowerCase()] = delayModule;
          }
        }
        continue;
      }

      // Parse REVERB modules
      if (line.startsWith('reverb ')) {
        const reverbMatch = line.match(/reverb\s+(\w+):\s*(.+)/);
        if (reverbMatch) {
          const [, moduleName, reverbString] = reverbMatch;
          const reverbModule = this.parseReverbString(moduleName, reverbString);
          if (reverbModule) {
            reverbModules[moduleName.toLowerCase()] = reverbModule;
          }
        }
        continue;
      }

      // Parse PAN modules
      if (line.startsWith('pan ')) {
        const panMatch = line.match(/pan\s+(\w+):\s*(.+)/);
        if (panMatch) {
          const [, moduleName, panString] = panMatch;
          const panModule = this.parsePanString(moduleName, panString);
          if (panModule) {
            panModules[moduleName.toLowerCase()] = panModule;
          }
        }
        continue;
      }

      // Parse DISTORT modules
      if (line.startsWith('distort ')) {
        const distortMatch = line.match(/distort\s+(\w+):\s*(.+)/);
        if (distortMatch) {
          const [, moduleName, distortString] = distortMatch;
          const distortModule = this.parseDistortString(moduleName, distortString);
          if (distortModule) {
            distortModules[moduleName.toLowerCase()] = distortModule;
          }
        }
        continue;
      }

      // Parse ENVELOPE (ADSR) modules
      if (line.startsWith('env ')) {
        const envMatch = line.match(/env\s+(\w+):\s*(.+)/);
        if (envMatch) {
          const [, moduleName, envString] = envMatch;
          const envModule = this.parseEnvelopeString(moduleName, envString);
          if (envModule) {
            envelopeModules[moduleName.toLowerCase()] = envModule;
          }
        }
        continue;
      }

      // Parse CHORUS modules
      if (line.startsWith('chorus ')) {
        const chorusMatch = line.match(/chorus\s+(\w+):\s*(.+)/);
        if (chorusMatch) {
          const [, moduleName, chorusString] = chorusMatch;
          const chorusModule = this.parseChorusString(moduleName, chorusString);
          if (chorusModule) {
            chorusModules[moduleName.toLowerCase()] = chorusModule;
          }
        }
        continue;
      }

      // Parse PHASER modules
      if (line.startsWith('phaser ')) {
        const phaserMatch = line.match(/phaser\s+(\w+):\s*(.+)/);
        if (phaserMatch) {
          const [, moduleName, phaserString] = phaserMatch;
          const phaserModule = this.parsePhaserString(moduleName, phaserString);
          if (phaserModule) {
            phaserModules[moduleName.toLowerCase()] = phaserModule;
          }
        }
        continue;
      }

      // Parse NOTE (pitch) modules
      if (line.startsWith('note ')) {
        const noteMatch = line.match(/note\s+(\w+):\s*(.+)/);
        if (noteMatch) {
          const [, moduleName, noteString] = noteMatch;
          const noteModule = this.parseNoteString(moduleName, noteString);
          if (noteModule) {
            noteModules[moduleName.toLowerCase()] = noteModule;
          }
        }
        continue;
      }

      // Parse GROOVE modules
      if (line.startsWith('groove ')) {
        const grooveMatch = line.match(/groove\s+(\w+):\s*(.+)/);
        if (grooveMatch) {
          const [, moduleName, grooveString] = grooveMatch;
          const grooveModule = this.parseGrooveString(moduleName, grooveString);
          if (grooveModule) {
            grooveModules[moduleName.toLowerCase()] = grooveModule;
          }
        }
        continue;
      }

      // Parse LFO modules: lfo target: rate=5Hz depth=0.5 wave=sine
      if (line.startsWith('lfo ')) {
        const lfoMatch = line.match(/lfo\s+([^:]+):\s*(.+)/);
        if (lfoMatch) {
          const [, target, lfoString] = lfoMatch;
          const lfo = this.parseLFOString(target, lfoString);
          if (lfo) {
            lfoModules[lfo.key] = lfo;
          }
        }
        continue;
      }

      // Parse instrument sequences
      if (line.startsWith('seq ')) {
        const seqMatch = line.match(/seq\s+(\w+):\s*(.+)/);
        if (seqMatch) {
          const [, instrumentName, patternString] = seqMatch;
          const { steps, velocities } = this.parsePatternString(patternString);

          if (steps.length > 0) {
            const lowerInstrumentName = instrumentName.toLowerCase();
            instruments[lowerInstrumentName] = {
              steps,
              velocities,
              name: lowerInstrumentName
            };
          }
        }
      }
    }

    // Calculate total steps (use the longest pattern or default to 16)
    const totalSteps = Math.max(
      16,
      ...Object.values(instruments).map(inst => inst.steps.length)
    );

    return {
      tempo,
      instruments,
      sampleModules,
      eqModules,
      ampModules,
      compModules,
      filterModules,
      delayModules,
      reverbModules,
      panModules,
      distortModules,
      lfoModules,
      envelopeModules,
      chorusModules,
      phaserModules,
      noteModules,
      grooveModules,
      totalSteps
    };
  }

  /**
   * Parse a pattern string like "x...x..." into boolean array and velocities
   * X = accent (velocity 1.0), x = normal (0.7), o = ghost (0.3), . = rest (0)
   */
  private static parsePatternString(pattern: string): { steps: boolean[]; velocities: number[] } {
    const steps: boolean[] = [];
    const velocities: number[] = [];

    for (const char of pattern) {
      if (char === 'X') {
        steps.push(true);
        velocities.push(1.0);   // accent
      } else if (char === 'x') {
        steps.push(true);
        velocities.push(0.7);   // normal
      } else if (char === 'o') {
        steps.push(true);
        velocities.push(0.3);   // ghost note
      } else if (char === '.') {
        steps.push(false);
        velocities.push(0);
      }
      // Ignore spaces and other characters
    }

    // Limit to max steps
    return {
      steps: steps.slice(0, this.MAX_STEPS),
      velocities: velocities.slice(0, this.MAX_STEPS),
    };
  }

  /**
   * Parse EQ string like "low=2 mid=-1 high=0" into EQModule
   * Any combination of low/mid/high may be provided in any order
   */
  private static parseEQString(moduleName: string, eqString: string): EQModule | null {
    const parts = eqString.trim().split(/\s+/);
    let low = 0;
    let mid = 0;
    let high = 0;
    let hasAny = false;

    for (const part of parts) {
      const match = part.match(/(low|mid|high)\s*=\s*(-?\d+)/i);
      if (match) {
        const [, key, valueStr] = match;
        const value = Math.max(-3, Math.min(3, parseInt(valueStr, 10)));
        if (key.toLowerCase() === 'low') low = value;
        if (key.toLowerCase() === 'mid') mid = value;
        if (key.toLowerCase() === 'high') high = value;
        hasAny = true;
      } else if (/(low|mid|high)\s*=/.test(part)) {
        // Recognized key but invalid value
        return null;
      }
    }

    return hasAny ? { name: moduleName, low, mid, high } : null;
  }

  /**
   * Parse AMP string like "gain=2" into AmpModule (gain is -3..+3)
   */
  private static parseAmpString(moduleName: string, ampString: string): AmpModule | null {
    const m = ampString.match(/gain\s*=\s*(-?\d+)/i);
    if (!m) return null;
    const steps = Math.max(-3, Math.min(3, parseInt(m[1], 10)));
    return { name: moduleName.toLowerCase(), gain: steps };
  }

  /**
   * Parse COMP string like "threshold=-24 ratio=4 attack=0.01 release=0.25 knee=30"
   */
  private static parseCompString(moduleName: string, compString: string): CompModule | null {
    // Extract key=value pairs regardless of order
    const pairs = Array.from(compString.matchAll(/(threshold|ratio|attack|release|knee)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }
    // Defaults
    let threshold = map['threshold'] ?? -24;
    let ratio = map['ratio'] ?? 4;
    let attack = map['attack'] ?? 0.01;
    let release = map['release'] ?? 0.25;
    let knee = map['knee'] ?? 30;

    // Clamp ranges
    threshold = Math.max(-60, Math.min(0, threshold));
    ratio = Math.max(1, Math.min(20, ratio));
    attack = Math.max(0.001, Math.min(0.3, attack));
    release = Math.max(0.02, Math.min(1, release));
    knee = Math.max(0, Math.min(40, knee));

    return {
      name: moduleName.toLowerCase(),
      threshold,
      ratio,
      attack,
      release,
      knee,
    };
  }

  /**
   * Parse SAMPLE string like "kick: snare" OR with options: "kick: snare gain=2"
   */
  private static parseSampleString(moduleName: string, sampleString: string): SampleModule | null {
    // Split by spaces; first token is sample name, rest are key=value
    const parts = sampleString.trim().split(/\s+/);
    if (!parts.length) return null;
    const sampleName = parts[0].toLowerCase();

    let gain: number | undefined = undefined;
    const opts = parts.slice(1).join(' ');
    if (opts) {
      const m = opts.match(/gain\s*=\s*(-?\d+)/i);
      if (m) {
        const steps = Math.max(-3, Math.min(3, parseInt(m[1], 10)));
        gain = steps;
      }
    }

    return {
      name: moduleName.toLowerCase(),
      sample: sampleName,
      gain,
    };
  }

  /**
   * Parse LFO string and target: supports 2-part (name.amp, name.pan) and
   * 3-part (name.filter.freq, name.delay.time) dotted paths.
   * Scope rules: delay targets are master-only, filter and pan are instrument-only, amp works on both.
   */
  private static parseLFOString(target: string, lfoString: string): LFOModule | null {
    const normalizedTarget = target.trim().toLowerCase();
    const parts = normalizedTarget.split('.');
    if (parts.length < 2 || parts.length > 3) return null;

    const name = parts[0];
    if (!name) return null;

    const targetType = parts.slice(1).join('.') as LFOTarget;
    if (!this.VALID_LFO_TARGETS.includes(targetType)) return null;

    // Enforce scope rules
    const scope: 'master' | 'instrument' = name === 'master' ? 'master' : 'instrument';
    if (scope === 'master' && (targetType === 'filter.freq' || targetType === 'filter.q' || targetType === 'pan')) return null;
    if (scope === 'instrument' && (targetType === 'delay.time' || targetType === 'delay.feedback')) return null;

    const pairs = Array.from(lfoString.matchAll(/(rate|depth|wave)\s*=\s*([^\s]+)/gi));
    const map: Record<string, string> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = String(value);
    }

    // rate may have 'Hz' suffix
    let rateHz = 1;
    if (map['rate']) {
      const rateStr = map['rate'].toLowerCase().replace(/hz$/, '');
      const n = parseFloat(rateStr);
      if (!Number.isNaN(n)) rateHz = n;
    }
    rateHz = Math.max(0.1, Math.min(20, rateHz));

    let depth = 0.5;
    if (map['depth']) {
      const n = parseFloat(map['depth']);
      if (!Number.isNaN(n)) depth = n;
    }
    depth = Math.max(0, Math.min(1, depth));

    const wave = ((map['wave'] || 'sine').toLowerCase() as LFOWave);
    const allowed: LFOWave[] = ['sine', 'triangle', 'square', 'sawtooth'];
    const finalWave = allowed.includes(wave) ? wave : 'sine';

    const key = `${name}.${targetType}`;

    return {
      key,
      scope,
      target: targetType,
      name,
      rateHz,
      depth,
      wave: finalWave,
    };
  }

  /**
   * Parse FILTER string like "type=lowpass freq=800 Q=1.0"
   */
  private static parseFilterString(moduleName: string, filterString: string): FilterModule | null {
    const pairs = Array.from(filterString.matchAll(/(type|freq|Q)\s*=\s*([^\s]+)/gi));
    const map: Record<string, string> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = String(value);
    }

    const allowedTypes: FilterType[] = ['lowpass', 'highpass', 'bandpass', 'notch'];
    const type = (map['type']?.toLowerCase() as FilterType) || 'lowpass';
    const finalType = allowedTypes.includes(type) ? type : 'lowpass';

    let freq = map['freq'] ? parseFloat(map['freq']) : 20000;
    if (Number.isNaN(freq)) freq = 20000;
    freq = Math.max(20, Math.min(20000, freq));

    // Q is case-insensitive in matchAll but key is lowered
    let Q = map['q'] ? parseFloat(map['q']) : 1;
    if (Number.isNaN(Q)) Q = 1;
    Q = Math.max(0.1, Math.min(30, Q));

    return { name: moduleName.toLowerCase(), type: finalType, freq, Q };
  }

  /**
   * Parse DELAY string like "time=0.25 feedback=0.4 mix=0.3"
   */
  private static parseDelayString(moduleName: string, delayString: string): DelayModule | null {
    const pairs = Array.from(delayString.matchAll(/(time|feedback|mix)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let time = map['time'] ?? 0.25;
    let feedback = map['feedback'] ?? 0.4;
    let mix = map['mix'] ?? 0.3;

    if (Number.isNaN(time)) time = 0.25;
    if (Number.isNaN(feedback)) feedback = 0.4;
    if (Number.isNaN(mix)) mix = 0.3;

    time = Math.max(0.01, Math.min(2.0, time));
    feedback = Math.max(0, Math.min(0.95, feedback));
    mix = Math.max(0, Math.min(1, mix));

    return { name: moduleName.toLowerCase(), time, feedback, mix };
  }

  /**
   * Parse REVERB string like "mix=0.3 decay=2.5 predelay=0.02"
   */
  private static parseReverbString(moduleName: string, reverbString: string): ReverbModule | null {
    const pairs = Array.from(reverbString.matchAll(/(mix|decay|predelay)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let mix = map['mix'] ?? 0.3;
    let decay = map['decay'] ?? 2.5;
    let predelay = map['predelay'] ?? 0.02;

    if (Number.isNaN(mix)) mix = 0.3;
    if (Number.isNaN(decay)) decay = 2.5;
    if (Number.isNaN(predelay)) predelay = 0.02;

    mix = Math.max(0, Math.min(1, mix));
    decay = Math.max(0.1, Math.min(10, decay));
    predelay = Math.max(0, Math.min(0.1, predelay));

    return { name: moduleName.toLowerCase(), mix, decay, predelay };
  }

  /**
   * Parse PAN string like "0.3" or "value=-0.5"
   * Accepts both bare number and key=value format per DSL spec.
   */
  private static parsePanString(moduleName: string, panString: string): PanModule | null {
    // Try key=value format first
    const m = panString.match(/value\s*=\s*([\-\d\.]+)/i);
    if (m) {
      let value = parseFloat(m[1]);
      if (Number.isNaN(value)) return null;
      value = Math.max(-1, Math.min(1, value));
      return { name: moduleName.toLowerCase(), value };
    }
    // Fall back to bare number (e.g., "pan hihat: 0.3")
    const bare = panString.trim().match(/^([\-\d\.]+)$/);
    if (bare) {
      let value = parseFloat(bare[1]);
      if (Number.isNaN(value)) return null;
      value = Math.max(-1, Math.min(1, value));
      return { name: moduleName.toLowerCase(), value };
    }
    return null;
  }

  /**
   * Parse DISTORT string like "amount=0.5 mix=0.3"
   */
  private static parseDistortString(moduleName: string, distortString: string): DistortModule | null {
    const pairs = Array.from(distortString.matchAll(/(amount|mix)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let amount = map['amount'] ?? 0.5;
    let mix = map['mix'] ?? 0.3;

    if (Number.isNaN(amount)) amount = 0.5;
    if (Number.isNaN(mix)) mix = 0.3;

    amount = Math.max(0, Math.min(1, amount));
    mix = Math.max(0, Math.min(1, mix));

    return { name: moduleName.toLowerCase(), amount, mix };
  }

  /**
   * Parse ENVELOPE string like "attack=0.01 decay=0.1 sustain=0.6 release=0.5"
   */
  private static parseEnvelopeString(moduleName: string, envString: string): EnvelopeModule | null {
    const pairs = Array.from(envString.matchAll(/(attack|decay|sustain|release)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let attack = map['attack'] ?? 0.01;
    let decay = map['decay'] ?? 0.1;
    let sustain = map['sustain'] ?? 0.5;
    let release = map['release'] ?? 0.3;

    if (Number.isNaN(attack)) attack = 0.01;
    if (Number.isNaN(decay)) decay = 0.1;
    if (Number.isNaN(sustain)) sustain = 0.5;
    if (Number.isNaN(release)) release = 0.3;

    attack = Math.max(0.001, Math.min(2.0, attack));
    decay = Math.max(0.001, Math.min(2.0, decay));
    sustain = Math.max(0, Math.min(1, sustain));
    release = Math.max(0.01, Math.min(5.0, release));

    return { name: moduleName.toLowerCase(), attack, decay, sustain, release };
  }

  /**
   * Parse CHORUS string like "rate=1.5 depth=0.4 mix=0.3"
   */
  private static parseChorusString(moduleName: string, chorusString: string): ChorusModule | null {
    const pairs = Array.from(chorusString.matchAll(/(rate|depth|mix)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let rate = map['rate'] ?? 1.5;
    let depth = map['depth'] ?? 0.4;
    let mix = map['mix'] ?? 0.3;

    if (Number.isNaN(rate)) rate = 1.5;
    if (Number.isNaN(depth)) depth = 0.4;
    if (Number.isNaN(mix)) mix = 0.3;

    rate = Math.max(0.1, Math.min(10, rate));
    depth = Math.max(0, Math.min(1, depth));
    mix = Math.max(0, Math.min(1, mix));

    return { name: moduleName.toLowerCase(), rate, depth, mix };
  }

  /**
   * Parse PHASER string like "rate=0.5 depth=0.6 stages=4 mix=0.3"
   */
  private static parsePhaserString(moduleName: string, phaserString: string): PhaserModule | null {
    const pairs = Array.from(phaserString.matchAll(/(rate|depth|stages|mix)\s*=\s*([\-\d\.]+)/gi));
    const map: Record<string, number> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = parseFloat(value);
    }

    let rate = map['rate'] ?? 0.5;
    let depth = map['depth'] ?? 0.6;
    let stages = map['stages'] ?? 4;
    let mix = map['mix'] ?? 0.3;

    if (Number.isNaN(rate)) rate = 0.5;
    if (Number.isNaN(depth)) depth = 0.6;
    if (Number.isNaN(stages)) stages = 4;
    if (Number.isNaN(mix)) mix = 0.3;

    rate = Math.max(0.1, Math.min(10, rate));
    depth = Math.max(0, Math.min(1, depth));
    mix = Math.max(0, Math.min(1, mix));
    // Snap to valid stage counts
    const validStages = [2, 4, 6, 8, 12];
    stages = validStages.reduce((prev, curr) =>
      Math.abs(curr - stages) < Math.abs(prev - stages) ? curr : prev
    );

    return { name: moduleName.toLowerCase(), rate, depth, stages, mix };
  }

  /**
   * Parse NOTE string like "36" (MIDI) or "110hz" (frequency)
   */
  private static parseNoteString(moduleName: string, noteString: string): NoteModule | null {
    const trimmed = noteString.trim().toLowerCase();

    // Check for Hz format: "110hz" or "440.5hz"
    const hzMatch = trimmed.match(/^([\d\.]+)\s*hz$/i);
    if (hzMatch) {
      let freq = parseFloat(hzMatch[1]);
      if (Number.isNaN(freq)) return null;
      freq = Math.max(20, Math.min(20000, freq));
      return { name: moduleName.toLowerCase(), pitch: freq };
    }

    // Otherwise treat as MIDI note number
    const midi = parseInt(trimmed, 10);
    if (Number.isNaN(midi)) return null;
    const clampedMidi = Math.max(0, Math.min(127, midi));
    // Convert MIDI to Hz: f = 440 * 2^((n-69)/12)
    const freq = 440 * Math.pow(2, (clampedMidi - 69) / 12);
    return { name: moduleName.toLowerCase(), pitch: freq };
  }

  /**
   * Parse GROOVE string like "type=swing amount=0.5"
   */
  private static parseGrooveString(moduleName: string, grooveString: string): any {
    const pairs = Array.from(grooveString.matchAll(/(type|amount|steps|subdivision|name)\s*=\s*([^\s]+)/gi));
    const map: Record<string, string> = {};
    for (const [, key, value] of pairs as any) {
      map[key.toLowerCase()] = String(value);
    }

    const typeStr = map['type']?.toLowerCase();
    const allowedTypes = ['swing', 'humanize', 'rush', 'drag', 'template'];
    const type = (allowedTypes.includes(typeStr) ? typeStr : 'swing') as 'swing' | 'humanize' | 'rush' | 'drag' | 'template';

    let amount = parseFloat(map['amount']);
    if (Number.isNaN(amount)) amount = 0.5;
    amount = Math.max(0, Math.min(1, amount));

    const steps = map['steps']?.toLowerCase();

    // Normalize subdivision values
    let subdivision: '4n' | '8n' | '16n' | undefined;
    const rawSubdiv = map['subdivision']?.toLowerCase();
    if (rawSubdiv) {
      const subdivMap: Record<string, '4n' | '8n' | '16n'> = {
        '4n': '4n', '4': '4n', 'quarter': '4n',
        '8n': '8n', '8': '8n', 'eighth': '8n',
        '16n': '16n', '16': '16n', 'sixteenth': '16n',
      };
      subdivision = subdivMap[rawSubdiv];
    }
    const templateName = type === 'template' ? map['name']?.toLowerCase() : undefined;

    return {
      name: moduleName.toLowerCase(),
      type,
      amount,
      steps,
      subdivision,
      ...(templateName && { templateName })
    };
  }

  /**
   * Validate a pattern string with detailed error reporting
   */
  static validate(pattern: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validInstruments: string[];
    invalidInstruments: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validInstruments: string[] = [];
    const invalidInstruments: string[] = [];

    if (!pattern.trim()) {
      return {
        isValid: false,
        errors: ['Pattern cannot be empty'],
        warnings: [],
        validInstruments: [],
        invalidInstruments: []
      };
    }

    const lines = pattern.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let hasValidSequence = false;
    let hasTempo = false;

    for (const line of lines) {
      // Check tempo format
      if (line.startsWith('TEMPO ')) {
        hasTempo = true;
        const tempoMatch = line.match(/TEMPO\s+(\d+)/);
        if (!tempoMatch) {
          errors.push('Invalid tempo format. Use: TEMPO 120');
        } else {
          const tempo = parseInt(tempoMatch[1], 10);
          if (tempo < 60 || tempo > 200) {
            errors.push('Tempo must be between 60 and 200 BPM');
          }
        }
        continue;
      }

      // Check SAMPLE format
      if (line.startsWith('sample ')) {
        const sm = line.match(/sample\s+(\w+):\s*(.+)/);
        if (!sm) {
          errors.push(`Invalid sample format: ${line}. Use: sample <instrument>: <sampleName> [gain=X]`);
        } else {
          const [, instrumentName, rest] = sm;
          const sample = this.parseSampleString(instrumentName, rest);
          if (!sample) {
            errors.push(`Invalid sample assignment for ${instrumentName}.`);
          }
        }
        continue;
      }

      // Check EQ format
      if (line.startsWith('eq ')) {
        const eqMatch = line.match(/eq\s+(\w+):\s*(.+)/);
        if (!eqMatch) {
          errors.push(`Invalid EQ format: ${line}. Use: eq name: low=X mid=Y high=Z (any combination)`);
        } else {
          const [, moduleName, eqString] = eqMatch;
          const eqModule = this.parseEQString(moduleName, eqString);
          if (!eqModule) {
            errors.push(`Invalid EQ values for ${moduleName}. Use any of low=X mid=Y high=Z (range: -3 to +3)`);
          }
        }
        continue;
      }
      // Check AMP format (simple)
      if (line.startsWith('amp ')) {
        const ampMatch = line.match(/amp\s+(\w+):\s*(.+)/);
        if (!ampMatch) {
          errors.push(`Invalid amp format: ${line}. Use: amp name: gain=X (range: -3 to +3)`);
        } else {
          const [, moduleName, ampString] = ampMatch;
          const amp = this.parseAmpString(moduleName, ampString);
          if (!amp) {
            errors.push(`Invalid amp values for ${moduleName}. Use: gain=X (range: -3 to +3)`);
          }
        }
        continue;
      }

      // Check COMP format (lenient)
      if (line.startsWith('comp ')) {
        const compMatch = line.match(/comp\s+(\w+):\s*(.+)/);
        if (!compMatch) {
          errors.push(`Invalid comp format: ${line}. Use: comp name: threshold=-24 ratio=4 attack=0.01 release=0.25 knee=30`);
        } else {
          const [, moduleName, compString] = compMatch;
          const comp = this.parseCompString(moduleName, compString);
          if (!comp) {
            errors.push(`Invalid comp values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check LFO format
      if (line.startsWith('lfo ')) {
        const lfoMatch = line.match(/lfo\s+([^:]+):\s*(.+)/);
        if (!lfoMatch) {
          errors.push(`Invalid lfo format: ${line}. Use: lfo name.<target>: rate=1Hz depth=0.5 wave=sine`);
        } else {
          const [, target, lfoString] = lfoMatch;
          const lfo = this.parseLFOString(target, lfoString);
          if (!lfo) {
            errors.push(`Invalid lfo target or values for ${target.trim()}. Valid targets: amp, filter.freq, filter.q, pan (instrument only), delay.time, delay.feedback (master only). Use: lfo name.<target>: rate=1Hz depth=0.5 wave=sine`);
          }
        }
        continue;
      }

      // Check FILTER format
      if (line.startsWith('filter ')) {
        const filterMatch = line.match(/filter\s+(\w+):\s*(.+)/);
        if (!filterMatch) {
          errors.push(`Invalid filter format: ${line}. Use: filter name: type=lowpass freq=800 Q=1.0`);
        } else {
          const [, moduleName, filterString] = filterMatch;
          const filterModule = this.parseFilterString(moduleName, filterString);
          if (!filterModule) {
            errors.push(`Invalid filter values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check DELAY format
      if (line.startsWith('delay ')) {
        const delayMatch = line.match(/delay\s+(\w+):\s*(.+)/);
        if (!delayMatch) {
          errors.push(`Invalid delay format: ${line}. Use: delay name: time=0.25 feedback=0.4 mix=0.3`);
        } else {
          const [, moduleName, delayString] = delayMatch;
          const delayModule = this.parseDelayString(moduleName, delayString);
          if (!delayModule) {
            errors.push(`Invalid delay values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check REVERB format
      if (line.startsWith('reverb ')) {
        const reverbMatch = line.match(/reverb\s+(\w+):\s*(.+)/);
        if (!reverbMatch) {
          errors.push(`Invalid reverb format: ${line}. Use: reverb name: mix=0.3 decay=2.5 predelay=0.02`);
        } else {
          const [, moduleName, reverbString] = reverbMatch;
          const reverbModule = this.parseReverbString(moduleName, reverbString);
          if (!reverbModule) {
            errors.push(`Invalid reverb values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check PAN format
      if (line.startsWith('pan ')) {
        const panMatch = line.match(/pan\s+(\w+):\s*(.+)/);
        if (!panMatch) {
          errors.push(`Invalid pan format: ${line}. Use: pan name: <-1..1>`);
        } else {
          const [, moduleName, panString] = panMatch;
          const panModule = this.parsePanString(moduleName, panString);
          if (!panModule) {
            errors.push(`Invalid pan values for ${moduleName}. Use: pan name: <value> (range: -1 to 1)`);
          }
        }
        continue;
      }

      // Check DISTORT format
      if (line.startsWith('distort ')) {
        const distortMatch = line.match(/distort\s+(\w+):\s*(.+)/);
        if (!distortMatch) {
          errors.push(`Invalid distort format: ${line}. Use: distort name: amount=0.5 mix=0.3`);
        } else {
          const [, moduleName, distortString] = distortMatch;
          const distortModule = this.parseDistortString(moduleName, distortString);
          if (!distortModule) {
            errors.push(`Invalid distort values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check ENV format
      if (line.startsWith('env ')) {
        const envMatch = line.match(/env\s+(\w+):\s*(.+)/);
        if (!envMatch) {
          errors.push(`Invalid env format: ${line}. Use: env name: attack=0.01 decay=0.1 sustain=0.5 release=0.3`);
        } else {
          const [, moduleName, envString] = envMatch;
          const envModule = this.parseEnvelopeString(moduleName, envString);
          if (!envModule) {
            errors.push(`Invalid env values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check CHORUS format
      if (line.startsWith('chorus ')) {
        const chorusMatch = line.match(/chorus\s+(\w+):\s*(.+)/);
        if (!chorusMatch) {
          errors.push(`Invalid chorus format: ${line}. Use: chorus name: rate=1.5 depth=0.4 mix=0.3`);
        } else {
          const [, moduleName, chorusString] = chorusMatch;
          const chorusModule = this.parseChorusString(moduleName, chorusString);
          if (!chorusModule) {
            errors.push(`Invalid chorus values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check PHASER format
      if (line.startsWith('phaser ')) {
        const phaserMatch = line.match(/phaser\s+(\w+):\s*(.+)/);
        if (!phaserMatch) {
          errors.push(`Invalid phaser format: ${line}. Use: phaser name: rate=0.5 depth=0.6 stages=4 mix=0.3`);
        } else {
          const [, moduleName, phaserString] = phaserMatch;
          const phaserModule = this.parsePhaserString(moduleName, phaserString);
          if (!phaserModule) {
            errors.push(`Invalid phaser values for ${moduleName}`);
          }
        }
        continue;
      }

      // Check NOTE format
      if (line.startsWith('note ')) {
        const noteMatch = line.match(/note\s+(\w+):\s*(.+)/);
        if (!noteMatch) {
          errors.push(`Invalid note format: ${line}. Use: note name: 60 (MIDI) or note name: 440hz`);
        } else {
          const [, moduleName, noteString] = noteMatch;
          const noteModule = this.parseNoteString(moduleName, noteString);
          if (!noteModule) {
            errors.push(`Invalid note value for ${moduleName}. Use MIDI note (0-127) or frequency (e.g. 440hz)`);
          }
        }
        continue;
      }

      // Check GROOVE format
      if (line.startsWith('groove ')) {
        const grooveMatch = line.match(/groove\s+(\w+):\s*(.+)/);
        if (!grooveMatch) {
          errors.push(`Invalid groove format: ${line}. Use: groove name: type=swing amount=0.5`);
        } else {
          const [, moduleName, grooveString] = grooveMatch;
          const grooveModule = this.parseGrooveString(moduleName, grooveString);
          if (!grooveModule) {
            errors.push(`Invalid groove values for ${moduleName}. Types: swing, humanize, rush, drag. Amount: 0-1.`);
          }
        }
        continue;
      }

      // Check sequence format
      if (line.startsWith('seq ')) {
        const seqMatch = line.match(/seq\s+(\w+):\s*(.+)/);
        if (!seqMatch) {
          errors.push(`Invalid sequence format: ${line}`);
          invalidInstruments.push('unknown');
        } else {
          const [, instrumentName, patternString] = seqMatch;
          if (!/^[xXo.\s]+$/.test(patternString)) {
            errors.push(`Invalid pattern characters in ${instrumentName}. Use only 'x', 'X', 'o', and '.'`);
            invalidInstruments.push(instrumentName);
          } else {
            hasValidSequence = true;
            validInstruments.push(instrumentName);

            // Add warnings for potentially problematic patterns
            const stepCount = patternString.replace(/\s/g, '').length;
            if (stepCount < 4) {
              warnings.push(`${instrumentName} has very few steps (${stepCount}). Consider adding more steps.`);
            }
            if (stepCount > 32) {
              warnings.push(`${instrumentName} has many steps (${stepCount}). This may be hard to follow.`);
            }
          }
        }
      }
    }

    if (!hasTempo) {
      warnings.push('No tempo specified. Using default tempo of 120 BPM.');
    }

    if (!hasValidSequence) {
      errors.push('At least one valid sequence is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validInstruments,
      invalidInstruments
    };
  }

  /**
   * Parse a pattern with partial validation - returns what can be parsed
   */
  static parsePartial(pattern: string): {
    parsed: ParsedPattern | null;
    errors: string[];
    warnings: string[];
    validInstruments: string[];
  } {
    const validation = this.validate(pattern);
    const validInstruments = validation.validInstruments;

    if (validation.errors.length > 0) {
      return {
        parsed: null,
        errors: validation.errors,
        warnings: validation.warnings,
        validInstruments
      };
    }

    try {
      const parsed = this.parse(pattern);
      return {
        parsed,
        errors: [],
        warnings: validation.warnings,
        validInstruments
      };
    } catch (error) {
      return {
        parsed: null,
        errors: ['Failed to parse pattern: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings: validation.warnings,
        validInstruments
      };
    }
  }
}
