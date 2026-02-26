"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Save, CheckCircle, Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [days, setDays] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setDays(s.newsFeedDays ?? 2);
        setLoading(false);
      });
    // Read current theme
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const newDark = !isDark;
    if (newDark) {
      html.classList.add("dark");
      localStorage.setItem("tip-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("tip-theme", "light");
    }
    setIsDark(newDark);
  }

  async function handleSave() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsFeedDays: days }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#060b18] text-gray-900 dark:text-slate-200">
      {/* Header */}
      <header className="border-b border-gehc-700 dark:border-slate-800 bg-gehc-800 dark:bg-navy-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 px-6 py-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded border border-white/20 dark:border-slate-700 text-white/60 dark:text-slate-500 hover:text-white dark:hover:text-slate-300 hover:border-white/40 dark:hover:border-slate-600 transition-all"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center justify-center w-8 h-8 rounded bg-white/20 border border-white/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">Settings</h1>
            <p className="text-xs text-gehc-200 dark:text-slate-500">Treasury Intelligence Platform</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-4">
        {/* Appearance */}
        <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Appearance
            </h2>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-slate-300">Color Theme</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                  {isDark ? "Dark mode — navy & gold" : "GE HealthCare — purple & white"}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDark ? "bg-slate-700" : "bg-gehc-500"
                }`}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    isDark ? "translate-x-6" : "translate-x-1"
                  }`}
                >
                  {isDark
                    ? <Moon className="w-2.5 h-2.5 text-slate-600" />
                    : <Sun className="w-2.5 h-2.5 text-gehc-500" />
                  }
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* News Feed Settings */}
        <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              News Feed
            </h2>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Days slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                  Days of news to display
                </label>
                <span className="text-lg font-bold text-gehc-500 dark:text-gold-400 w-8 text-center">
                  {days}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                value={days}
                disabled={loading}
                onChange={(e) => setDays(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-slate-700 accent-gehc-500 dark:accent-yellow-500 cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-600 mt-1.5 px-0.5">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-3 leading-relaxed">
                Articles older than{" "}
                <span className="text-gray-700 dark:text-slate-300">
                  {days} day{days !== 1 ? "s" : ""}
                </span>{" "}
                are excluded from the feed and purged from cache on the next
                Refresh Intel.
              </p>
            </div>

            {/* Save row */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800/60">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded border border-gehc-500/30 dark:border-gold-600/50 bg-gehc-500/10 dark:bg-gold-500/10 text-gehc-500 dark:text-gold-400 hover:bg-gehc-500/20 dark:hover:bg-gold-500/20 hover:border-gehc-500 dark:hover:border-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                Save Settings
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved — takes effect on next Refresh Intel
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Placeholder for future settings */}
        <div className="border border-gray-100 dark:border-slate-800/40 rounded-lg bg-gray-50 dark:bg-slate-900/20 px-5 py-4">
          <p className="text-xs text-gray-400 dark:text-slate-600">
            More settings coming soon — data sources, alert thresholds, notification preferences.
          </p>
        </div>
      </main>
    </div>
  );
}
