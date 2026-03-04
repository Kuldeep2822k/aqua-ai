from playwright.sync_api import Page, expect, sync_playwright

def verify_a11y(page: Page):
    # Go to app
    page.goto("http://localhost:5173")

    # Go to alerts page
    page.click("text=Alerts")
    page.wait_for_selector("#filter-severity", timeout=5000)

    # Take screenshot of Alerts Page
    page.screenshot(path="alerts_page.png", full_page=True)

    # Go to analytics page
    # Since state-based routing is used, we need to find the "Analytics" button and click it
    page.click("text=Analytics")
    page.wait_for_selector('select[aria-label="Select period"]', timeout=5000)

    # Take screenshot of Analytics Page
    page.screenshot(path="analytics_page.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_a11y(page)
        finally:
            browser.close()
