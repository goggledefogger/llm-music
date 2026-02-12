import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PatternEditorCM } from '../components/editor/PatternEditorCM';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';
import { VisualizationPanel } from '../components/layout/VisualizationPanel';
import { usePattern, useAudio } from '../contexts/AppContext';
import { AUDIO_CONSTANTS } from '@ascii-sequencer/shared';

const PANEL_SIZES_KEY = 'ascii-seq-panel-sizes';

interface PanelSizes {
  editor: number;
  viz: number;
  chat: number;
}

const DEFAULT_SIZES: PanelSizes = { editor: 60, viz: 20, chat: 20 };

function loadPanelSizes(): PanelSizes {
  try {
    const saved = localStorage.getItem(PANEL_SIZES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.editor && parsed.viz && parsed.chat) return parsed;
    }
  } catch { /* use defaults */ }
  return DEFAULT_SIZES;
}

type MobileTab = 'editor' | 'visualizer' | 'chat';

export const EditorPage: React.FC = () => {
  const { parsedPattern } = usePattern();
  const { state: audioState, play, pause, stop, initialize } = useAudio();

  // Current sequencer step (uses STEPS_PER_BEAT to reflect 16th-note resolution)
  const currentStep = Math.floor(
    audioState.currentTime * ((audioState.tempo / 60) * AUDIO_CONSTANTS.STEPS_PER_BEAT)
  ) % (parsedPattern?.totalSteps || 16);

  // Panel sizes for desktop resizable layout
  const [panelSizes, setPanelSizes] = useState<PanelSizes>(loadPanelSizes);
  const resizingRef = useRef<'viz' | 'chat' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Persist panel sizes
  useEffect(() => {
    localStorage.setItem(PANEL_SIZES_KEY, JSON.stringify(panelSizes));
  }, [panelSizes]);

  // Resize handlers
  const handleMouseDown = useCallback((handle: 'viz' | 'chat') => {
    resizingRef.current = handle;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;

      setPanelSizes(prev => {
        if (resizingRef.current === 'viz') {
          // Dragging the border between editor and viz
          const editor = Math.max(30, Math.min(80, pct));
          const remaining = 100 - editor;
          const vizRatio = prev.viz / (prev.viz + prev.chat) || 0.5;
          return {
            editor,
            viz: remaining * vizRatio,
            chat: remaining * (1 - vizRatio),
          };
        } else {
          // Dragging the border between viz and chat
          const chatStart = pct;
          const chat = Math.max(10, Math.min(40, 100 - chatStart));
          const editor = Math.max(30, prev.editor);
          const viz = Math.max(10, 100 - editor - chat);
          return { editor, viz, chat };
        }
      });
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      // Don't capture if user is typing in CodeMirror
      if (target.closest('.cm-editor')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!audioState.isInitialized) {
          initialize().then(() => play()).catch(() => {});
        } else if (audioState.isPlaying) {
          pause();
        } else {
          play();
        }
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        stop();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [audioState.isPlaying, audioState.isInitialized, play, pause, stop, initialize]);

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile tab bar */}
        <div className="mobile-tab-bar">
          <button
            className={mobileTab === 'editor' ? 'active' : ''}
            onClick={() => setMobileTab('editor')}
          >
            Editor
          </button>
          <button
            className={mobileTab === 'visualizer' ? 'active' : ''}
            onClick={() => setMobileTab('visualizer')}
          >
            Visualizer
          </button>
          <button
            className={mobileTab === 'chat' ? 'active' : ''}
            onClick={() => setMobileTab('chat')}
          >
            Chat
          </button>
        </div>

        {/* Active panel */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {mobileTab === 'editor' && (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <PatternEditorCM />
              </div>
              <div className="flex-shrink-0">
                <TransportControls />
              </div>
            </>
          )}
          {mobileTab === 'visualizer' && (
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar ultra-compact-padding">
              <VisualizationPanel
                pattern={parsedPattern}
                currentStep={currentStep}
                currentTime={audioState.currentTime}
                isPlaying={audioState.isPlaying}
                tempo={audioState.tempo}
                className="h-auto w-full"
              />
            </div>
          )}
          {mobileTab === 'chat' && (
            <div className="flex-1 min-h-0">
              <ChatInterface />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div ref={containerRef} className="flex h-full flex-row overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex flex-col min-w-0 min-h-0" style={{ flexBasis: `${panelSizes.editor}%` }}>
        {/* CodeMirror Editor - Takes most of the space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <PatternEditorCM />
        </div>

        {/* Transport Controls */}
        <div className="flex-shrink-0">
          <TransportControls />
        </div>
      </div>

      {/* Resize handle: editor | viz */}
      <div
        className="resize-handle"
        onMouseDown={() => handleMouseDown('viz')}
      />

      {/* Visualization Panel */}
      <div
        className="bg-background-secondary min-w-0 min-h-0"
        style={{ flexBasis: `${panelSizes.viz}%` }}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar ultra-compact-padding">
          <VisualizationPanel
            pattern={parsedPattern}
            currentStep={currentStep}
            currentTime={audioState.currentTime}
            isPlaying={audioState.isPlaying}
            tempo={audioState.tempo}
            className="h-auto w-full"
          />
        </div>
      </div>

      {/* Resize handle: viz | chat */}
      <div
        className="resize-handle"
        onMouseDown={() => handleMouseDown('chat')}
      />

      {/* Chat Panel */}
      <div
        className="bg-background min-w-0 min-h-0"
        style={{ flexBasis: `${panelSizes.chat}%` }}
      >
        <ChatInterface />
      </div>
    </div>
  );
};
