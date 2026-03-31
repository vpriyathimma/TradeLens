# DEMO_DATA Auto-Update Script

## Quick Start

Update all stock prices to current market values:

```bash
cd /Users/apple/Desktop/TradeLens/backend
python3 update_demo_data.py
```

## What It Does

1. ✅ Fetches **real-time prices** for all 31 stocks from Yahoo Finance
2. ✅ Generates **realistic 30-day historical data** for each stock
3. ✅ **Automatically updates** `routes/stock_routes.py`
4. ✅ Creates a **backup** before making changes
5. ✅ Shows progress for each stock

## When to Run

- **Daily**: For most accurate prices (recommended for production)
- **Weekly**: For general updates
- **Monthly**: Minimum recommended frequency
- **Before demos**: To ensure fresh data

## Example Output

```
============================================================
DEMO_DATA Auto-Update Script
============================================================
Started: 2026-01-07 20:20:00
Updating 31 stocks...

Fetching TITAN.NS... ✅ ₹4,294.00
Fetching TCS.NS... ✅ ₹4,102.55
Fetching RELIANCE.NS... ✅ ₹1,229.85
...

============================================================
Updating stock_routes.py...
============================================================
✅ Backup created: routes/stock_routes.py.backup.20260107_202000
✅ Updated TITAN.NS: ₹4,294.00
✅ Updated TCS.NS: ₹4,102.55
...

✅ Updated 31 stocks in routes/stock_routes.py
📝 Backup saved as: routes/stock_routes.py.backup.20260107_202000

============================================================
✅ Update Complete!
============================================================
```

## After Running

1. **Restart backend**: The Flask dev server will auto-reload
2. **Refresh frontend**: Hard refresh (Cmd+Shift+R)
3. **Verify**: Check a few stocks to confirm updated prices

## Troubleshooting

**If some stocks fail:**
- Yahoo Finance may be rate-limiting
- Wait 5 minutes and run again
- Failed stocks will keep their old data

**If script crashes:**
- Your backup is safe at `routes/stock_routes.py.backup.*`
- Restore with: `cp routes/stock_routes.py.backup.* routes/stock_routes.py`

## Automation (Optional)

### Run Daily at 6 PM

Add to crontab:
```bash
0 18 * * * cd /Users/apple/Desktop/TradeLens/backend && python3 update_demo_data.py >> update.log 2>&1
```

### Run Weekly (Sundays at 6 PM)

```bash
0 18 * * 0 cd /Users/apple/Desktop/TradeLens/backend && python3 update_demo_data.py >> update.log 2>&1
```

## Notes

- Script takes ~2-3 minutes to run (fetching 31 stocks)
- Always creates a backup before updating
- Safe to run multiple times
- Free (uses Yahoo Finance API)
