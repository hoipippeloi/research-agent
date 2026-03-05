# Use the official SearXNG image as base
# Using specific version tag for stability
FROM searxng/searxng:2025.3.3+b5c1c2804

# Copy custom settings with JSON format enabled
COPY settings.yml /etc/searxng/settings.yml

# The official image already exposes port 8888
# and sets up the entry point
