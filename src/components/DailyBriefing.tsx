"use client";

import { useState } from "react";
import { FileText, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { DailyBriefing as BriefingType } from "@/types";

interface DailyBriefingProps {
  briefing: BriefingType | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-sm font-semibold text-gray-900 dark:text-white mt-4 mb-1 first:mt-0">
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.startsWith("- **") || line.startsWith("- ")) {
      const content = line.replace(/^- /, "");
      return (
        <li key={i} className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed ml-2 list-none flex gap-2">
          <span className="text-gehc-500 dark:text-gold-500 mt-0.5 shrink-0">›</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </li>
      );
    }
    if (/^\d+\./.test(line)) {
      return (
        <p key={i} className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed ml-2">
          <span dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        </p>
      );
    }
    if (line.startsWith("---")) {
      return <hr key={i} className="border-gray-200 dark:border-slate-800 my-3" />;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: boldify(line) }} />
      </p>
    );
  });
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>');
}

export function DailyBriefing({ briefing, isLoading, onRegenerate }: DailyBriefingProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Daily Briefing</span>
          {briefing && (
            <span className="text-[10px] text-gray-400 dark:text-slate-600 ml-1">
              {new Date(briefing.generatedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            title="Regenerate briefing"
            className="p-1 rounded text-gray-300 dark:text-slate-600 hover:text-gehc-500 dark:hover:text-gold-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 py-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400 dark:text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-gehc-500/50 dark:text-gold-500/50" />
              <span className="text-xs">Generating briefing...</span>
            </div>
          ) : briefing ? (
            <div className="space-y-0.5">{renderMarkdown(briefing.content)}</div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400 dark:text-slate-600 mb-3">No briefing for today yet.</p>
              <button
                onClick={onRegenerate}
                className="text-xs text-gehc-500 dark:text-gold-400 hover:text-gehc-600 dark:hover:text-gold-300 underline"
              >
                Generate now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
