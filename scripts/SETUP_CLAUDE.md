# Claude API Integration for Date Correction

This script now includes intelligent date auto-correction using Claude Haiku API. It handles any malformed date, not just hardcoded typos.

## How It Works

### Three-Layer Date Correction Strategy:

1. **Strict Validation** - Only accepts valid month/day combinations
2. **Local Correction** - Uses predefined typo mappings for common OCR errors (fast, free)
3. **Claude AI Correction** - Falls back to Claude Haiku for any unknown typos (intelligent, cost-efficient)

### Example Corrections:
```
Fee 27   → Feb 27   (Local)
Psy 4    → Sep 4    (Local)
Xec 15   → Dec 15   (Claude)  ← Would fail local correction, but Claude understands it
Jne 8    → Jun 8    (Claude)  ← Future typo, Claude handles it
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in to your account
3. Create an API key in Settings → API Keys
4. Copy your API key

### 3. Set Environment Variable

**On Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "your-api-key-here"
```

**On Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
```

**On macOS/Linux:**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

**Or add to `.env.local` in project root:**
```
ANTHROPIC_API_KEY=your-api-key-here
```

### 4. Run the Scraper

```bash
python scripts/auto_post_clean_data.py
```

## Output Example

```
Processing 50 items from raw data...
================================================================================
✅ SAVE [1] University A (Aug 1, 2026 → Aug 27, 2026)
  🔧 Auto-corrected 'Fee 27' → 'Feb 27' for University B
  🤖 Claude corrected 'Xec 15' → 'Dec 15' for University C
❌ SKIP [5] University D: No valid dates found

📊 PROCESSING SUMMARY
================================================================================
Total items processed: 50
✅ Items saved: 48
❌ Items skipped: 2
🔧 Dates auto-corrected (local): 2
🤖 Dates corrected by Claude: 1

📤 Posting 48 records...
🎉 Data seeding successful!
   Inserted 48 university record(s).
```

## Cost

Claude Haiku is extremely cost-efficient (~$0.80 per 1M input tokens, ~$4 per 1M output tokens). 
For date correction (very short prompts), each correction costs less than **$0.001 USD**.

For 1000 items with a few unknown typos, expect less than **$0.01 USD** in API costs.

## Disabling Claude

If you don't set `ANTHROPIC_API_KEY`, the script will:
- Still process and correct known typos locally
- Fall back to skipping items with unknown typos
- Display a warning that Claude API is not available

Example output without Claude:
```
✓ Processing with local corrections only (Claude API not available)
🔧 Auto-corrected 'Fee 27' → 'Feb 27'
⚠️  Could not correct date 'Xec 15' (would need Claude API)
```

## Future Improvements

The script now handles ANY future typo patterns:
- You don't need to manually add new typo mappings
- Claude learns the context and corrects intelligently
- Add more correction logic without changing code structure

## Troubleshooting

### "Claude API initialization failed"
- Check if `ANTHROPIC_API_KEY` is set correctly
- Verify your API key is valid on console.anthropic.com
- Check if anthropic package is installed: `pip install anthropic`

### Dates still not being corrected
- Check the logs for "Could not correct date" messages
- If it says "Claude corrected", check your ANTHROPIC_API_KEY is valid
- Some dates may be too corrupted to reasonably guess (e.g., "XXXXXXX 99")

### High API costs?
- Very unlikely - short date correction prompts are cheap
- Check your Anthropic dashboard for actual usage
- Consider reducing date extraction regex if extracting invalid dates
