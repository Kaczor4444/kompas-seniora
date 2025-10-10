# 📚 Lessons Learned - Autocomplete Implementation
**Session:** 2025-10-10  
**Project:** kompaseniora.pl  
**Feature:** Multi-filter Autocomplete Dropdown

---

## 🎯 Key Technical Lessons

### 1. Database Character Encoding (Polish/International)
**Problem:** Database has Polish characters (`małopolskie`, `śląskie`) but URL params use ASCII (`malopolskie`, `slaskie`).

**Solution:**
```typescript
// Create mapping in BOTH API endpoint AND search page
const wojewodztwoMap: Record<string, string> = {
  'malopolskie': 'małopolskie',
  'slaskie': 'śląskie',
  'mazowieckie': 'mazowieckie',
  // ... etc
};
terytWhere.wojewodztwo = wojewodztwoMap[wojewodztwo] || wojewodztwo;
```

**Why important:** Without this, filters silently fail with 0 results.

**Where to apply:**
- API endpoints reading URL params
- Database queries with international characters
- Any param → DB field mapping

---

### 2. React Dropdown Click Handlers
**Problem:** Dropdown closes BEFORE click registers, so onClick never fires.

**Solution:**
```typescript
// ❌ WRONG - closes before click
<button onClick={() => handleClick(item)}>

// ✅ CORRECT - prevents close, then handles click
<button 
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleClick(item);
  }}
>
```

**Why:** `onMouseDown` fires before blur events that close dropdowns.

**Where to apply:**
- Dropdown menus
- Autocomplete suggestions
- Custom select components
- Any clickable inside a closeable container

---

### 3. CSS Positioning for Dropdowns in Flex Containers
**Problem:** Dropdown with `position: absolute` gets clipped by `overflow: hidden` parent.

**Solution:**
```typescript
// ❌ WRONG - dropdown clipped
<div className="overflow-hidden">
  <div className="relative">
    <input />
    <div className="absolute">Dropdown</div>
  </div>
</div>

// ✅ CORRECT - high z-index + inline positioning
<div className="relative">
  <input />
  <div 
    className="absolute"
    style={{ 
      zIndex: 10000,
      position: 'absolute' 
    }}
  >
    Dropdown
  </div>
</div>
```

**Where to apply:**
- Autocomplete dropdowns
- Date pickers
- Context menus
- Any absolute positioned overlay

---

### 4. Debouncing API Calls (Performance)
**Pattern:**
```typescript
useEffect(() => {
  if (query.length < 2) return;
  
  const timer = setTimeout(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/suggest?q=${query}`);
    const data = await response.json();
    setSuggestions(data.suggestions);
    setIsLoading(false);
  }, 300); // 300ms debounce
  
  return () => clearTimeout(timer);
}, [query, otherFilters]);
```

**Best practices:**
- 300ms standard for typing
- 500ms for expensive operations
- Clean up timer in return function
- Show loading indicator during debounce

---

### 5. Partial vs Exact Search
**Problem:** User types "kra" (3 chars) → autocomplete shows results → clicks "Show All" → 0 results (expects exact match "kra" location).

**Solution:**
```typescript
// Add partial flag to URL
const handleShowAll = () => {
  params.append('partial', 'true');
  router.push(`/search?${params}`);
};

// In search page - conditional WHERE clause
const terytWhere = isPartialSearch 
  ? { nazwa_normalized: { contains: query } }  // LIKE '%query%'
  : { nazwa_normalized: query };                // = 'query'
```

**UX improvements:**
- Hide "Show All" for queries < 4 characters
- Change button text: "Pokaż wszystkie miejscowości zawierające 'xyz'"
- Distinguish in UI: "o nazwie" vs "zawierających"

---

### 6. Polish Grammar Pluralization
**Pattern:**
```typescript
function getPluralForm(count: number): string {
  if (count === 1) return 'placówka';
  
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  // Special case: 11-14 always "placówek"
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'placówek';
  
  // 2-4: "placówki"
  if (lastDigit >= 2 && lastDigit <= 4) return 'placówki';
  
  // Everything else: "placówek"
  return 'placówek';
}

// Usage: "5 placówek", "22 placówki", "11 placówek"
```

**Applies to:** Any Slavic language with complex plural rules.

---

### 7. Keyboard Navigation in Dropdowns
**Implementation:**
```typescript
const [highlightedIndex, setHighlightedIndex] = useState(-1);

const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
      break;
    case 'ArrowUp':
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
      break;
    case 'Enter':
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectItem(suggestions[highlightedIndex]);
      }
      break;
    case 'Escape':
      closeDropdown();
      break;
  }
};
```

**Must-haves for accessibility:**
- ↓↑ navigate
- Enter selects
- Escape closes
- Visual highlight on selected
- Reset highlight on new search

---

### 8. Smart "Show All" Button Logic
**Bad approach:**
```typescript
{totalCount > 5 && <button>Show All</button>}
```

**Good approach:**
```typescript
{totalCount > suggestions.length && query.length >= 4 && (
  <button>Pokaż wszystkie ({totalCount})</button>
)}
```

**Rules:**
- Show ONLY when there are MORE results than displayed
- Hide for very short queries (< 4 chars) - partial search won't make sense
- Display total count in button

---

### 9. Tooltips in Next.js/React
**Problem:** Custom CSS tooltips don't work well in SSR.

**Simple solution:**
```typescript
// Add visual hint (icon)
<button title="Full explanation here">
  Button Text <span className="text-neutral-400">ⓘ</span>
</button>

// Use browser's native tooltip (title attribute)
// Accept default styling (faster, works everywhere)
```

**When to use custom tooltips:**
- Need rich content (HTML, links)
- Need precise positioning
- Brand-specific styling required

**When to use native:**
- Simple text hints
- Development speed matters
- Cross-browser compatibility critical

---

## 🐛 Common Pitfalls

### 1. Forgetting to normalize in BOTH directions
- URL → DB: Apply mapping
- DB → URL: Often needs reverse mapping
- Always test round-trip: User input → DB → Display

### 2. Over-complicating dropdown positioning
- Start with inline styles if Tailwind fails
- `z-index: 10000` is your friend
- Test in different parent containers

### 3. Not handling click outside
```typescript
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      closeDropdown();
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 4. Ignoring mobile responsiveness
```typescript
// Desktop: fixed width
// Mobile: 100% width
style={{ 
  width: window.innerWidth < 768 ? '100%' : '500px',
  minWidth: '280px' 
}}
```

---

## 📋 Reusable Code Patterns

### Complete Autocomplete Hook
```typescript
function useAutocomplete(apiUrl: string, minChars = 2, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length < minChars) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}?q=${query}`);
        const data = await res.json();
        setSuggestions(data.suggestions);
        setShowDropdown(data.suggestions.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, apiUrl, minChars, debounceMs]);

  return { query, setQuery, suggestions, isLoading, showDropdown, setShowDropdown };
}
```

### Character Mapping Utility
```typescript
// For any international characters → ASCII conversion
export const createCharMapping = (pairs: Record<string, string>) => ({
  toDb: (input: string) => pairs[input] || input,
  toUrl: (input: string) => {
    const reversed = Object.fromEntries(
      Object.entries(pairs).map(([k, v]) => [v, k])
    );
    return reversed[input] || input;
  }
});

// Usage
const wojewodztwoMapping = createCharMapping({
  'malopolskie': 'małopolskie',
  'slaskie': 'śląskie'
});

// URL → DB
const dbValue = wojewodztwoMapping.toDb(urlParam);
// DB → URL  
const urlValue = wojewodztwoMapping.toUrl(dbValue);
```

---

## 🧪 Testing Checklist

### Autocomplete functionality
- [ ] Shows after typing min characters (usually 2)
- [ ] Debounces correctly (doesn't spam API)
- [ ] Loading indicator appears
- [ ] Results display correctly
- [ ] Click on suggestion works
- [ ] Keyboard navigation (↓↑ Enter ESC)
- [ ] Click outside closes
- [ ] Works on mobile

### Filters
- [ ] Each filter changes results
- [ ] Multiple filters combine correctly (AND logic)
- [ ] Filters persist in URL
- [ ] Back button works
- [ ] Direct URL with filters works

### Edge cases
- [ ] Empty results handled gracefully
- [ ] Very long queries don't break UI
- [ ] Special characters in query
- [ ] Rapid typing doesn't cause issues
- [ ] Network errors handled

### International/localization
- [ ] Non-ASCII characters work
- [ ] URL encoding correct
- [ ] Database matches URL params
- [ ] Pluralization correct for language

---

## 🎨 UX Best Practices

### 1. Progressive Disclosure
- Start simple (just search box)
- Show filters on focus/expand
- Don't overwhelm with options upfront

### 2. Clear Visual Feedback
- Loading states
- Empty states with helpful message
- Error states with recovery action
- Success indicators

### 3. Helper Text Placement
```
✅ GOOD: Placeholder + icon tooltip
"np. Bochnia, Kraków..." + ⓘ

❌ BAD: Long instruction text above input
"Wpisz co najmniej 2 znaki polskiej miejscowości..."
```

### 4. Mobile Considerations
- Larger touch targets (min 44px)
- Full-width dropdowns on mobile
- Consider bottom sheet instead of dropdown
- Reduce filters on small screens

---

## 📊 Performance Optimization

### API Response Size
```typescript
// ❌ BAD - returns all fields
SELECT * FROM locations WHERE name LIKE '%query%'

// ✅ GOOD - only needed fields
SELECT name, powiat, wojewodztwo, 
       (SELECT COUNT(*) FROM facilities WHERE powiat = locations.powiat) as count
FROM locations 
WHERE name LIKE '%query%' 
LIMIT 5
```

### Prisma Optimization
```typescript
// Use select to limit fields
const results = await prisma.location.findMany({
  where: { nazwa_normalized: { contains: query } },
  select: {
    nazwa: true,
    powiat: true,
    wojewodztwo: true,
  },
  take: 5,
});

// Use distinct to avoid duplicates
distinct: ['nazwa', 'powiat'],
```

### Frontend Optimization
- Virtualize long lists (react-window)
- Limit displayed results (top 5-10)
- Lazy load images in suggestions
- Cache recent searches (localStorage)

---

## 🚀 Deployment Considerations

### Environment Variables
```typescript
// .env.local
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_API_URL="https://api.example.com"

// Don't hardcode in components
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Error Handling
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly message
  setError('Nie udało się załadować wyników. Spróbuj ponownie.');
  // Optional: Send to error tracking (Sentry)
}
```

### Production Checklist
- [ ] Remove all console.logs
- [ ] Add error boundaries
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting on API
- [ ] Add request timeouts
- [ ] Set up monitoring/alerts
- [ ] Test with production data volume
- [ ] Security: sanitize inputs

---

## 📚 Additional Resources

### Libraries Worth Considering
- **react-select** - Full-featured select/autocomplete
- **downshift** - Flexible autocomplete primitives
- **cmdk** - Command palette (⌘K style)
- **react-window** - Virtualized lists
- **swr / react-query** - Data fetching with caching

### When to Use vs Build Custom
**Use library when:**
- Complex requirements (multi-select, tags, async)
- Need accessibility out of the box
- Time-to-market critical

**Build custom when:**
- Simple requirements (our case)
- Tight design constraints
- Want full control
- Learning experience

---

## 🎯 Project-Specific Notes

### kompaseniora.pl Autocomplete
**What worked well:**
- Simple API design (q + filters)
- Incremental testing approach
- Debug logs kept for future provinces
- Step-by-step implementation

**What to improve next time:**
- Start with tests for common bugs (click outside, keyboard nav)
- Consider library for complex keyboard navigation
- Plan mobile experience from start

**Unique challenges:**
- Polish characters in database
- Multiple locations with same name (23 "Zarzecze"!)
- Aggregating facilities across locations
- Partial vs exact search UX

---

## 🔄 Template for Next Project

```markdown
## Autocomplete Implementation Plan

### 1. Data Analysis
- [ ] Identify primary search field
- [ ] Determine minimum query length
- [ ] Count unique values (< 1000 = in-memory, > 1000 = API)
- [ ] Check for special characters/international
- [ ] Plan for fuzzy matching?

### 2. API Design
- [ ] Endpoint: GET /api/suggest?q=...
- [ ] Response structure: { suggestions: [], totalCount: number }
- [ ] Rate limiting strategy
- [ ] Caching strategy (Redis? In-memory?)

### 3. Frontend Implementation
- [ ] Debounced input (300ms)
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Keyboard navigation
- [ ] Click outside handler
- [ ] Mobile responsive

### 4. Testing
- [ ] Unit tests for debounce
- [ ] Integration tests for API
- [ ] E2E tests for user flow
- [ ] Accessibility audit
- [ ] Performance testing (API latency)

### 5. Polish/Refinement
- [ ] Animations
- [ ] Tooltips/hints
- [ ] Analytics tracking
- [ ] Error recovery
```

---

**Created:** 2025-10-10  
**Project:** kompaseniora.pl  
**Developer:** Iwona + Claude  
**Status:** ✅ Production Ready

---

## �� Final Wisdom

> "The best autocomplete is invisible - users shouldn't think about it, it should just work."

**Key principles:**
1. **Fast** - < 300ms perceived latency
2. **Forgiving** - Handles typos, partial matches
3. **Clear** - Always show what will happen
4. **Accessible** - Keyboard + screen reader support
5. **Mobile-first** - Touch targets, responsive

**Remember:** Start simple, add complexity only when needed. Most features don't need fancy libraries - vanilla React + good UX goes a long way.

---

*Save this file as `docs/lessons-learned-autocomplete.md` for future reference.*

