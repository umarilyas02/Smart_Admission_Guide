# University Data Scraping & Seeding System

Intelligent data processing pipeline with **automatic date correction** using Claude AI Haiku.

## Overview

```
Raw Data (JSON)
    ↓
[auto_post_clean_data.py]
    ├─ Validate dates
    ├─ Local correction (known typos)
    ├─ Claude AI correction (unknown typos)
    ├─ Extract programs
    └─ Log everything
    ↓
Clean Data + API Push
    ↓
Database
```

## What's New

### Before
- ❌ Malformed dates like "Fee 27" and "Psy 4" would fail validation
- ❌ Only hardcoded typo mappings worked
- ❌ Minimal logging, hard to debug
- ❌ Manual intervention needed for new typos

### Now
- ✅ **Any typo is handled** - Local corrections for known patterns, Claude AI for new ones
- ✅ **Three-layer correction** - Validation → Local → Claude
- ✅ **Comprehensive logging** - See exactly what was saved, corrected, or skipped
- ✅ **Automatic pushing** - No manual intervention needed
- ✅ **Future-proof** - Add more typos without code changes

## Key Features

### 1. Smart Date Correction
```python
Fee 27      → Feb 27     (Local mapping)
Psy 4       → Sep 4      (Local mapping)
Xec 15      → Dec 15     (Claude AI)  ← Future typos handled!
```

### 2. Comprehensive Logging
Every step is tracked and displayed:
```
Processing 50 items from raw data...
================================================================================
  🔧 Auto-corrected 'Fee 27' → 'Feb 27' for University A
✅ SAVE [1] University A (Feb 27, 2026 → Mar 15, 2026)
  🤖 Claude corrected 'Xec 10' → 'Dec 10' for University B
✅ SAVE [2] University B (Dec 10, 2026 → Jan 20, 2027)
❌ SKIP [3] University C: No valid dates found

📊 PROCESSING SUMMARY
Total items processed: 50
✅ Items saved: 48
❌ Items skipped: 2
🔧 Dates auto-corrected (local): 5
🤖 Dates corrected by Claude: 3
```

### 3. Automatic API Push
After processing and corrections, data is automatically pushed to the database:
```
📤 Posting 48 records...
✅ POST succeeded (HTTP 201).
🎉 Data seeding successful!
   Inserted 48 university record(s).
```

## Setup

### 1. Install Dependencies
```bash
pip install -r scripts/requirements.txt
```

### 2. Optional: Enable Claude AI Correction
To automatically handle any future typos using AI:

a) Get your API key from https://console.anthropic.com/
b) Set environment variable:

**PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

**Bash:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

c) Run the script - Claude will be auto-enabled if key is present

### 3. Prepare Your Data

Create `data.json` with structure:
```json
{
  "results": [
    {
      "university": "University Name",
      "category": "Admission",
      "content": "Admission dates: Feb 27 to Mar 15..."
    }
  ]
}
```

### 4. Run the Processor
```bash
python scripts/auto_post_clean_data.py
```

## Files

| File | Purpose |
|------|---------|
| `auto_post_clean_data.py` | Main processor with date correction logic |
| `requirements.txt` | Python dependencies |
| `SETUP_CLAUDE.md` | Detailed setup guide for Claude API |
| `TEST_CLAUDE.md` | Testing guide with examples |
| `README.md` | This file |

## How It Works

### Step 1: Date Extraction
Regex finds all potential dates in content:
```
"Admission from Feb 27 to Mar 15" → [("Feb", "27"), ("Mar", "15")]
```

### Step 2: Validation
Check if month and day are valid:
```
("Feb", "27") → Valid ✅
("Fee", "27") → Invalid ❌ → Try correction
```

### Step 3a: Local Correction (Fast, Free)
Check predefined typo mappings:
```
"Fee" → Check typo_map → "Feb" ✅
"Psy" → Check typo_map → "Sep" ✅
"Xec" → Not in map → Try next layer
```

### Step 3b: Claude Correction (Smart, Cost-Efficient)
Send to Claude Haiku for intelligent correction:
```
"Xec 15" → Claude → "Dec" (understands context)
```

### Step 4: Program Extraction
Find all mentioned programs in content

### Step 5: Logging & API Push
Log all corrections and push valid data to API

## Cost Analysis

### Claude API Usage
- **Model:** claude-3-5-haiku-20241022 (cheapest model)
- **Cost:** ~$0.80 per 1M input tokens, ~$4 per 1M output tokens
- **Per correction:** < $0.001 USD
- **1000 items with typos:** < $0.10 USD

### When Does Claude Run?
- ✅ Always on unknown typos (if API key is set)
- ❌ Never on known patterns (uses local mapping instead)
- ❌ Never on valid dates (fast validation passes)

### Typical Cost Per Scrape
- 50 items, 3 unknown typos = **~$0.003 USD** 🎉

## Customization

### Add New Local Typo Mappings
Edit the `typo_map` in `correct_month_typo()`:
```python
typo_map = {
    'Fee': 'Feb',      # Your typo: correct month
    'Psy': 'Sep',
    'YourTypo': 'Jan',  # Add here
}
```

### Modify Claude Prompt
Edit the prompt in `correct_month_with_claude()` to adjust correction behavior

### Change API Model (Not Recommended)
Current: `claude-3-5-haiku-20241022` (cheapest)
- ❌ Don't change to Sonnet/Opus - much more expensive
- ✅ Keep Haiku for cost-efficiency

## Troubleshooting

### "Claude API not available"
- Check `ANTHROPIC_API_KEY` is set
- Verify key is valid at console.anthropic.com
- Install anthropic: `pip install anthropic`

### Dates still not correcting
- Check logs for "Could not correct date"
- Some dates may be too corrupted to guess
- Add to `typo_map` if it's a common pattern

### API push fails
- Check `TARGET_URL` environment variable
- Verify database is accessible
- Check server logs for validation errors

### High API costs?
- Unlikely - check Anthropic dashboard
- Only Claude calls cost money
- Local corrections are free

## Examples

### Example 1: Known Typo (Local)
```
Input:  "Admission: Fee 27 - Mar 15"
Output: "Feb 27 - Mar 15"  (Local correction)
Cost:   $0 ✅
```

### Example 2: Unknown Typo (Claude)
```
Input:  "Admission: Xec 10 - Jne 25"
Output: "Dec 10 - Jun 25"  (Claude correction)
Cost:   ~$0.002 ✅
```

### Example 3: Too Corrupted
```
Input:  "Admission: XXXXXX 99"
Output: ❌ SKIP (Too corrupted to correct)
Cost:   $0 (skipped before Claude)
```

## Future Enhancements

- [ ] Batch date correction (more efficient API calls)
- [ ] Caching of Claude corrections
- [ ] Support for date ranges like "Feb-Mar"
- [ ] Day validation (29 Feb in non-leap years)
- [ ] Multiple date format support

## Support

For issues or questions:
1. Check logs in console output
2. Review `SETUP_CLAUDE.md` for setup issues
3. See `TEST_CLAUDE.md` for testing examples
