# Use the official SearXNG image as base
FROM searxng/searxng:latest

# Copy custom settings with JSON format enabled
COPY settings.yml /etc/searxng/settings.yml

# The official image already exposes port 8888
# and sets up the entry point
