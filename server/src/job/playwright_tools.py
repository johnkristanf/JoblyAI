"""
playwright_tools.py
--------------------
Playwright tool functions used by the LLM agent during automated job application.
Each function receives a Playwright `Page` object and executes a browser action.
The matching OpenAI function-call schemas are exported as `TOOL_SCHEMAS`.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.sync_api import Page

logger = logging.getLogger("playwright_tools")


# ---------------------------------------------------------------------------
# Generic tools
# ---------------------------------------------------------------------------

def navigate_to_url(page: "Page", url: str) -> str:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20_000)
        page.wait_for_load_state("networkidle", timeout=8_000)
    except Exception:
        pass
    return f"Navigated to {url}. Current URL: {page.url}"


def get_page_snapshot(page: "Page") -> str:
    """Return a trimmed text snapshot of the current page for LLM context."""
    try:
        text = page.inner_text("body")
        # Truncate to avoid exceeding LLM context limits
        return text[:6000].strip()
    except Exception as e:
        return f"Could not get snapshot: {e}"


def click_element_by_text(page: "Page", text: str) -> str:
    """Click the first visible button or link whose label contains `text`."""
    for role in ("button", "link"):
        loc = page.get_by_role(role, name=text, exact=False)  # type: ignore[arg-type]
        if loc.count() > 0:
            try:
                loc.first.click(timeout=5_000)
                return f"Clicked {role} with text '{text}'"
            except Exception as e:
                return f"Found {role} '{text}' but click failed: {e}"
    # Fallback: any element containing the text
    try:
        loc = page.locator(f"text=/{text}/i")
        loc.first.click(timeout=5_000)
        return f"Clicked element with text '{text}'"
    except Exception as e:
        return f"Could not click element with text '{text}': {e}"


def click_element_by_selector(page: "Page", selector: str) -> str:
    try:
        page.locator(selector).first.click(timeout=5_000)
        return f"Clicked element '{selector}'"
    except Exception as e:
        return f"Could not click '{selector}': {e}"


def fill_input_by_label(page: "Page", label: str, value: str) -> str:
    try:
        field = page.get_by_label(label, exact=False)
        field.first.fill(value, timeout=5_000)
        return f"Filled field '{label}' with value"
    except Exception as e:
        return f"Could not fill '{label}': {e}"


def fill_input_by_selector(page: "Page", selector: str, value: str) -> str:
    try:
        page.locator(selector).first.fill(value, timeout=5_000)
        return f"Filled '{selector}'"
    except Exception as e:
        return f"Could not fill '{selector}': {e}"


def select_option_by_label(page: "Page", label: str, option_text: str) -> str:
    try:
        sel = page.get_by_label(label, exact=False).first
        sel.select_option(label=option_text, timeout=5_000)
        return f"Selected '{option_text}' in '{label}'"
    except Exception as e:
        return f"Could not select '{option_text}' in '{label}': {e}"


def wait_for_element(page: "Page", selector: str, timeout_ms: int = 5000) -> str:
    try:
        page.wait_for_selector(selector, state="visible", timeout=timeout_ms)
        return f"Element '{selector}' is visible"
    except Exception as e:
        return f"Timed out waiting for '{selector}': {e}"


def scroll_to_bottom(page: "Page") -> str:
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    return "Scrolled to bottom of page"


# ---------------------------------------------------------------------------
# Site-specific tools
# ---------------------------------------------------------------------------

def linkedin_click_easy_apply(page: "Page") -> str:
    """Click LinkedIn's Easy Apply or Apply button."""
    for label in ("Easy Apply", "Apply", "Apply now"):
        loc = page.get_by_role("button", name=label, exact=False)
        if loc.count() == 0:
            loc = page.get_by_role("link", name=label, exact=False)
        if loc.count() > 0:
            try:
                loc.first.click(timeout=5_000)
                return f"Clicked LinkedIn button: '{label}'"
            except Exception:
                continue
    return "LinkedIn apply button not found"


def jobstreet_click_apply(page: "Page") -> str:
    """Click Jobstreet's apply button."""
    for selector in (
        "button[data-automation='job-detail-apply']",
        "a[data-automation='job-detail-apply']",
    ):
        try:
            el = page.locator(selector)
            if el.count() > 0:
                el.first.click(timeout=5_000)
                return "Clicked Jobstreet apply button"
        except Exception:
            continue
    return click_element_by_text(page, "Apply")


def glassdoor_click_apply(page: "Page") -> str:
    """Click Glassdoor's apply button."""
    for label in ("Easy Apply", "Apply Now", "Apply"):
        loc = page.get_by_role("button", name=label, exact=False)
        if loc.count() == 0:
            loc = page.get_by_role("link", name=label, exact=False)
        if loc.count() > 0:
            try:
                loc.first.click(timeout=5_000)
                return f"Clicked Glassdoor button: '{label}'"
            except Exception:
                continue
    return "Glassdoor apply button not found"


def beebee_click_apply(page: "Page") -> str:
    """Click Beebee's apply button."""
    return click_element_by_text(page, "Apply")


# ---------------------------------------------------------------------------
# Tool dispatcher — maps LLM tool names to callables
# ---------------------------------------------------------------------------

TOOL_DISPATCH: dict[str, callable] = {
    "navigate_to_url":          lambda page, **kw: navigate_to_url(page, kw["url"]),
    "get_page_snapshot":        lambda page, **kw: get_page_snapshot(page),
    "click_element_by_text":    lambda page, **kw: click_element_by_text(page, kw["text"]),
    "click_element_by_selector":lambda page, **kw: click_element_by_selector(page, kw["selector"]),
    "fill_input_by_label":      lambda page, **kw: fill_input_by_label(page, kw["label"], kw["value"]),
    "fill_input_by_selector":   lambda page, **kw: fill_input_by_selector(page, kw["selector"], kw["value"]),
    "select_option_by_label":   lambda page, **kw: select_option_by_label(page, kw["label"], kw["option_text"]),
    "wait_for_element":         lambda page, **kw: wait_for_element(page, kw["selector"], kw.get("timeout_ms", 5000)),
    "scroll_to_bottom":         lambda page, **kw: scroll_to_bottom(page),
    "linkedin_click_easy_apply":lambda page, **kw: linkedin_click_easy_apply(page),
    "jobstreet_click_apply":    lambda page, **kw: jobstreet_click_apply(page),
    "glassdoor_click_apply":    lambda page, **kw: glassdoor_click_apply(page),
    "beebee_click_apply":       lambda page, **kw: beebee_click_apply(page),
}


# ---------------------------------------------------------------------------
# OpenAI function-call schemas
# ---------------------------------------------------------------------------

TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "navigate_to_url",
            "description": "Navigate the browser to a given URL and wait for the page to load.",
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string", "description": "The full URL to navigate to"}},
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_page_snapshot",
            "description": "Get a text snapshot of the current page content to understand what is visible.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "click_element_by_text",
            "description": "Click the first visible button or link whose label contains the given text.",
            "parameters": {
                "type": "object",
                "properties": {"text": {"type": "string", "description": "Visible text of the element to click"}},
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "click_element_by_selector",
            "description": "Click an element using a CSS or XPath selector.",
            "parameters": {
                "type": "object",
                "properties": {"selector": {"type": "string", "description": "CSS or XPath selector"}},
                "required": ["selector"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fill_input_by_label",
            "description": "Fill a form input field identified by its visible label text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "label": {"type": "string", "description": "Visible label text of the input"},
                    "value": {"type": "string", "description": "Value to type into the field"},
                },
                "required": ["label", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fill_input_by_selector",
            "description": "Fill a form input field using a CSS or XPath selector.",
            "parameters": {
                "type": "object",
                "properties": {
                    "selector": {"type": "string", "description": "CSS or XPath selector for the input"},
                    "value": {"type": "string", "description": "Value to type into the field"},
                },
                "required": ["selector", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "select_option_by_label",
            "description": "Select an option from a <select> dropdown identified by its label.",
            "parameters": {
                "type": "object",
                "properties": {
                    "label": {"type": "string", "description": "Visible label of the select element"},
                    "option_text": {"type": "string", "description": "Text of the option to select"},
                },
                "required": ["label", "option_text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "wait_for_element",
            "description": "Wait for a CSS selector to become visible on the page.",
            "parameters": {
                "type": "object",
                "properties": {
                    "selector": {"type": "string", "description": "CSS selector to wait for"},
                    "timeout_ms": {"type": "integer", "description": "Max wait time in milliseconds (default 5000)"},
                },
                "required": ["selector", "timeout_ms"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "scroll_to_bottom",
            "description": "Scroll to the bottom of the current page.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "linkedin_click_easy_apply",
            "description": "Click the Easy Apply or Apply button on a LinkedIn job page.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "jobstreet_click_apply",
            "description": "Click the Apply button on a Jobstreet job page.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "glassdoor_click_apply",
            "description": "Click the Easy Apply or Apply Now button on a Glassdoor job page.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "beebee_click_apply",
            "description": "Click the Apply button on a Beebee job page.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

