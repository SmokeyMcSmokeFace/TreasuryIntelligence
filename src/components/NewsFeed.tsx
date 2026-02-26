"use client";

import { NewsItem } from "@/types";
import { NewsCard } from "./NewsCard";
import { Loader2, Inbox } from "lucide-react";

interface NewsFeedProps {
  items: NewsItem[];
  isLoading: boolean;
}

export function NewsFeed({ items, isLoading }: NewsFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-gehc-500/50 dark:text-gold-500/50" />
        <p className="text-sm">Loading intelligence feed...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-slate-600">
        <Inbox className="w-8 h-8" />
        <p className="text-sm">No news items yet.</p>
        <p className="text-xs">Click &ldquo;Refresh Intel&rdquo; to load today&rsquo;s feed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
