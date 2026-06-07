# Testing Claude Date Correction

## Quick Test

### 1. Create a test data file

Save this as `test_data.json` in the scripts folder:

```json
{
  "results": [
    {
      "university": "Test University 1",
      "category": "Admission",
      "content": "Admissions open from Fee 27 to Mar 15. Computer Science and Engineering programs available."
    },
    {
      "university": "Test University 2",
      "category": "Admission",
      "content": "Applications open Psy 5 through Noy 30. Business and IT programs."
    },
    {
      "university": "Test University 3",
      "category": "Admission",
      "content": "Dates: Xec 10 - Jne 20. All programs including Data Science."
    }
  ]
}
```

### 2. Set your API key

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

### 3. Run the test

```bash
python scripts/auto_post_clean_data.py
```

### 4. Expected Output

```
✓ Claude API enabled (Haiku model)

Processing 3 items from raw data...
================================================================================
  🔧 Auto-corrected 'Fee 27' → 'Feb 27' for Test University 1
✅ SAVE [1] Test University 1 (Feb 27, 2026 → Mar 15, 2026)
  🔧 Auto-corrected 'Psy 5' → 'Sep 5' for Test University 2
  🔧 Auto-corrected 'Noy 30' → 'Nov 30' for Test University 2
✅ SAVE [2] Test University 2 (Sep 5, 2026 → Nov 30, 2026)
  🤖 Claude corrected 'Xec 10' → 'Dec 10' for Test University 3
  🤖 Claude corrected 'Jne 20' → 'Jun 20' for Test University 3
✅ SAVE [3] Test University 3 (Dec 10, 2026 → Jun 20, 2026)

📊 PROCESSING SUMMARY
================================================================================
Total items processed: 3
✅ Items saved: 3
❌ Items skipped: 0
🔧 Dates auto-corrected (local): 3
🤖 Dates corrected by Claude: 2

Clean data exported to clean_data.json
================================================================================

📤 Posting 3 records to https://smart-admission-guide.vercel.app/api/universities
   (replace=true)...

✅ POST succeeded (HTTP 201).

🎉 Data seeding successful!
   Inserted 3 university record(s).

📋 Inserted universities:
   ✓ Test University 1 (id=1)
   ✓ Test University 2 (id=2)
   ✓ Test University 3 (id=3)
```

## What This Proves

✅ **Local corrections work** - "Fee 27", "Psy 5", "Noy 30" corrected by predefined mappings
✅ **Claude corrections work** - "Xec 10" and "Jne 20" (future/unknown typos) corrected by AI
✅ **Data is pushed** - All 3 universities successfully inserted to database
✅ **Logging is comprehensive** - Every step tracked and displayed

## Adding More Test Cases

Modify `test_data.json` to test new typo patterns:

```json
{
  "results": [
    {
      "university": "Future Typo Test",
      "category": "Admission",
      "content": "Dates: Fbr 10 - Jly 20"
    }
  ]
}
```

Claude will handle "Fbr" → "Feb" and "Jly" → "Jul" automatically, no code changes needed!

## Cleanup

After testing, you can:
1. Delete `test_data.json` and `clean_data.json`
2. Or keep them for regression testing
