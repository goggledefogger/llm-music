/**
 * Groove preset library — named timing templates for the groove DSL.
 *
 * Each template provides per-step timing offsets (as fractions of a step
 * interval) that repeat cyclically.  The `amount` parameter in the DSL
 * scales these offsets linearly (0 = straight, 1 = full template feel).
 *
 * Offset convention:
 *   positive = late / behind the beat (drag, swing)
 *   negative = early / ahead of the beat (rush, push)
 *   0        = on the grid
 *
 * Velocity multipliers (optional) adjust hit strength per step.
 * 1.0 = unchanged, >1 = accent, <1 = ghost.
 */

import { GrooveTemplate, GroovePresetLibrary } from '../types/app';

// ---------------------------------------------------------------------------
// MPC-style swing presets
// ---------------------------------------------------------------------------
// MPC swing percentages shift every other 16th note (offbeat / even-indexed
// in a 0-based 16th-note grid).  A "50%" swing is perfectly straight; higher
// values push the offbeat later.  The offset fraction for a given percentage
// is: (pct/100 - 0.5) * 2 * 0.5  =  (pct - 50) / 100
//
// For a 16-step pattern the cycle is 2 steps: [0, offset].

function mpcSwing(pct: number, label: string): GrooveTemplate {
  const offset = (pct - 50) / 100;
  return {
    name: `mpc-swing-${pct}`,
    label,
    category: 'swing',
    description: `MPC-style ${pct}% swing — offbeats delayed by ${Math.round(offset * 100)}% of a step`,
    offsets: [0, offset],
    tempoRange: { min: 70, max: 140 },
  };
}

// ---------------------------------------------------------------------------
// Latin groove presets
// ---------------------------------------------------------------------------

/**
 * Bossa nova — characteristic 16th-note pattern with subtle push-pull feel.
 * Based on the classic João Gilberto guitar pattern interpreted on a 16-step
 * grid.  Accents on the "and" of beat 2 and beat 4 give the signature lilt.
 * 8-step cycle (repeats twice per bar in 16-step mode).
 */
const bossaNova: GrooveTemplate = {
  name: 'bossa-nova',
  label: 'Bossa Nova',
  category: 'latin',
  description: 'Classic bossa nova feel with subtle push on offbeats',
  //                step:  1     e     &     a     2     e     &     a
  offsets:              [  0,    0.05, -0.03, 0,    0,    0.08, -0.02, 0.04 ],
  velocities:           [  1.1,  0.7,   0.9,  0.6,  1.0,  0.7,   1.2,   0.6 ],
  tempoRange: { min: 110, max: 150 },
};

/**
 * Son clave 3-2 — the foundational Afro-Cuban rhythmic pattern.
 * 16-step cycle.  Offsets create the characteristic "in the cracks" feel
 * between straight and triplet timing.
 */
const sonClave32: GrooveTemplate = {
  name: 'son-clave-3-2',
  label: 'Son Clave 3-2',
  category: 'latin',
  description: 'Afro-Cuban son clave 3-2 feel with micro-timing offsets',
  // 16 steps — one full bar.
  // Clave hits on steps 0, 3, 6, 10, 12 (0-indexed) get slight push/pull.
  offsets: [
    0,      0,     0,     0.06,   // beat 1: clave on 0, pull 3 late
    0,      0,    -0.04,  0,      // beat 2: push 6 early
    0,      0,     0.05,  0,      // beat 3: pull 10 late
    -0.03,  0,     0,     0,      // beat 4: push 12 early
  ],
  velocities: [
    1.2, 0.6, 0.7, 1.1,
    0.6, 0.7, 1.2, 0.6,
    0.7, 0.6, 1.1, 0.7,
    1.2, 0.6, 0.7, 0.6,
  ],
  tempoRange: { min: 90, max: 130 },
};

/**
 * Rumba clave 3-2 — variant with the third hit shifted one 16th later
 * compared to son clave.  Creates a more syncopated, "in the crack" feel.
 */
const rumbaClave32: GrooveTemplate = {
  name: 'rumba-clave-3-2',
  label: 'Rumba Clave 3-2',
  category: 'latin',
  description: 'Rumba clave 3-2 with deeper syncopation offsets',
  offsets: [
    0,      0,     0,     0.06,
    0,      0,     0,    -0.04,   // shifted from son clave — hit on 7 instead of 6
    0,      0,     0.05,  0,
    -0.03,  0,     0,     0,
  ],
  velocities: [
    1.2, 0.6, 0.7, 1.1,
    0.6, 0.7, 0.6, 1.2,
    0.7, 0.6, 1.1, 0.7,
    1.2, 0.6, 0.7, 0.6,
  ],
  tempoRange: { min: 90, max: 130 },
};

// ---------------------------------------------------------------------------
// African-derived grooves
// ---------------------------------------------------------------------------

/**
 * Afrobeat 12/8 — maps a 12/8 triplet feel onto the 16-step grid.
 * Every third 16th note is pushed slightly late to approximate triplet
 * groupings, creating the signature "rolling" Afrobeat feel (Fela Kuti style).
 * 4-step repeating cycle.
 */
const afrobeat128: GrooveTemplate = {
  name: 'afrobeat-12-8',
  label: 'Afrobeat 12/8',
  category: 'african',
  description: 'Afrobeat triplet feel mapped to 16-step grid',
  // 4-step cycle: downbeat, straight, pushed-late, straight
  offsets:     [0, 0, 0.20, 0],
  velocities:  [1.1, 0.8, 0.9, 0.7],
  tempoRange: { min: 100, max: 140 },
};

// ---------------------------------------------------------------------------
// Reggae grooves
// ---------------------------------------------------------------------------

/**
 * Reggae one-drop — the classic roots reggae feel.  Kick and snare land on
 * beat 3 with everything slightly behind the beat (dragged).  The skank
 * (offbeat chords) get a subtle push for tension.
 * 8-step cycle.
 */
const reggaeOneDrop: GrooveTemplate = {
  name: 'reggae-one-drop',
  label: 'Reggae One Drop',
  category: 'reggae',
  description: 'Roots reggae one-drop feel — behind the beat with offbeat push',
  //               step:  1     e     &     a     2     e     &     a
  offsets:            [  0.04,  0,   -0.03, 0.02,  0.04, 0,   -0.03, 0.02 ],
  velocities:         [  1.0,   0.6,  1.1,  0.5,   1.2,  0.6,  1.1,  0.5 ],
  tempoRange: { min: 65, max: 95 },
};

// ---------------------------------------------------------------------------
// Funk / New Orleans grooves
// ---------------------------------------------------------------------------

/**
 * New Orleans second line — the bouncing parade-beat feel.
 * Characterized by a triplet-influenced "bounce" with strong accents on
 * the "and" of beat 2 and the downbeat of beat 4.
 * 16-step cycle.
 */
const secondLine: GrooveTemplate = {
  name: 'second-line',
  label: 'New Orleans Second Line',
  category: 'funk',
  description: 'New Orleans parade bounce with triplet-influenced timing',
  offsets: [
     0,     0.04,  0.15,  0,      // beat 1: triplet push on "a"
     0,     0.04,  0.15,  0,      // beat 2: same bounce
     0,     0.04,  0.15,  0,      // beat 3
     0,     0.04,  0.15,  0,      // beat 4
  ],
  velocities: [
    1.2, 0.7, 0.9, 0.6,
    1.0, 0.7, 1.1, 0.6,
    1.2, 0.7, 0.9, 0.6,
    1.1, 0.7, 1.0, 0.6,
  ],
  tempoRange: { min: 100, max: 140 },
};

/**
 * Go-go swing — the Washington D.C. go-go feel.
 * Conga-driven bounce with a strong pocket between straight and swung 16ths.
 * 4-step cycle with alternating push-pull.
 */
const goGoSwing: GrooveTemplate = {
  name: 'go-go-swing',
  label: 'Go-Go Swing',
  category: 'funk',
  description: 'D.C. go-go bounce with conga-driven pocket feel',
  offsets:     [0, 0.10, 0, 0.08],
  velocities:  [1.1, 0.8, 1.0, 0.9],
  tempoRange: { min: 100, max: 130 },
};

/**
 * J Dilla / lo-fi hip hop — the "drunk" or "human" feel made famous by
 * J Dilla's MPC work.  Nearly every hit is slightly off-grid in different
 * directions, creating a loose, organic pocket.
 * 4-step cycle.
 */
const dillaFeel: GrooveTemplate = {
  name: 'dilla-feel',
  label: 'J Dilla Feel',
  category: 'funk',
  description: 'Loose, "drunk" MPC timing with push-pull on every hit',
  offsets:     [0.02, -0.04, 0.06, -0.02],
  velocities:  [1.0, 0.85, 0.95, 0.8],
  tempoRange: { min: 70, max: 100 },
};

// ---------------------------------------------------------------------------
// Build the preset library
// ---------------------------------------------------------------------------

const allPresets: GrooveTemplate[] = [
  // MPC swing variants
  mpcSwing(54, 'MPC Swing 54%'),
  mpcSwing(58, 'MPC Swing 58%'),
  mpcSwing(62, 'MPC Swing 62%'),
  mpcSwing(66, 'MPC Swing 66%'),
  mpcSwing(71, 'MPC Swing 71%'),

  // Latin
  bossaNova,
  sonClave32,
  rumbaClave32,

  // African
  afrobeat128,

  // Reggae
  reggaeOneDrop,

  // Funk / New Orleans / Hip-hop
  secondLine,
  goGoSwing,
  dillaFeel,
];

/** Named groove preset library — keyed by template name */
export const GROOVE_PRESETS: GroovePresetLibrary = Object.fromEntries(
  allPresets.map(preset => [preset.name, preset])
);

/** Get a groove template by name, or undefined if not found */
export function getGrooveTemplate(name: string): GrooveTemplate | undefined {
  return GROOVE_PRESETS[name];
}

/** Get all available template names */
export function getGrooveTemplateNames(): string[] {
  return Object.keys(GROOVE_PRESETS);
}

/** Get templates filtered by category */
export function getGrooveTemplatesByCategory(category: GrooveTemplate['category']): GrooveTemplate[] {
  return allPresets.filter(t => t.category === category);
}

/**
 * Apply a groove template to a given step index.
 * Returns the timing offset (in fractions of step interval) scaled by amount,
 * and the velocity multiplier scaled toward 1.0 by (1 - amount).
 */
export function applyGrooveTemplate(
  template: GrooveTemplate,
  stepIndex: number,
  amount: number
): { timingOffset: number; velocityScale: number } {
  const cycleLength = template.offsets.length;
  const idx = stepIndex % cycleLength;

  const rawOffset = template.offsets[idx];
  const timingOffset = rawOffset * amount;

  let velocityScale = 1.0;
  if (template.velocities) {
    const rawVel = template.velocities[idx];
    // Blend between 1.0 (no effect) and the template velocity
    velocityScale = 1.0 + (rawVel - 1.0) * amount;
  }

  return { timingOffset, velocityScale };
}
