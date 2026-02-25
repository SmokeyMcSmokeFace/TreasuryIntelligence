"use client";

import { useState } from "react";
import { FileText, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { DailyBriefing as BriefingType } from "@/types";

interface DailyBriefingProps {
  briefing: BriefingType | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

// Very minimal markdown renderer (bold, headers, bullets)
function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-sm font-semibold text-white mt-4 mb-1 first:mt-0">
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.startsWith("- **") || line.startsWith("- ")) {
      const content = line.replace(/^- /, "");
      return (
        <li key={i} className="text-xs text-slate-300 leading-relaxed ml-2 list-none flex gap-2">
          <span className="text-gold-500 mt-0.5 shrink-0">›</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </li>
      );
    }
    if (/^\d+\./.test(line)) {
      return (
        <p key={i} className="text-xs text-slate-300 leading-relaxed ml-2">
          <span dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        </p>
      );
    }
    if (line.startsWith("---")) {
      return <hr key={i} className="border-slate-800 my-3" />;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-xs text-slate-300 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: boldify(line) }} />
      </p>
    );
  });
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
}

export function DailyBriefing({ briefing, isLoading, onRegenerate }: DailyBriefingProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-semibold text-white">Daily Briefing</span>
          {briefing && (
            <span className="text-[10px] text-slate-600 ml-1">
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
            className="p-1 rounded text-slate-600 hover:text-gold-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded text-slate-600 hover:text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 py-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-gold-500/50" />
              <span className="text-xs">Generating briefing...</span>
            </div>
          ) : briefing ? (
            <div className="space-y-0.5">{renderMarkdown(briefing.content)}</div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-600 mb-3">No briefing for today yet.</p>
              <button
                onClick={onRegenerate}
                className="text-xs text-gold-400 hover:text-gold-300 underline"
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
