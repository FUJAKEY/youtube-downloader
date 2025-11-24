from playwright.sync_api import sync_playwright
import os
import time
import random

def verify_drive_functionality():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        username = f"user_{int(time.time())}_{random.randint(1, 1000)}"

        try:
            # 1. Register
            print(f"Navigating to register as {username}...")
            page.goto("http://localhost:3000/register")
            page.fill("input[name='username']", username)
            page.fill("input[name='password']", "password123")
            page.click("button[type='submit']")

            # Should redirect to dashboard
            print("Checking redirection to dashboard...")
            page.wait_for_url("http://localhost:3000/dashboard")

            # 2. Upload File
            print("Opening upload modal...")
            # Click the button that opens the modal
            page.click("button[data-bs-target='#uploadModal']")

            # Wait for modal
            page.wait_for_selector("#uploadModal", state="visible")

            print("Uploading file...")
            # Create a dummy file
            with open("verification/testfile.txt", "w") as f:
                f.write("This is a test file content.")

            page.set_input_files("input[type='file']", "verification/testfile.txt")

            # Click the submit button inside the modal
            # We can be specific about which button
            page.click("#uploadModal button[type='submit']")

            # Wait for navigation/reload
            page.wait_for_load_state("networkidle")

            # 3. Verify File in Dashboard
            print("Verifying file presence...")
            # Check if text exists.
            if page.is_visible("text=testfile.txt"):
                print("File found!")
            else:
                print("File NOT found!")

            # Take screenshot of dashboard with file
            print("Taking screenshot of populated dashboard...")
            page.screenshot(path="verification/dashboard_populated.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_drive_functionality()
