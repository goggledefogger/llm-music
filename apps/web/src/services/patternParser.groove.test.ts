import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';

describe('PatternParser - Groove & Comments', () => {
  describe('Groove Parsing', () => {
    it('should parse master swing', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules).toBeDefined();
      expect(result.grooveModules?.master).toEqual({
        name: 'master',
        type: 'swing',
        amount: 0.5
      });
    });

    it('should parse instrument specific groove', () => {
      const pattern = `TEMPO 120
groove hihat: type=humanize amount=0.3
seq hihat: x.x.x.x.`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.hihat).toEqual({
        name: 'hihat',
        type: 'humanize',
        amount: 0.3
      });
    });

    it('should handle partial groove commands', () => {
      const pattern = `TEMPO 120
groove master: amount=0.7
seq kick: x...`;
      // Default type is swing
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master).toEqual({
        name: 'master',
        type: 'swing',
        amount: 0.7
      });
    });

    it('should clamp amount values', () => {
      const pattern = `TEMPO 120
groove kick: type=rush amount=1.5
seq kick: x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.kick.amount).toBe(1);
    });

    it('should parse template groove with name', () => {
      const pattern = `TEMPO 120
groove master: type=template name=bossa-nova amount=0.8
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master).toEqual({
        name: 'master',
        type: 'template',
        amount: 0.8,
        templateName: 'bossa-nova'
      });
    });

    it('should parse template groove with MPC swing preset', () => {
      const pattern = `TEMPO 120
groove hihat: type=template name=mpc-swing-66 amount=0.7
seq hihat: x.x.x.x.`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.hihat).toEqual({
        name: 'hihat',
        type: 'template',
        amount: 0.7,
        templateName: 'mpc-swing-66'
      });
    });

    it('should not include templateName for non-template types', () => {
      const pattern = `TEMPO 120
groove master: type=swing name=bossa-nova amount=0.5
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.type).toBe('swing');
      expect(result.grooveModules?.master).not.toHaveProperty('templateName');
    });
  });

  describe('Subdivision Parsing', () => {
    it('should parse subdivision=8n correctly', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=8n
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('8n');
    });

    it('should parse subdivision=16n correctly', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=16n
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('16n');
    });

    it('should parse subdivision=4n correctly', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=4n
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('4n');
    });

    it('should normalize subdivision=8 to 8n', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=8
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('8n');
    });

    it('should normalize subdivision=quarter to 4n', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=quarter
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('4n');
    });

    it('should normalize subdivision=sixteenth to 16n', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 subdivision=sixteenth
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBe('16n');
    });

    it('should leave subdivision undefined when not specified', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.subdivision).toBeUndefined();
    });
  });

  describe('Comment Stripping', () => {
    it('should ignore full line comments with #', () => {
      const pattern = `TEMPO 120
# This is a comment
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.instruments.kick).toBeDefined();
    });

    it('should ignore full line comments with //', () => {
      const pattern = `TEMPO 120
// This is also a comment
seq kick: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.instruments.kick).toBeDefined();
    });

    it('should strip inline comments with #', () => {
      const pattern = `TEMPO 120
seq kick: x...x... # simple beat`;
      const result = PatternParser.parse(pattern);
      expect(result.instruments.kick.steps).toEqual([true, false, false, false, true, false, false, false]);
    });

    it('should strip inline comments with //', () => {
      const pattern = `TEMPO 120
groove master: type=swing amount=0.5 // classic swing`;
      const result = PatternParser.parse(pattern);
      expect(result.grooveModules?.master.amount).toBe(0.5);
    });

    it('should handle mixed comments', () => {
      const pattern = `TEMPO 120 # Main tempo
// Bassline
seq bass: x...x... // root notes`;
      const result = PatternParser.parse(pattern);
      expect(result.tempo).toBe(120);
      expect(result.instruments.bass).toBeDefined();
    });
  });
});
