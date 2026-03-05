"""
SearXNG API Client

A Python client for interacting with the SearXNG search API deployed on Railway.
"""

import requests
from typing import List, Dict, Optional
import json


class SearXNGClient:
    """Client for SearXNG search API."""

    def __init__(
        self, base_url: str = "https://searxng-production-b099.up.railway.app"
    ):
        """
        Initialize the SearXNG client.

        Args:
            base_url: The base URL of the SearXNG API
        """
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def search(
        self,
        query: str,
        engines: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        pageno: int = 1,
        time_range: Optional[str] = None,
        format: str = "json",
    ) -> Dict:
        """
        Perform a search query.

        Args:
            query: The search query
            engines: List of search engines to use (e.g., ["brave", "duckduckgo", "github"])
            categories: List of categories (e.g., ["general", "images", "news"])
            pageno: Page number for pagination (starts at 1)
            time_range: Time range filter (e.g., "day", "week", "month", "year")
            format: Response format (default: "json")

        Returns:
            Dictionary containing search results

        Example:
            >>> client = SearXNGClient()
            >>> results = client.search("python async", engines=["brave", "github"])
        """
        params = {"q": query, "format": format, "pageno": pageno}

        if engines:
            params["engines"] = ",".join(engines)

        if categories:
            params["categories"] = ",".join(categories)

        if time_range:
            params["time_range"] = time_range

        response = self.session.get(
            f"{self.base_url}/search", params=params, timeout=30
        )
        response.raise_for_status()

        return response.json()

    def search_code(self, query: str) -> Dict:
        """
        Search for code-related results using GitHub and StackOverflow.

        Args:
            query: The search query

        Returns:
            Dictionary containing search results
        """
        return self.search(query, engines=["github", "stackoverflow"])

    def search_academic(self, query: str) -> Dict:
        """
        Search for academic papers using arXiv.

        Args:
            query: The search query

        Returns:
            Dictionary containing search results
        """
        return self.search(query, engines=["arxiv", "semantic scholar"])

    def search_general(self, query: str) -> Dict:
        """
        Search using general search engines (Brave, DuckDuckGo, Startpage).

        Args:
            query: The search query

        Returns:
            Dictionary containing search results
        """
        return self.search(query, engines=["brave", "duckduckgo", "startpage"])

    def get_suggestions(self, query: str) -> List[str]:
        """
        Get search suggestions for a query.

        Args:
            query: The partial search query

        Returns:
            List of suggestion strings
        """
        response = self.session.get(
            f"{self.base_url}/autocompleter", params={"q": query}, timeout=10
        )
        response.raise_for_status()

        data = response.json()
        # Handle both formats: direct list or dict with "suggestions" key
        if isinstance(data, list):
            return data
        return data.get("suggestions", [])


def main():
    """Example usage of the SearXNG client."""
    client = SearXNGClient()

    print("=" * 80)
    print("SearXNG API Client - Example Usage")
    print("=" * 80)

    print("\n1. General Search Example:")
    print("-" * 80)
    results = client.search_general("machine learning frameworks")
    print(f"Query: {results['query']}")
    print(f"Number of results: {len(results['results'])}")
    print("\nTop 3 results:")
    for i, result in enumerate(results["results"][:3], 1):
        print(f"\n{i}. {result['title']}")
        print(f"   URL: {result['url']}")
        print(f"   Engine: {result.get('engine', 'N/A')}")
        if result.get("content"):
            print(f"   Content: {result['content'][:150]}...")

    print("\n" + "=" * 80)
    print("\n2. Code Search Example:")
    print("-" * 80)
    results = client.search_code("python async await")
    print(f"Query: {results['query']}")
    print(f"Number of results: {len(results['results'])}")
    print("\nTop 3 results:")
    for i, result in enumerate(results["results"][:3], 1):
        print(f"\n{i}. {result['title']}")
        print(f"   URL: {result['url']}")
        print(f"   Engine: {result.get('engine', 'N/A')}")

    print("\n" + "=" * 80)
    print("\n3. Academic Search Example:")
    print("-" * 80)
    results = client.search_academic("neural networks attention mechanism")
    print(f"Query: {results['query']}")
    print(f"Number of results: {len(results['results'])}")
    if results["results"]:
        print("\nTop 3 results:")
        for i, result in enumerate(results["results"][:3], 1):
            print(f"\n{i}. {result['title']}")
            print(f"   URL: {result['url']}")
            print(f"   Engine: {result.get('engine', 'N/A')}")

    print("\n" + "=" * 80)
    print("\n4. Search Suggestions Example:")
    print("-" * 80)
    suggestions = client.get_suggestions("python")
    print(f"Suggestions for 'python': {suggestions[:5]}")

    print("\n" + "=" * 80)
    print("\nClient is ready to use!")
    print(f"API Endpoint: {client.base_url}")
    print("=" * 80)


if __name__ == "__main__":
    main()
