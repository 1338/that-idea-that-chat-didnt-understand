import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type AppConfig = {
  provider?: string;
  apiKey?: string;
  model?: string;
};

export default function Settings(props: { onBack: () => void }) {
  const { onBack } = props;
  const [config, setConfig] = useState<AppConfig>({});
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.uiterm.getConfig().then(cfg => {
      if (!mounted) return;
      setConfig(cfg || {});
    });
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof AppConfig>(key: K, value: string) {
    setConfig(current => ({ ...(current ?? {}), [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await window.uiterm.setConfig(config as Record<string, any>);
    } finally {
      setSaving(false);
      onBack();
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="app-no-drag flex items-center gap-2 rounded-md px-2 py-1 text-sm text-[var(--text-faint)] hover:bg-[var(--hover)]"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold text-[var(--text-strong)]">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Provider</label>
          <input
            value={config?.provider ?? 'openai'}
            onChange={e => update('provider', e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none"
          />
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Model</label>
          <input
            value={config?.model ?? ''}
            onChange={e => update('model', e.target.value)}
            placeholder="gpt-4.1-mini"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none"
          />
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">API Key</label>
          <div className="flex items-center gap-2">
            <input
              value={config?.apiKey ?? ''}
              onChange={e => update('apiKey', e.target.value)}
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              className="flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              className="flex size-8 items-center justify-center rounded-md text-[var(--text-faint)] hover:bg-[var(--hover)]"
              title="Show/hide key"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)]"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-[var(--text-faint)] hover:bg-[var(--hover)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
