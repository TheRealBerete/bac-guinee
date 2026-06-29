"""
Cross-reference script: test known PVs against the ukag API for 2023-2026.

Usage:
    python crossref.py                    # test all PVs, all sessions
    python crossref.py --limit 100        # test first 100 PVs only
    python crossref.py --session 2025     # test only 2025
    python crossref.py --force            # ignore cache, re-query everything
"""

import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import init_db, distinct_pvs, row_count
from app.ukag import cross_reference_pvs


async def main():
    parser = argparse.ArgumentParser(description="Cross-reference PVs with ukag API")
    parser.add_argument("--limit", type=int, default=0, help="Max PVs to test (0 = all)")
    parser.add_argument("--session", type=int, nargs="+", help="Sessions to test (default: 2023-2026)")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between API calls in seconds")
    parser.add_argument("--batch-size", type=int, default=20, help="PVs per batch (pause between batches)")
    parser.add_argument("--force", action="store_true", help="Ignore cache, re-query everything")
    args = parser.parse_args()

    init_db()

    pvs = distinct_pvs()
    print(f"Candidats in DB: {row_count()}")
    print(f"Unique PVs to test: {len(pvs)}")

    if args.limit > 0:
        pvs = pvs[: args.limit]
        print(f"Testing first {len(pvs)} PVs")

    sessions = args.session or [2023, 2024, 2025, 2026]
    total_combos = len(pvs) * len(sessions) * 3  # 3 profiles each
    print(f"Potential API calls: {total_combos} (cached results skipped)")
    print(f"Sessions: {sessions}")
    print(f"Delay: {args.delay}s, Batch size: {args.batch_size}")
    print()

    stats = await cross_reference_pvs(
        pvs,
        sessions=sessions,
        delay=args.delay,
        batch_size=args.batch_size,
    )

    print()
    print("Results:")
    print(f"  Combinations tested: {stats['checked']}")
    print(f"  Found (admitted):   {stats['found']}")
    print(f"  Not found:          {stats['not_found']}")
    print(f"  New candidates:     {stats['new_candidates']}")
    print(f"  Errors:             {stats['errors']}")
    print(f"  Total in DB:        {row_count()}")


if __name__ == "__main__":
    asyncio.run(main())
