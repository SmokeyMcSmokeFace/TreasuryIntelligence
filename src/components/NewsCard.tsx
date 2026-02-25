"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import { NewsItem, CATEGORY_META } from "@/types";
import { timeAgo, urgencyColor, urgencyLabel } from "@/lib/utils";

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const catMeta = CATEGORY_META[item.category];
  const urgClass = urgencyColor(item.urgency);

  return (
    <article className="group relative border border-slate-800 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition-all p-4">
      {/* Urgency stripe */}
      {item.urgency >= 4 && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${
            item.urgency === 5 ? "bg-red-500" : "bg-orange-500"
          }`}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${urgClass}`}
            >
              {urgencyLabel(item.urgency)}
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${catMeta.bgColor} ${catMeta.color}`}
            >
              {catMeta.label}
            </span>
            <span className="text-[10px] text-slate-600 ml-auto">
              {timeAgo(item.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium text-slate-200 hover:text-white group-hover:text-white leading-snug mb-2 line-clamp-2"
          >
            {item.title}
            <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
          </a>

          {/* AI Summary */}
          {item.aiSummary ? (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex items-start gap-1.5">
              <Sparkles className="w-3 h-3 text-gold-500/60 mt-0.5 shrink-0" />
              <span>{item.aiSummary}</span>
            </p>
          ) : item.description ? (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          ) : null}

          {/* Source */}
          <p className="text-[10px] text-slate-600 mt-2">{item.source}</p>
        </div>
      </div>
    </article>
  );
}
