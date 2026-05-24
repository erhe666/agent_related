---
name: save-article
description: Fetch an article from a URL, save it as markdown, and push to GitHub.
---

# Save Article Skill

Save an online article to this GitHub project and push it.

## Usage

Invoke with a URL:
```
/save-article https://example.com/article
```

## Instructions

When invoked, follow these steps:

1. **Fetch the article**: Use `curl` with browser-like headers to download the HTML:
   ```bash
   curl -sL --connect-timeout 15 \
     -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" \
     -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
     -H "Accept-Language: zh-CN,zh;q=0.9" \
     "<URL>" -o "$HOME/article_temp.html"
   ```

2. **Extract title**: Parse the HTML to find `<h1 class="rich_media_title">` (WeChat) or `<title>` (general).

3. **Extract content**: Use Node.js to extract the article body from the HTML. For WeChat articles, target `<div class="rich_media_content">`. For general pages, target `<article>` or `<body>`.

4. **Convert to markdown**: Run `node scripts/save-article.js` which handles:
   - HTML entity decoding
   - Image extraction (`data-src` for WeChat, `src` for general)
   - Code block preservation (`<pre><code>`)
   - Inline code (`<code>`)
   - Links (`<a href>`)
   - Headings (`<h1>`-`<h6>`)
   - Bold/italic (`<strong>`, `<em>`)
   - Lists (`<ul>`, `<ol>`, `<li>`)
   - Removal of all `style`, `data-*`, `class` attributes
   - Whitespace normalization

5. **Choose folder**: By default, save to `articles/`. If the URL domain matches a known pattern (e.g., `mp.weixin.qq.com`), suggest a subfolder. Ask the user if they want a different location.

6. **Generate slug**: Create a filename from the title:
   - Convert to lowercase
   - Replace non-alphanumeric chars with hyphens
   - Collapse multiple hyphens
   - Trim to reasonable length (< 80 chars)

7. **Save the markdown file** to the chosen folder.

8. **Commit and push**:
   ```bash
   git add <filepath>
   git commit -m "Add article: <title>"
   git push origin main
   ```

## Notes

- If the page serves a CAPTCHA or verification page, try different User-Agent headers.
- For WeChat articles (`mp.weixin.qq.com`), the content is in `div.rich_media_content` and images use `data-src` instead of `src`.
- Always clean up the temp HTML file after conversion.
- If the user specifies a custom folder or filename, use that instead of the default.
