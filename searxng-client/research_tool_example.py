#!/usr/bin/env python3
"""
Research Tool Integration Example

This example demonstrates how to use SearXNG API as part of a research workflow.
"""

from searxng_client import SearXNGClient
import json
from datetime import datetime


def research_topic(topic: str, max_results: int = 5):
    """
    Research a topic using multiple search strategies.

    Args:
        topic: The topic to research
        max_results: Maximum number of results per category

    Returns:
        Dictionary containing organized research results
    """
    client = SearXNGClient()

    print(f"\n🔍 Researching: {topic}")
    print("=" * 80)

    research_data = {
        "topic": topic,
        "timestamp": datetime.now().isoformat(),
        "general": [],
        "code": [],
        "academic": [],
    }

    # 1. General web search
    print("\n1. General Web Search")
    print("-" * 80)
    try:
        results = client.search_general(topic)
        for i, result in enumerate(results["results"][:max_results], 1):
            print(f"{i}. {result['title']}")
            print(f"   Source: {result.get('engine', 'N/A')}")
            print(f"   URL: {result['url']}")
            if result.get("content"):
                print(f"   Summary: {result['content'][:150]}...")
            print()

            research_data["general"].append(
                {
                    "title": result["title"],
                    "url": result["url"],
                    "engine": result.get("engine"),
                    "content": result.get("content", "")[:200],
                }
            )
    except Exception as e:
        print(f"Error in general search: {e}")

    # 2. Code examples and implementations
    print("\n2. Code Examples & Implementations")
    print("-" * 80)
    try:
        results = client.search_code(f"{topic} implementation example")
        for i, result in enumerate(results["results"][:max_results], 1):
            print(f"{i}. {result['title']}")
            print(f"   Source: {result.get('engine', 'N/A')}")
            print(f"   URL: {result['url']}")
            print()

            research_data["code"].append(
                {
                    "title": result["title"],
                    "url": result["url"],
                    "engine": result.get("engine"),
                }
            )
    except Exception as e:
        print(f"Error in code search: {e}")

    # 3. Academic papers
    print("\n3. Academic Papers & Research")
    print("-" * 80)
    try:
        results = client.search_academic(topic)
        for i, result in enumerate(results["results"][:max_results], 1):
            print(f"{i}. {result['title']}")
            print(f"   Source: {result.get('engine', 'N/A')}")
            print(f"   URL: {result['url']}")
            if result.get("publishedDate"):
                print(f"   Published: {result.get('publishedDate')}")
            print()

            research_data["academic"].append(
                {
                    "title": result["title"],
                    "url": result["url"],
                    "engine": result.get("engine"),
                    "publishedDate": result.get("publishedDate"),
                }
            )
    except Exception as e:
        print(f"Error in academic search: {e}")

    return research_data


def save_research(research_data: dict, filename: str = None):
    """Save research results to a JSON file."""
    if filename is None:
        topic_slug = research_data["topic"].lower().replace(" ", "-")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"research_{topic_slug}_{timestamp}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(research_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Research saved to: {filename}")


def main():
    """Main research workflow."""
    print("=" * 80)
    print("📚 SearXNG Research Tool")
    print("=" * 80)

    # Example 1: Research a programming topic
    print("\n\n🔬 Example 1: Programming Research")
    research_data = research_topic("GraphQL API design", max_results=3)
    save_research(research_data)

    # Example 2: Research a machine learning topic
    print("\n\n🔬 Example 2: Machine Learning Research")
    research_data = research_topic(
        "attention mechanisms in transformers", max_results=3
    )
    save_research(research_data)

    # Example 3: Research a web development topic
    print("\n\n🔬 Example 3: Web Development Research")
    research_data = research_topic(
        "real-time web applications with websockets", max_results=3
    )
    save_research(research_data)

    print("\n\n✅ Research complete!")
    print("\n💡 Tips:")
    print("   - All results are saved as JSON files")
    print("   - You can load and analyze them later")
    print("   - Adjust max_results to get more or fewer results")
    print("   - Use different search strategies for comprehensive research")


if __name__ == "__main__":
    main()
