# Research Command

Use this command to conduct comprehensive SEO keyword research and competitive analysis before writing new content.

## Usage
`/research [topic]`

## What This Command Does
1. Performs keyword research for your industry-related topics
2. Analyzes top-ranking competitor content
3. Identifies content gaps and opportunities
4. Develops unique angle for your company perspective
5. Creates detailed research brief for writing

## Process

### Keyword Research
- **Primary Keyword**: Identify main target keyword for the topic
- **Search Volume & Difficulty**: Research estimated monthly searches and competition level
- **Keyword Variations**: Find semantic variations and long-tail opportunities
- **Related Questions**: Discover what people are actually asking (People Also Ask, forums, Reddit)
- **Search Intent**: Determine if intent is informational, navigational, commercial, or transactional
- **Topic Cluster**: Identify how this topic fits into your company content clusters

### Competitive Analysis
- **Top 10 SERP Review**: Analyze the top 10 ranking articles for target keyword
- **Content Length**: Note word count of top-performing articles (benchmark target)
- **Common Themes**: What topics/sections do all top articles cover?
- **Content Gaps**: What's missing from competitor coverage?
- **Unique Angles**: What perspectives or insights are underexplored?
- **Featured Snippets**: Identify if there's a featured snippet opportunity
- **Domain Authority**: Note which competitors rank (indie blogs vs. major publications)

### Context Integration
- **your company Advantage**: How can your company product features naturally enhance this content?
- **Brand Alignment**: Check @context/brand-voice.md for messaging fit
- **Existing Content**: Review @context/internal-links-map.md for related your company articles
- **Target Keywords**: Cross-reference with @context/target-keywords.md priority list
- **SEO Guidelines**: Ensure research aligns with @context/seo-guidelines.md requirements

### 🚫 Anti-Hallucination — MANDATORY, READ FIRST

**NEVER invent, guess, or approximate sources. Every link must be real and verified.**

Rules:
- Do NOT include a URL unless you have fetched it and confirmed it contains the claimed data
- Do NOT paraphrase what you think a source "probably says" — quote what it actually says
- If you cannot find a real source for a claim, write: "⚠️ Brak źródła — wymaga weryfikacji" and flag it visibly
- A missing source is better than a made-up one. Do not add links just to reach the minimum count.
- If a search returns a plausible-looking URL but you haven't verified its content — do NOT include it
- When in doubt: fetch the page, confirm the data exists, then cite it

Quality over quantity: **8 verified sources beat 10 invented ones every time.**

### ⚠️ Data Freshness — MANDATORY

**Current year is 2026. All research MUST use 2026 data.**

- **Never cite data older than 2024** — always search for "2025" or "2026" versions of statistics
- When searching, always append the year: e.g. "koszty DPS 2026", "dodatek pielęgnacyjny 2026 kwota"
- If only older data is available, explicitly note it: "(dane za 2024 — brak nowszych)"
- Check if cited laws/regulations have been updated since 2024

### ⚠️ Linkable Sources — MANDATORY

Every research brief MUST identify at least **10 linkable sources** across these categories (minimum: 3 Tier 1 + 3 Tier 2 + 4 Tier 3):

**Tier 1 — Official Polish government (highest authority, always prefer):**
- isap.sejm.gov.pl — texts of laws (Dz.U., ustawa o pomocy społecznej)
- malopolska.uw.gov.pl — Małopolska regional data, DPS registries
- stat.gov.pl — GUS statistics (population, elderly care data)
- mz.gov.pl — Ministry of Health data
- nfz.gov.pl — NFZ reimbursement data

**Tier 2 — Institutional reports (Polish):**
- NIK reports (nik.gov.pl) on social care quality
- Central Register of Social Care Institutions
- alzheimer.pl — Polskie Towarzystwo Alzheimerowskie

**Tier 2b — International research (English OK — use when better data exists):**
Research does NOT have to be limited to Polish sources. If international studies provide stronger evidence, cite them. Especially relevant for:
- Alzheimer's & dementia: Alzheimer's Association (alz.org), Alzheimer's Disease International (alzint.org), Lancet, NEJM, BMJ
- Lifestyle & healthy aging: WHO, Harvard Health, Mayo Clinic, Cochrane Reviews
- Caregiver support: AARP, Dementia UK, Alzheimer's Society (UK)
- Senior care models: studies from Nordic countries (often best practices in elderly care)

When using English sources in a Polish article:
- Translate/summarize the data into Polish in the article text
- Link to the original English source (shows E-E-A-T, Google values international citations)
- Format: "Według badań opublikowanych w [Lancet/NEJM/etc.] (2025)..."

**Tier 3 — Data suitable for tables:**
- Official price lists / fee schedules from individual DPS facilities
- Regional statistics (how many DPS per powiat, waiting times)
- Comparison data (DPS vs private care costs)

For each source found, note:
1. URL (full, linkable)
2. What specific data it contains (statistic, regulation, table)
3. Date of the data
4. How to use it (inline citation, table source, FAQ answer)

### Kompas Seniora — Topic Focus
- **Senior Care Angle**: How does this topic impact families choosing care for elderly relatives?
- **Legal/Financial Angle**: Are there regulations, costs, or rights relevant to this topic?
- **Regional Angle**: Is there Małopolska-specific data available (DPS counts, waiting times, prices)?
- **Pain Points**: What specific challenges do families and caregivers face with this topic?

### Content Planning
- **Recommended Structure**: Outline H2 and H3 headings based on research
- **Content Depth**: Determine target word count (typically 2000-3000+ for SEO)
- **Supporting Evidence**: Identify statistics, studies, or data to include
- **Expert Sources**: Find industry experts or quotes to reference
- **Visual Opportunities**: Suggest images, screenshots, or graphics needed
- **Internal Links**: Map 3-5 key your company pages to link to (from @context/internal-links-map.md)
- **External Authority**: Identify 2-3 authoritative external sources to link

### Hook Development
- **Introduction Angle**: Compelling way to open the article
- **Value Proposition**: Clear benefit reader will get from article
- **Contrarian Elements**: Any unexpected perspectives to explore
- **Story Opportunities**: Real examples or case studies to feature

## Output
Provides a comprehensive research brief with:

### 1. SEO Foundation
- **Primary Keyword**: [keyword] (volume, difficulty)
- **Secondary Keywords**: 3-5 related keywords and variations
- **Target Word Count**: Minimum words needed to compete
- **Featured Snippet Opportunity**: Yes/No, format (paragraph, list, table)

### 2. Competitive Landscape
- **Top 3 Competitor Articles**: URLs and key takeaways from each
- **Common Sections**: Must-cover topics based on SERP analysis
- **Content Gaps**: Opportunities to provide unique value
- **Differentiation Strategy**: How your company can stand out

### 3. Recommended Outline
```
H1: [Optimized headline with primary keyword]

Introduction
- Hook
- Problem statement
- Value proposition

H2: [Main section 1]
H3: [Subsection]
H3: [Subsection]

H2: [Main section 2]
...

Conclusion
- Key takeaways
- Call to action
```

### 4. Supporting Elements
- **Statistics to Include**: 5-7 relevant data points with sources
- **Expert Quotes**: Potential sources or existing quotes
- **Examples/Case Studies**: Real podcast scenarios to feature
- **Visual Suggestions**: Screenshots, charts, or graphics needed

### 5. Internal Linking Strategy
- **Pillar Page**: Main your company pillar content to link to
- **Related Articles**: 2-4 relevant blog posts to link
- **Product Pages**: your company features to naturally mention
- **Resource Pages**: Tools or guides to reference

### 6. Meta Elements Preview
- **Meta Title**: Draft optimized title (50-60 characters)
- **Meta Description**: Draft compelling description (150-160 characters)
- **URL Slug**: Recommended URL structure

## File Management
After completing the research, automatically save the brief to:
- **File Location**: `research/brief-[topic-slug]-[YYYY-MM-DD].md`
- **File Format**: Markdown with clear sections and structured data
- **Naming Convention**: Use lowercase, hyphenated topic slug and current date

Example: `research/brief-podcast-editing-software-2025-10-15.md`

## Next Steps
The research brief serves as the foundation for:
1. Running `/write [topic]` to create the optimized article
2. Reference material for maintaining SEO focus throughout writing
3. Checklist to ensure all competitive gaps are addressed

This ensures every article is built on solid SEO research and strategic competitive positioning.
