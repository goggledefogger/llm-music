// Basic pattern parser for ASCII Generative Sequencer
import { ParsedPattern, EQModule, AmpModule, CompModule, LFOModule, LFOWave, SampleModule } from '../types/app';

export class PatternParser {
  private static readonly DEFAULT_TEMPO = 120;
  private static readonly MAX_STEPS = 32;

  /**
   * Parse a simple ASCII pattern into a structured format
   * Phase 1: Very basic parsing - just tempo and simple sequences
   */
  static parse(pattern: string): ParsedPattern {
    const lines = pattern.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let tempo = this.DEFAULT_TEMPO;
    const instruments: ParsedPattern['instruments'] = {};
    const eqModules: ParsedPattern['eqModules'] = {};
    const sampleModules: ParsedPattern['sampleModules'] = {};
    const ampModules: ParsedPattern['ampModules'] = {};
    const compModules: ParsedPattern['compModules'] = {};
    const lfoModules: ParsedPattern['lfoModules'] = {};

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
          const steps = this.parsePatternString(patternString);

          if (steps.length > 0) {
            instruments[instrumentName] = {
              steps,
              name: instrumentName
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
      lfoModules,
      totalSteps
    };
  }

  /**
   * Parse a pattern string like "x...x..." into boolean array
   */
  private static parsePatternString(pattern: string): boolean[] {
    const steps: boolean[] = [];

    for (const char of pattern) {
      if (char === 'x' || char === 'X') {
        steps.push(true);
      } else if (char === '.') {
        steps.push(false);
      }
      // Ignore spaces and other characters
    }

    // Limit to max steps
    return steps.slice(0, this.MAX_STEPS);
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
   * Parse LFO string and target: target like 'master.amp' or 'kick.amp'
   */
  private static parseLFOString(target: string, lfoString: string): LFOModule | null {
    const normalizedTarget = target.trim().toLowerCase();
    const [nameRaw, targetTypeRaw] = normalizedTarget.split('.') as [string, string];
    if (!nameRaw || !targetTypeRaw) return null;
    const name = nameRaw;
    const targetType = targetTypeRaw as 'amp';
    if (targetType !== 'amp') return null; // currently only amp LFO supported

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

    const scope: 'master' | 'instrument' = name === 'master' ? 'master' : 'instrument';
    const key = `${name}.${targetType}`;

    return {
      key,
      scope,
      target: 'amp',
      name,
      rateHz,
      depth,
      wave: finalWave,
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
          errors.push(`Invalid lfo format: ${line}. Use: lfo name.amp: rate=1Hz depth=0.5 wave=sine`);
        } else {
          const [, target, lfoString] = lfoMatch;
          const lfo = this.parseLFOString(target, lfoString);
          if (!lfo) {
            errors.push(`Invalid lfo values for ${target}. Use: lfo name.amp: rate=1Hz depth=0.5 wave=sine`);
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
          if (!/^[xX.\s]+$/.test(patternString)) {
            errors.push(`Invalid pattern characters in ${instrumentName}. Use only 'x' and '.'`);
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
