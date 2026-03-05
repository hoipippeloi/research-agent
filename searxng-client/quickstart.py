#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Start Example for SearXNG API

This script demonstrates the simplest way to get started with the SearXNG API.
"""

import sys
import io

# Set stdout to handle UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from searxng_client import SearXNGClient


def main():
    # Initialize the client
    client = SearXNGClient()

    print("🚀 SearXNG API Quick Start")
    print("=" * 60)

    # Example 1: Simple search
    print("\n📝 Example 1: Simple Search")
    print("-" * 60)
    results = client.search_general("python requests library")
    print(f"Found {len(results['results'])} results for 'python requests library'")
    if results["results"]:
        print(f"First result: {results['results'][0]['title']}")
        print(f"URL: {results['results'][0]['url']}")

    # Example 2: Code search
    print("\n💻 Example 2: Code Search")
    print("-" * 60)
    results = client.search_code("how to use asyncio in python")
    print(f"Found {len(results['results'])} code-related results")
    if results["results"]:
        print(f"First result: {results['results'][0]['title']}")
        print(f"URL: {results['results'][0]['url']}")

    # Example 3: Academic search
    print("\n🎓 Example 3: Academic Search")
    print("-" * 60)
    results = client.search_academic("transformer neural networks")
    print(f"Found {len(results['results'])} academic papers")
    if results["results"]:
        print(f"First paper: {results['results'][0]['title']}")
        print(f"URL: {results['results'][0]['url']}")

    # Example 4: Custom search with specific engines
    print("\n🎯 Example 4: Custom Search")
    print("-" * 60)
    results = client.search("docker kubernetes", engines=["github", "brave"])
    print(f"Found {len(results['results'])} results from GitHub and Brave")
    if results["results"]:
        print(f"First result: {results['results'][0]['title']}")
        print(f"Engine: {results['results'][0]['engine']}")

    print("\n✅ Quick start complete!")
    print("\n💡 Next steps:")
    print(
        "   - Import the client in your code: from searxng_client import SearXNGClient"
    )
    print("   - Check the README.md for detailed API documentation")
    print("   - Explore the available search engines and options")
    print("\n🌐 API Endpoint: https://searxng-production-b099.up.railway.app")


if __name__ == "__main__":
    main()
