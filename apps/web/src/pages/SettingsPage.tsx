import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <p className="text-foreground-secondary">
          Configure your audio, AI, and interface preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Audio Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">🎧 Audio Settings</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Audio Latency (ms)</label>
              <input
                type="range"
                min="0"
                max="200"
                defaultValue="100"
                className="w-full"
              />
              <div className="text-xs text-foreground-muted mt-1">100ms</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Master Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-full"
              />
              <div className="text-xs text-foreground-muted mt-1">80%</div>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">🤖 AI Settings</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI Model</label>
              <select className="input">
                <option value="openai">OpenAI GPT-4</option>
                <option value="webllm">WebLLM (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                type="password"
                placeholder="Enter your API key"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">🎨 Interface Settings</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select className="input">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Enable Visualizations</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Auto-save Patterns</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button className="btn btn-secondary">Reset to Defaults</button>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
};
