# Project Report: Node.js REST API for Website Accessibility Checking

## Overview
We are developing a **Node.js REST API** to enable accessibility audits for websites. This API will allow users to input a website URL and receive a detailed report on accessibility issues, helping ensure compliance with standards like WCAG (Web Content Accessibility Guidelines). The API is designed to support a web-based widget where users can enter a URL, and the results will be displayed on the same page, enhancing user engagement and accessibility awareness.

This functionality is an evolution of our existing Node.js command-line application, which checks accessibility from a JSON file and generates an HTML report. The new API makes this feature available as a standalone service, accessible to other applications via web requests, improving scalability and integration.

## Purpose and Value
- **User Benefit**: Provides website owners and developers with an easy way to check their site’s accessibility, identifying issues like missing image alt text or insufficient color contrast.
- **Business Value**: Enhances our platform’s offerings by integrating accessibility checks into a user-friendly widget, potentially increasing user retention and demonstrating our commitment to inclusive design.
- **Compliance**: Helps clients meet legal and ethical accessibility standards (e.g., WCAG 2.1), reducing risks of non-compliance.
- **Reusability**: The API can be called by other applications (e.g., internal tools or third-party services), expanding its utility.

## What We Are Building
The API will:
1. **Accept a URL**: Users submit a website URL via a web request (e.g., through a form in our widget).
2. **Render the Page**: Use a headless browser (Puppeteer) to fully load the website, including dynamic content like JavaScript-driven elements.
3. **Run Accessibility Checks**: Use the axe-core library to analyze the page for accessibility violations (e.g., missing alt text, low contrast).
4. **Return Results**: Provide a JSON response with:
   - Total number of accessibility violations.
   - Detailed list of issues, including rule ID, severity (e.g., minor, serious, critical), affected HTML elements, code snippets, and links to help resources.
   - Handling of “incomplete” results (cases where axe-core can’t fully evaluate an issue, e.g., due to dynamic content).
5. **Support Cross-Domain Access**: Allow the API to be called from other websites (e.g., via AJAX), enabling integration into our web-based widget.
6. **Include Error Handling and Validation**: Ensure robust input validation (e.g., valid URLs) and meaningful error messages (e.g., for unreachable websites).
7. **Plan for Future Scalability**: Include placeholders for authentication (e.g., API keys) and rate limiting to manage usage as the service grows.

## How It Works
- **User Interaction**: A user enters a URL into a widget on our web page. The widget sends the URL to the API via an AJAX request.
- **API Processing**:
  - Validates the URL (e.g., ensures it’s a proper http/https address).
  - Launches a headless browser to load the page, waiting for all content to render.
  - Runs axe-core to check for accessibility issues.
  - Processes results, including any “incomplete” checks (e.g., issues needing manual verification).
  - Returns a JSON response with the violation count and detailed issues.
- **Widget Display**: The widget receives the JSON and renders a user-friendly summary (e.g., “5 accessibility issues found”) and detailed issue list (e.g., “Missing alt text on 2 images”).
- **Error Handling**: If the URL is invalid or the site doesn’t load, the API returns a clear error message (e.g., “Invalid URL” or “Site unreachable”).
- **Cross-Domain Support**: The API includes CORS headers, allowing it to be called from any website, ensuring the widget works seamlessly.

## Technical Implementation
The API is built using **Node.js** with the **Express** framework, leveraging:
- **Puppeteer**: A library to control a headless Chrome browser, ensuring full page rendering.
- **Axe-core**: An industry-standard accessibility testing engine, checking against WCAG and best practices.
- **Express Middleware**: Handles JSON parsing, CORS for cross-domain requests, and placeholders for future authentication/rate limiting.
- **Validator**: Ensures input URLs are valid and secure.
- **Error Handling**: Returns appropriate HTTP status codes (e.g., 400 for bad input, 500 for server errors) with JSON error messages.

### Key Features
- **Input Validation**: Checks for valid URLs (http/https) to prevent errors or malicious input.
- **Dynamic Content Handling**: Waits for network activity to stop (networkidle0) to ensure dynamic pages load fully, reducing “incomplete” results.
- **Comprehensive Results**: Returns total violation count, detailed issue data (rule, severity, HTML snippets, help URLs), and incomplete checks for transparency.
- **Scalability**: Includes rate-limiting middleware (currently set to 100 requests/15 minutes) and an authentication placeholder for future use.
- **Cross-Domain Support**: Configured with CORS to allow AJAX calls from any domain.

