# Scalar Copy Plugin

A browser plugin that adds "Copy Markdown" buttons to Scalar API documentation pages.

## Features

- Extracts OpenAPI specification data from Scalar API documentation pages
- Converts API interface information (including request parameters, request body, responses, etc.) to Markdown format
- Dynamically adds "Copy Markdown" buttons next to each API endpoint header
- Copies generated Markdown content to clipboard when button is clicked

## How It Works

The plugin uses modern Clipboard API with fallback support for better compatibility. It implements debouncing for performance optimization and uses MutationObserver and hashchange event listeners to handle dynamically loaded content.

## Installation

1. Install the plugin in your browser
2. Navigate to any Scalar API documentation page
3. Look for "Copy Markdown" buttons next to API endpoint headers

## Usage

Simply click the "Copy Markdown" button next to any API endpoint to copy its documentation in Markdown format to your clipboard. The button will temporarily change to "✓ Copied" to confirm the action.

## Build

```bash
npm run build
```

This will generate the minified version using uglifyjs.

## License

MIT
