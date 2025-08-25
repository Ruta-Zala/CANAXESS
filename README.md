# Axe Thrower

This is a simple example of how to use the Axe-Core library to check the accessibility of multiple URLs at the same time.

## How to use it

1. Run `npm install` to get all the required items.

2. Run `npm run dev`.

3. Api Curl

```
curl --location 'http://localhost:8080/audit' \
--header 'Content-Type: application/json' \
--header 'x-api-key: test' \
--data '{"urls":["https://chatgpt.com", "https://youtube.com" ]}'
```

4. Api response

```
{
    "auditedAt": "2025-08-25T12:13:29.109Z",
    "timingsMs": {
        "total": 8038
    },
    "summary": [
        {
            "url": "https://chatgpt.com/",
            "totalViolations": 2,
            "totalIncompleteViolations": 2
        },
        {
            "url": "https://youtube.com/",
            "totalViolations": 6,
            "totalIncompleteViolations": 0
        }
    ],
    "violations": [
        {
            "url": "https://chatgpt.com/",
            "frameUrl": "https://chatgpt.com/",
            "id": "aria-dialog-name",
            "impact": "serious",
            "description": "Ensure every ARIA dialog and alertdialog node has an accessible name",
            "help": "ARIA dialog and alertdialog nodes should have an accessible name",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/aria-dialog-name?application=axeAPI",
            "nodes": [
                {
                    "html": "<div role=\"dialog\" id=\"radix-«r4»\" aria-describedby=\"radix-«r6»\" aria-labelledby=\"radix-«r5»\" data-state=\"open\" class=\"popover bg-token-main-surface-primary relative start-1/2 col-auto col-start-2 row-auto row-start-2 h-full w-full text-start ltr:-translate-x-1/2 rtl:translate-x-1/2 rounded-2xl shadow-long flex flex-col focus:outline-hidden max-w-lg overflow-hidden\" tabindex=\"-1\" style=\"pointer-events: auto;\">",
                    "target": [
                        "#radix-«r4»"
                    ],
                    "failureSummary": "Fix any of the following:\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute"
                }
            ]
        },
        {
            "url": "https://chatgpt.com/",
            "frameUrl": "https://chatgpt.com/",
            "id": "empty-heading",
            "impact": "minor",
            "description": "Ensure headings have discernible text",
            "help": "Headings should not be empty",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/empty-heading?application=axeAPI",
            "nodes": [
                {
                    "html": "<h2 id=\"radix-«r5»\" class=\"text-token-text-primary text-lg font-normal\"></h2>",
                    "target": [
                        "#radix-«r5»"
                    ],
                    "failureSummary": "Fix any of the following:\n  Element does not have text that is visible to screen readers\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute"
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "aria-prohibited-attr",
            "impact": "serious",
            "description": "Ensure ARIA attributes are not prohibited for an element's role",
            "help": "Elements must only use permitted ARIA attributes",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/aria-prohibited-attr?application=axeAPI",
            "nodes": [
                {
                    "html": "<yt-icon-button id=\"guide-button\" pressed=\"true\" toggleable=\"true\" class=\"style-scope ytd-app\" aria-label=\"Guide\">",
                    "target": [
                        "yt-icon-button[pressed=\"true\"]"
                    ],
                    "failureSummary": "Fix all of the following:\n  aria-label attribute cannot be used on a yt-icon-button with no valid role attribute."
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "aria-required-parent",
            "impact": "critical",
            "description": "Ensure elements with an ARIA role that require parent roles are contained by them",
            "help": "Certain ARIA roles must be contained by particular parents",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/aria-required-parent?application=axeAPI",
            "nodes": [
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"true\" is-active=\"\" aria-label=\"Home\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[is-active=\"\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Required ARIA parent role not present: tablist"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"Shorts\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"Shorts\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Required ARIA parent role not present: tablist"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"Subscriptions\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"Subscriptions\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Required ARIA parent role not present: tablist"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"You\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"You\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Required ARIA parent role not present: tablist"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"History\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"History\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Required ARIA parent role not present: tablist"
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "button-name",
            "impact": "critical",
            "description": "Ensure buttons have discernible text",
            "help": "Buttons must have discernible text",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/button-name?application=axeAPI",
            "nodes": [
                {
                    "html": "<button id=\"button\" class=\"style-scope yt-icon-button\" aria-pressed=\"true\">",
                    "target": [
                        "yt-icon-button[pressed=\"true\"] > button"
                    ],
                    "failureSummary": "Fix any of the following:\n  Element does not have inner text that is visible to screen readers\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute\n  Element does not have an implicit (wrapped) <label>\n  Element does not have an explicit <label>\n  Element's default semantics were not overridden with role=\"none\" or role=\"presentation\""
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "empty-heading",
            "impact": "minor",
            "description": "Ensure headings have discernible text",
            "help": "Headings should not be empty",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/empty-heading?application=axeAPI",
            "nodes": [
                {
                    "html": "<h1 class=\"ytdMiniplayerInfoBarTitle\"></h1>",
                    "target": [
                        ".ytdMiniplayerInfoBarTitle"
                    ],
                    "failureSummary": "Fix any of the following:\n  Element does not have text that is visible to screen readers\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute"
                },
                {
                    "html": "<h1></h1>",
                    "target": [
                        ".ytdMiniplayerInfoBarSubtitle > h1"
                    ],
                    "failureSummary": "Fix any of the following:\n  Element does not have text that is visible to screen readers\n  aria-label attribute does not exist or is empty\n  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n  Element has no title attribute"
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "landmark-unique",
            "impact": "moderate",
            "description": "Ensure landmarks are unique",
            "help": "Landmarks should have a unique role or role/label/title (i.e. accessible name) combination",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/landmark-unique?application=axeAPI",
            "nodes": [
                {
                    "html": "<tp-yt-app-drawer id=\"guide\" align=\"start\" role=\"navigation\" class=\"style-scope ytd-app\" style=\"transition-duration: 200ms; touch-action: pan-y;\" position=\"left\" swipe-open=\"\">",
                    "target": [
                        "#guide"
                    ],
                    "failureSummary": "Fix any of the following:\n  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable"
                }
            ]
        },
        {
            "url": "https://youtube.com/",
            "frameUrl": "https://www.youtube.com/",
            "id": "nested-interactive",
            "impact": "serious",
            "description": "Ensure interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies",
            "help": "Interactive controls must not be nested",
            "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/nested-interactive?application=axeAPI",
            "nodes": [
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"true\" is-active=\"\" aria-label=\"Home\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[is-active=\"\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Using a negative tabindex on an element inside an interactive control does not prevent assistive technologies from focusing the element (even with aria-hidden=\"true\")"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"Subscriptions\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"Subscriptions\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Using a negative tabindex on an element inside an interactive control does not prevent assistive technologies from focusing the element (even with aria-hidden=\"true\")"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"You\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"You\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Using a negative tabindex on an element inside an interactive control does not prevent assistive technologies from focusing the element (even with aria-hidden=\"true\")"
                },
                {
                    "html": "<ytd-mini-guide-entry-renderer class=\"style-scope ytd-mini-guide-renderer\" system-icons=\"\" frosted-glass=\"\" role=\"tab\" tabindex=\"0\" aria-selected=\"false\" aria-label=\"History\">",
                    "target": [
                        "ytd-mini-guide-entry-renderer[aria-label=\"History\"]"
                    ],
                    "failureSummary": "Fix any of the following:\n  Using a negative tabindex on an element inside an interactive control does not prevent assistive technologies from focusing the element (even with aria-hidden=\"true\")"
                }
            ]
        }
    ],
    "numberOfURLsTested": 2
}
```

<video controls src="Screencast from 25-08-25 06:55:17 PM IST.webm" title="Title"></video>