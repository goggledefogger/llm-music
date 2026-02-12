import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../test/testUtils';
import { SuggestionPreview } from './SuggestionPreview';
import { ParsedPattern } from '../../../types/app';

const basePattern: ParsedPattern = {
  tempo: 120,
  instruments: {
    kick: {
      name: 'kick',
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    },
  },
  totalSteps: 16,
};

const suggestedPattern: ParsedPattern = {
  tempo: 130,
  instruments: {
    kick: {
      name: 'kick',
      steps: [true, false, true, false, true, false, false, false, true, false, false, false, true, false, false, false],
    },
  },
  totalSteps: 16,
};

const changes = [
  { instrument: 'kick', step: 2, original: false, suggested: true },
  { instrument: 'kick', step: 3, original: false, suggested: true },
];

describe('SuggestionPreview', () => {
  it('renders with AI Suggestion header', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.85}
        changes={changes}
      />
    );
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
  });

  it('displays confidence level for high confidence', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.9}
        changes={changes}
      />
    );
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('displays confidence level for medium confidence', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.65}
        changes={changes}
      />
    );
    expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('displays confidence level for low confidence', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.3}
        changes={changes}
      />
    );
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows the number of changes', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
      />
    );
    expect(screen.getByText('2 changes suggested')).toBeInTheDocument();
  });

  it('uses singular form for 1 change', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={[changes[0]]}
      />
    );
    expect(screen.getByText('1 change suggested')).toBeInTheDocument();
  });

  it('renders Accept and Reject buttons', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
      />
    );
    expect(screen.getByText('Accept Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Reject Suggestion')).toBeInTheDocument();
  });

  it('calls onAccept when Accept button is clicked', () => {
    const onAccept = vi.fn();
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
        onAccept={onAccept}
      />
    );
    fireEvent.click(screen.getByText('Accept Suggestion'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when Reject button is clicked', () => {
    const onReject = vi.fn();
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
        onReject={onReject}
      />
    );
    fireEvent.click(screen.getByText('Reject Suggestion'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('shows Original and Suggested sections', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
      />
    );
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Suggested')).toBeInTheDocument();
  });

  it('shows pattern comparison with tempo', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
      />
    );
    expect(screen.getByText('Pattern Comparison')).toBeInTheDocument();
    // Tempo: 120 -> 130 BPM
    expect(screen.getByText(/120 → 130 BPM/)).toBeInTheDocument();
  });

  it('shows changes summary section', () => {
    render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
      />
    );
    expect(screen.getByText('Changes Summary')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SuggestionPreview
        originalPattern={basePattern}
        suggestedPattern={suggestedPattern}
        confidence={0.8}
        changes={changes}
        className="my-custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
