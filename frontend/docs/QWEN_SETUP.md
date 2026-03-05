# Qwen3.5-4b Integration Guide

This guide explains how to set up, use, and deploy the Qwen3.5-4b AI model integration in your Research Agent application.

## Table of Contents

- [Overview](#overview)
- [Backend Options](#backend-options)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Railway Deployment](#railway-deployment)
- [API Usage](#api-usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

Qwen3.5-4b is a powerful 4-billion parameter language model from Alibaba's Qwen series. This integration supports multiple backend providers, giving you flexibility in how you access the model:

- **Hugging Face Inference API** - Easiest to set up, works in both dev and production
- **Alibaba DashScope** - Official API for Qwen models
- **OpenAI-compatible APIs** - Works with vLLM, Ollama, LM Studio, and other self-hosted solutions

## Backend Options

### 1. Hugging Face Inference API (Recommended for Getting Started)

**Pros:**
- Free tier available
- Easy setup
- Reliable and fast
- Works in both development and production

**Cons:**
- Rate limits on free tier
- May need to upgrade for heavy usage

**Setup:**
1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens → New token
3. Create a token with `read` permissions
4. Set environment variables:

```bash
QWEN_BACKEND=huggingface
QWEN_API_KEY=hf_your_token_here
QWEN_MODEL=Qwen/Qwen2.5-4B-Instruct
```

### 2. Alibaba DashScope (Official Qwen API)

**Pros:**
- Official API from Alibaba
- Best performance for Qwen models
- Access to latest Qwen models
- Generous free tier

**Cons:**
- Requires Alibaba Cloud account
- Regional availability may vary

**Setup:**
1. Create an account at [dashscope.aliyun.com](https://dashscope.aliyun.com)
2. Navigate to API-KEY management
3. Create a new API key
4. Set environment variables:

```bash
QWEN_BACKEND=dashscope
QWEN_API_KEY=sk_your_dashscope_key_here
QWEN_MODEL=qwen-plus  # or qwen-turbo, qwen-max
```

### 3. OpenAI-Compatible APIs (Self-Hosted)

**Pros:**
- Full control over the