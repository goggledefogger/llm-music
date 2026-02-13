import { describe, it, expect } from 'vitest';
import {
  GROOVE_PRESETS,
  getGrooveTemplate,
  getGrooveTemplateNames,
  getGrooveTemplatesByCategory,
  applyGrooveTemplate,
} from './groovePresets';

describe('Groove Presets', () => {
  describe('GROOVE_PRESETS library', () => {
    it('should contain all expected presets', () => {
      const names = getGrooveTemplateNames();
      expect(names).toContain('mpc-swing-54');
      expect(names).toContain('mpc-swing-58');
      expect(names).toContain('mpc-swing-62');
      expect(names).toContain('mpc-swing-66');
      expect(names).toContain('mpc-swing-71');
      expect(names).toContain('bossa-nova');
      expect(names).toContain('son-clave-3-2');
      expect(names).toContain('rumba-clave-3-2');
      expect(names).toContain('afrobeat-12-8');
      expect(names).toContain('reggae-one-drop');
      expect(names).toContain('second-line');
      expect(names).toContain('go-go-swing');
      expect(names).toContain('dilla-feel');
    });

    it('should have 13 presets total', () => {
      expect(getGrooveTemplateNames().length).toBe(13);
    });
  });

  describe('getGrooveTemplate', () => {
    it('should return a template by name', () => {
      const template = getGrooveTemplate('mpc-swing-66');
      expect(template).toBeDefined();
      expect(template!.name).toBe('mpc-swing-66');
      expect(template!.category).toBe('swing');
    });

    it('should return undefined for unknown name', () => {
      expect(getGrooveTemplate('nonexistent')).toBeUndefined();
    });
  });

  describe('getGrooveTemplatesByCategory', () => {
    it('should return swing presets', () => {
      const swingPresets = getGrooveTemplatesByCategory('swing');
      expect(swingPresets.length).toBe(5);
      swingPresets.forEach(p => expect(p.category).toBe('swing'));
    });

    it('should return latin presets', () => {
      const latinPresets = getGrooveTemplatesByCategory('latin');
      expect(latinPresets.length).toBe(3);
    });

    it('should return funk presets', () => {
      const funkPresets = getGrooveTemplatesByCategory('funk');
      expect(funkPresets.length).toBe(3);
    });

    it('should return empty array for unused category', () => {
      const otherPresets = getGrooveTemplatesByCategory('other');
      expect(otherPresets.length).toBe(0);
    });
  });

  describe('Template data integrity', () => {
    it('all templates should have valid offset ranges (-0.5 to 0.5)', () => {
      for (const [, template] of Object.entries(GROOVE_PRESETS)) {
        for (let i = 0; i < template.offsets.length; i++) {
          expect(template.offsets[i]).toBeGreaterThanOrEqual(-0.5);
          expect(template.offsets[i]).toBeLessThanOrEqual(0.5);
        }
      }
    });

    it('all templates should have non-empty offsets', () => {
      for (const template of Object.values(GROOVE_PRESETS)) {
        expect(template.offsets.length).toBeGreaterThan(0);
      }
    });

    it('velocity arrays should match offset array length when present', () => {
      for (const template of Object.values(GROOVE_PRESETS)) {
        if (template.velocities) {
          expect(template.velocities.length).toBe(template.offsets.length);
        }
      }
    });

    it('velocity values should be in range 0 to 2', () => {
      for (const template of Object.values(GROOVE_PRESETS)) {
        if (template.velocities) {
          for (const vel of template.velocities) {
            expect(vel).toBeGreaterThanOrEqual(0);
            expect(vel).toBeLessThanOrEqual(2);
          }
        }
      }
    });

    it('tempo ranges should be valid when present', () => {
      for (const template of Object.values(GROOVE_PRESETS)) {
        if (template.tempoRange) {
          expect(template.tempoRange.min).toBeLessThan(template.tempoRange.max);
          expect(template.tempoRange.min).toBeGreaterThanOrEqual(60);
          expect(template.tempoRange.max).toBeLessThanOrEqual(200);
        }
      }
    });
  });

  describe('MPC swing presets', () => {
    it('MPC swing 54% should have correct offset', () => {
      const t = getGrooveTemplate('mpc-swing-54')!;
      expect(t.offsets).toEqual([0, 0.04]);
    });

    it('MPC swing 66% should have correct offset', () => {
      const t = getGrooveTemplate('mpc-swing-66')!;
      expect(t.offsets).toEqual([0, 0.16]);
    });

    it('MPC swing 71% should have correct offset', () => {
      const t = getGrooveTemplate('mpc-swing-71')!;
      expect(t.offsets).toEqual([0, 0.21]);
    });

    it('swing offsets should increase with percentage', () => {
      const s54 = getGrooveTemplate('mpc-swing-54')!;
      const s58 = getGrooveTemplate('mpc-swing-58')!;
      const s62 = getGrooveTemplate('mpc-swing-62')!;
      const s66 = getGrooveTemplate('mpc-swing-66')!;
      const s71 = getGrooveTemplate('mpc-swing-71')!;
      expect(s54.offsets[1]).toBeLessThan(s58.offsets[1]);
      expect(s58.offsets[1]).toBeLessThan(s62.offsets[1]);
      expect(s62.offsets[1]).toBeLessThan(s66.offsets[1]);
      expect(s66.offsets[1]).toBeLessThan(s71.offsets[1]);
    });
  });

  describe('applyGrooveTemplate', () => {
    it('should return zero offset when amount is 0', () => {
      const template = getGrooveTemplate('mpc-swing-66')!;
      const result = applyGrooveTemplate(template, 1, 0);
      expect(result.timingOffset).toBe(0);
      expect(result.velocityScale).toBe(1.0);
    });

    it('should return full offset when amount is 1', () => {
      const template = getGrooveTemplate('mpc-swing-66')!;
      const result = applyGrooveTemplate(template, 1, 1);
      expect(result.timingOffset).toBe(0.16);
      expect(result.velocityScale).toBe(1.0); // no velocity array for MPC swing
    });

    it('should scale offset by amount', () => {
      const template = getGrooveTemplate('mpc-swing-66')!;
      const result = applyGrooveTemplate(template, 1, 0.5);
      expect(result.timingOffset).toBeCloseTo(0.08, 5);
    });

    it('should cycle offsets for steps beyond array length', () => {
      const template = getGrooveTemplate('mpc-swing-66')!;
      // offsets length is 2, so step 3 maps to index 1
      const result = applyGrooveTemplate(template, 3, 1);
      expect(result.timingOffset).toBe(0.16);
    });

    it('should apply velocity scaling with amount', () => {
      const template = getGrooveTemplate('bossa-nova')!;
      // step 0 has velocity 1.1
      const result = applyGrooveTemplate(template, 0, 1);
      expect(result.velocityScale).toBeCloseTo(1.1, 5);
    });

    it('should blend velocity toward 1.0 with lower amount', () => {
      const template = getGrooveTemplate('bossa-nova')!;
      // step 0 velocity is 1.1, at amount=0.5 should be 1.0 + (1.1-1.0)*0.5 = 1.05
      const result = applyGrooveTemplate(template, 0, 0.5);
      expect(result.velocityScale).toBeCloseTo(1.05, 5);
    });

    it('should return 1.0 velocity scale for templates without velocities', () => {
      const template = getGrooveTemplate('mpc-swing-66')!;
      expect(template.velocities).toBeUndefined();
      const result = applyGrooveTemplate(template, 0, 1);
      expect(result.velocityScale).toBe(1.0);
    });
  });
});
