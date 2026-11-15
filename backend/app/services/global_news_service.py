"""Verified news feed placeholder until a permitted live provider is configured."""

from typing import Any, Dict, List, Optional


class GlobalNewsService:
    """Avoid serving stale or invented articles as current market news."""

    @staticmethod
    def get_latest_news(category: Optional[str] = None) -> List[Dict[str, Any]]:
        # No live, redistributable news provider is configured. The UI presents
        # its existing empty-state message instead of hard-coded sample articles.
        del category
        return []


global_news_service = GlobalNewsService()
