from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173/")
            page.goto("http://localhost:5173/")

            # Wait for content to load
            page.wait_for_selector("text=Aqua-AI")
            print("Page loaded")

            # Check for the shortcut hint
            # The hint text depends on the platform, likely "Ctrl K" in this linux environment
            # We look for the 'kbd' element text
            kbd = page.locator("kbd")
            if kbd.count() > 0:
                print(f"Found kbd element with text: {kbd.first.inner_text()}")
            else:
                print("kbd element NOT found")

            # Take a screenshot before interaction
            page.screenshot(path="verification_before.png")

            # Test the shortcut
            print("Pressing Control+K")
            page.keyboard.press("Control+K")

            # Check if input is focused
            search_input = page.get_by_placeholder("Search...")
            is_focused = search_input.is_visible() and  page.evaluate("document.activeElement === document.querySelector('input[placeholder=\"Search...\"]')")

            if is_focused:
                print("SUCCESS: Search input is focused!")
            else:
                print("FAILURE: Search input is NOT focused.")
                # print active element
                active_tag = page.evaluate("document.activeElement.tagName")
                print(f"Active element: {active_tag}")

            # Take a screenshot after interaction (showing focus ring)
            page.screenshot(path="verification_after.png")
            print("Screenshots saved")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
