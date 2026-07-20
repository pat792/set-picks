"""L2 social / BD demand-gen CLI — draft → approve → publish.

Examples:
  python3.13 -m crew.scripts.social_demand_gen draft --platform x --body "Show night. Lock your picks."
  python3.13 -m crew.scripts.social_demand_gen approve <draft_id> --approver eic
  CREW_SOCIAL_PUBLISH_ENABLED=true python3.13 -m crew.scripts.social_demand_gen publish <draft_id>
  python3.13 -m crew.scripts.social_demand_gen list
"""

from __future__ import annotations

import argparse
import json
import sys

from crew.tools.social import (
    approve_social_draft,
    list_packs,
    social_draft_pack,
    social_publish,
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="L2 human-gated social/BD demand gen")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_draft = sub.add_parser("draft", help="Create a draft pack")
    p_draft.add_argument("--platform", required=True)
    p_draft.add_argument("--body", required=True)
    p_draft.add_argument("--title", default="")
    p_draft.add_argument("--kind", choices=["social", "bd"], default="social")
    p_draft.add_argument("--dry-run", action="store_true")

    p_approve = sub.add_parser("approve", help="EiC/CCO approve a draft")
    p_approve.add_argument("draft_id")
    p_approve.add_argument("--approver", required=True, help="eic | cco")
    p_approve.add_argument("--kind", choices=["social", "bd"], default=None)
    p_approve.add_argument("--dry-run", action="store_true")

    p_publish = sub.add_parser("publish", help="Publish an approved draft")
    p_publish.add_argument("draft_id")
    p_publish.add_argument("--kind", choices=["social", "bd"], default=None)
    p_publish.add_argument(
        "--dry-run",
        action="store_true",
        help="Plan only (default for safety if you forget env — also pass explicitly)",
    )
    p_publish.add_argument(
        "--live",
        action="store_true",
        help="Actually publish (requires CREW_SOCIAL_PUBLISH_ENABLED=true)",
    )

    p_list = sub.add_parser("list", help="List packs")
    p_list.add_argument("--kind", choices=["social", "bd"], default="social")
    p_list.add_argument("--status", choices=["draft", "approved", "published"], default=None)

    args = parser.parse_args(argv)

    if args.cmd == "draft":
        result = social_draft_pack(
            args.platform,
            args.body,
            kind=args.kind,
            title=args.title,
            dry_run=args.dry_run,
            persist=not args.dry_run,
        )
    elif args.cmd == "approve":
        result = approve_social_draft(
            args.draft_id,
            approver=args.approver,
            kind=args.kind,
            dry_run=args.dry_run,
        )
    elif args.cmd == "publish":
        dry_run = not args.live or args.dry_run
        result = social_publish(
            draft_id=args.draft_id,
            kind=args.kind,
            dry_run=dry_run,
            approved=True,
        )
    else:
        items = list_packs(kind=args.kind, status=args.status)
        print(json.dumps(items, indent=2))
        return 0

    print(json.dumps({"ok": result.ok, "dry_run": result.dry_run, "message": result.message, "data": result.data}, indent=2))
    return 0 if result.ok else 1


if __name__ == "__main__":
    sys.exit(main())
