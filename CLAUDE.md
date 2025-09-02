# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

quail-js is a JavaScript client library for the Quail.ink API, providing a comprehensive interface for managing newsletters, subscriptions, posts, tweets, and user management. The library is written in TypeScript and JavaScript and compiled into a single ES module bundle.

## Development Commands

- `pnpm run build` - Build the library using Rollup
- The project uses pnpm as the package manager (pnpm-lock.yaml present)

## Architecture

### Core Components

The library is structured around two main client classes:

1. **Client** (`src/core.ts`) - Main API client for Quail.ink
   - Handles authentication via access tokens or API keys
   - Supports both Bearer token and X-QUAIL-KEY authentication
   - Provides methods for users, lists, posts, subscriptions, comments, tweets, and file uploads

2. **AuxiliaClient** (`src/auxilia.js`) - Extended client for additional services
   - Handles payment-related operations (Stripe, PayPal, Wise, crypto)
   - Provides AI-powered content generation (frontmatter, metadata, tweets)
   - Manages orders, referrals, abuse reports, and task operations

### Library Structure

- `src/main.js` - Main entry point that exports both clients and utility modules
- `src/lib/` - Utility modules:
  - `auth.js` - Authentication utilities using localStorage and window globals
  - `request.js` - HTTP request handlers for JSON and FormData
  - `error.js` - Error parsing and formatting utilities
  - `util.js` - DOM manipulation utilities (inject/displace scripts/styles)
  - `i18n.js` - Internationalization support with message translations

### Authentication Flow

The library supports multiple authentication methods:
- Access tokens from localStorage (`auth` key)
- Access tokens from `window._access_token`
- API keys via X-QUAIL-KEY header
- Ephemeral token exchange for secure authentication

### Build System

- Uses Rollup with TypeScript plugin for compilation
- Outputs to `dist/quail.min.js` as ES module
- Supports both TypeScript (core.ts) and JavaScript files
- Source maps enabled for debugging

## Key Patterns

- All API methods return Promises
- Both clients inherit from similar base patterns with request/requestFormData methods
- Error handling follows a consistent format with structured error objects
- Browser-specific utilities for DOM manipulation and localStorage access
- Multi-language support with fallback to English
