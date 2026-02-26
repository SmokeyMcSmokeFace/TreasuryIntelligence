# Treasury Intelligence Platform
### Executive Overview

---

## What Is It?

The Treasury Intelligence Platform is an AI-powered dashboard designed for corporate Treasury executives. It continuously monitors financial news, generates daily intelligence briefings, and provides an interactive assistant that can answer questions grounded in real-time market developments and company financial data.

---

## Key Capabilities

**Live Intelligence Feed**
- Aggregates financial news from 16 sources in real time, including CNBC, MarketWatch, Financial Times, and targeted searches across 10 Treasury-specific topics
- Each article is automatically analyzed and categorized by AI into Treasury-relevant topics: liquidity, capital markets, FX rates, credit ratings, M&A, counterparty risk, macro, pensions, and geopolitical risk
- Every article is assigned an urgency score (1–5) based on its potential Treasury impact, with critical items flagged prominently

**Daily Executive Briefing**
- Automatically synthesizes the day's news into a concise briefing written from the perspective of a senior Treasury analyst
- Highlights the most significant risks, market movements, and actionable items relevant to corporate Treasury

**Cash Position Monitoring**
- Displays cash balances by country and by banking counterparty
- Automatically cross-references news against counterparty and country exposures to flag potential risks (e.g., news about a specific bank or region highlights the relevant position)

**Company Financial Data — GE HealthCare (GEHC)**
- Pulls live financial data directly from SEC EDGAR filings (10-K / 10-Q)
- Displays key metrics: revenue, net income, EBITDA, operating cash flow, cash, total debt, net debt, and interest expense
- Includes a debt maturity ladder chart showing upcoming principal repayments by year, color-coded by size
- Automatically refreshes when a new SEC filing is detected — no manual updates required

**AI Chat Assistant**
- An interactive assistant with full awareness of today's news feed, the daily briefing, cash positions, and the GEHC financial snapshot
- Can search for additional financial news on any topic beyond the current feed
- Can look up SEC EDGAR financial data for any US public company on demand
- Designed for busy executives: concise, direct answers with key figures in bold

---

## How to Use It

| Action | What It Does |
|---|---|
| **Refresh Intel** | Fetches the latest news, runs AI analysis, refreshes GEHC financial data |
| **Category tabs** | Filter the news feed by Treasury topic |
| **Daily Briefing** | Read the AI-generated executive summary; regenerate at any time |
| **Chat** | Ask questions about the news, the briefing, cash positions, or company financials |
| **Settings** | Control how many days of news are displayed (default: 2 days) |

---

## Technology

- Built on Next.js with a secure login and session management
- AI analysis powered by Claude (Anthropic) via AWS Bedrock
- Financial data sourced directly from SEC EDGAR's public XBRL API — no third-party data vendor required
- Hosted on a private cloud server; all data remains within the environment

---

## Current Status & Next Steps

The current version is a working proof of concept demonstrating the core intelligence feed, briefing, cash monitoring, and company financial data capabilities with GE HealthCare as the reference company.

Potential next steps include:
- Connecting live cash and bank balance data from the company's TMS or ERP system
- Expanding company financial coverage beyond GEHC
- Adding additional early warning signal logic (rating agency alerts, counterparty watch lists)
- Role-based access for broader Treasury team distribution

---

*Prepared for internal review — February 2026*
