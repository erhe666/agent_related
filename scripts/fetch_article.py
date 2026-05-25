"""Fetch a single WeChat article using Selenium and save as JSON + text files."""
import sys
import json
import re
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def fetch_article(url, output_dir):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    try:
        driver.get(url)
        time.sleep(5)

        # Title
        title = ""
        try:
            title = driver.find_element(By.CSS_SELECTOR, "#activity-name").text.strip()
        except:
            try:
                title = driver.find_element(By.CSS_SELECTOR, ".rich_media_title").text.strip()
            except:
                pass

        # Date
        date_str = ""
        try:
            date_str = driver.find_element(By.CSS_SELECTOR, "#publish_time").text.strip()
        except:
            try:
                date_str = driver.find_element(By.CSS_SELECTOR, ".rich_media_meta_text").text.strip()
            except:
                pass

        # Author / account name
        author = ""
        try:
            author = driver.find_element(By.CSS_SELECTOR, "#js_name").text.strip()
        except:
            try:
                author = driver.find_element(By.CSS_SELECTOR, ".rich_media_meta_nickname").text.strip()
            except:
                pass

        # Content
        content_html = ""
        try:
            content_html = driver.find_element(By.CSS_SELECTOR, "#js_content").get_attribute("innerHTML")
        except:
            try:
                content_html = driver.find_element(By.CSS_SELECTOR, ".rich_media_content").get_attribute("innerHTML")
            except:
                pass

        # Extract plain text from HTML
        # Replace common block elements with newlines
        plain_text = content_html
        plain_text = re.sub(r'<br\s*/?>', '\n', plain_text)
        plain_text = re.sub(r'</p>', '\n\n', plain_text)
        plain_text = re.sub(r'</div>', '\n', plain_text)
        plain_text = re.sub(r'</section>', '\n', plain_text)
        plain_text = re.sub(r'<[^>]+>', '', plain_text)
        plain_text = re.sub(r'&nbsp;', ' ', plain_text)
        plain_text = re.sub(r'&lt;', '<', plain_text)
        plain_text = re.sub(r'&gt;', '>', plain_text)
        plain_text = re.sub(r'&amp;', '&', plain_text)
        plain_text = re.sub(r'&quot;', '"', plain_text)
        plain_text = re.sub(r'\n{3,}', '\n\n', plain_text)
        plain_text = plain_text.strip()

        result = {
            "title": title,
            "author": author,
            "date": date_str,
            "content_html": content_html,
            "plain_text": plain_text,
            "url": url
        }

        # Save JSON
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        json_path = out_dir / "article_data.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"Saved JSON to: {json_path}")

        # Save plain text
        txt_path = out_dir / "article_text.txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\n")
            f.write(f"Author: {author}\n")
            f.write(f"Date: {date_str}\n")
            f.write(f"URL: {url}\n")
            f.write("-" * 60 + "\n\n")
            f.write(plain_text)

        print(f"Saved text to: {txt_path}")

        # Print summary
        print(f"\nTitle: {title}")
        print(f"Author: {author}")
        print(f"Date: {date_str}")
        print(f"Text length: {len(plain_text)} chars")

    finally:
        driver.quit()

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else ""
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "article_output"
    if not url:
        print("Usage: python fetch_article.py <wechat_article_url> [output_dir]")
        sys.exit(1)
    fetch_article(url, output_dir)
