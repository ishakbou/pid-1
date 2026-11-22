---
title: HTML basics
description: Write a web page by hand with headings, paragraphs, links, lists, an image and a form, and see the tree of elements that the browser builds from it.
lesson: "8.1"
time: 25 min
sidebar:
  order: 1
---

Every web page you have ever visited started as a plain text file. Not a picture, not a program, just text with some labels in angle brackets. You can write one in any editor, and by the end of this lesson you will have written a small page for a student club, with a logo, two lists and a sign-up form.

## Goal

After this lesson you can:

- Write the skeleton of an HTML page and explain each part.
- Use headings, paragraphs, links, lists and images.
- Build a simple form and say what the browser sends when someone submits it.

## Why it matters

HTML is the one language every website shares. The rest of this module adds style, code and a server around it, but the browser always starts from the HTML. Security work starts there too: forms are where users type data into an application, and in Module 12 you will see what happens when a site trusts that data too much. You cannot judge what a page does if you cannot read it.

## The idea

**HTML** (HyperText Markup Language) is a way to mark up text, so that the browser knows what each part of the text is. You write **tags**, names in angle brackets, around the text. `<h1>` starts a main heading and `</h1>` ends it. The slash marks the end tag.

The start tag, the end tag and everything between them form an **element**. A start tag can carry **attributes**, extra facts written as `name="value"`. For example, in `<a href="about.html">About us</a>` the element is a link, `href` is an attribute that says where it leads, and "About us" is the text the reader clicks.

Think of the labels a teacher writes in the margin of an essay: "title", "quote", "list of examples". The labels do not change the words. They say what the words are. HTML works the same way: `<h2>` says "this is a heading of the second level", not "make this big and bold". How it looks is decided later, by the browser's defaults and by CSS in the next lesson.

Elements sit inside other elements, like folders inside folders in lesson 1.2. A list element holds list items, and the whole page sits inside one `<html>` element. The browser reads this nesting and builds a tree from it.

Here are the elements you will use in this lesson:

| Element | What it marks |
|---|---|
| `<h1>` to `<h6>` | Headings, from the most important to the least |
| `<p>` | A paragraph |
| `<strong>` | Text that matters more than the text around it |
| `<a href="...">` | A link to another page or another site |
| `<ul>`, `<ol>`, `<li>` | A list with bullets, a numbered list, and one item of either |
| `<img src="..." alt="...">` | An image, with a text that describes it |
| `<form>`, `<label>`, `<input>`, `<select>`, `<button>` | A form, and the fields and button inside it |

A few elements, such as `<img>`, `<input>` and `<meta>`, have no content and no end tag. They are called **void elements**: everything they need fits in their attributes.

## Try it

The outputs below come from a user called `sam`. Wherever a path shows `sam`, your screen shows your own username. Create the files with your code editor from lesson 0.5; each file is shown with its name at the top.

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
-->

### 1. Make a folder for the site

```bash
mkdir -p ~/web/site/images
cd ~/web/site
```

The whole module builds one small site in `~/web/site`. The `images` folder will hold the logo.

### 2. Write the smallest real page

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Byte Club</title>
</head>
<body>
  <h1>Byte Club</h1>
  <p>A small club for students who like to take computers apart.</p>
</body>
</html>
```

Every page has this skeleton. Read it from the top:

- `<!DOCTYPE html>` tells the browser that this is modern HTML. It is not a tag, just a fixed first line.
- `<html lang="en">` holds the whole page. `lang` says the text is in English, which helps screen readers pronounce it.
- `<head>` holds facts about the page, which are not shown in the page itself. `charset="utf-8"` says how the text is encoded, the UTF-8 you met in Module 5. The `viewport` line tells phones to use their real width instead of pretending to be a wide screen. `<title>` is the name in the browser tab.
- `<body>` holds everything the reader sees.

The spaces at the start of the lines are only for you. The browser ignores them, so indent in whatever way keeps the nesting easy to read.

### 3. See the tree

The browser turns the text into a tree of elements before it draws anything. Python's standard library has an HTML reader too, so you can print that tree yourself. Save this small script one folder up, in `~/web`:

```python title="../outline.py"
"""Print the elements of an HTML file as an indented tree."""
import sys
from html.parser import HTMLParser

VOID = {"meta", "link", "img", "input", "br", "hr"}  # elements with no end tag


class Outline(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0

    def handle_starttag(self, tag, attrs):
        print("  " * self.depth + tag)
        if tag not in VOID:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag not in VOID:
            self.depth -= 1


Outline().feed(open(sys.argv[1], encoding="utf-8").read())
```

```bash
python3 ../outline.py index.html
```

```output
html
  head
    meta
    meta
    title
  body
    h1
    p
```

The script prints a line for each start tag, and indents one more level for everything inside it. Void elements get no deeper level, because nothing can be inside them. This is the shape the browser sees: `head` and `body` are the two children of `html`, and the heading and the paragraph are children of `body`.

### 4. Look at it in a browser

```bash
python3 -m http.server 8000 > ~/web/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

This is Python's file server from lesson 6.5, run in the background. Open `http://127.0.0.1:8000/` in your browser. You see a big bold heading and a line of normal text, with the title "Byte Club" in the tab. You wrote no style at all: the browser has its own defaults for each element. On WSL this address works in your Windows browser too, because WSL shares `localhost` with Windows. In Codespaces, the server runs on GitHub's machine, so use the address that the editor offers for port 8000 in a small pop-up, or in its Ports tab.

### 5. Fill in the page

Replace `index.html` with this longer version:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Byte Club</title>
</head>
<body>
  <h1>Byte Club</h1>
  <p>A small club for students who like to take computers apart, <strong>on paper and in the terminal</strong>.</p>
  <img src="images/logo.svg" alt="The Byte Club logo: the letters BC in a square" width="120" height="120">

  <h2>Next meetings</h2>
  <ol>
    <li>Linux basics, Monday</li>
    <li>Your first CTF, Thursday</li>
  </ol>

  <h2>Where to practise</h2>
  <ul>
    <li><a href="https://overthewire.org/wargames/bandit/">OverTheWire: Bandit</a></li>
    <li><a href="about.html">About the club</a></li>
  </ul>

  <h2>Join us</h2>
  <form action="/join" method="get">
    <label for="name">Your name</label>
    <input id="name" name="name" required>
    <label for="level">Your level</label>
    <select id="level" name="level">
      <option value="new">New to all this</option>
      <option value="some">I know some Linux</option>
    </select>
    <button type="submit">Join</button>
  </form>
</body>
</html>
```

And add the page the second link points to:

```html title="about.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>About Byte Club</title>
</head>
<body>
  <h1>About Byte Club</h1>
  <p>We meet twice a week. <a href="index.html">Back to the home page</a>.</p>
</body>
</html>
```

Reload the browser tab. The order of the elements is the order on the screen: heading, paragraph, image, then each `<h2>` with what follows it. The `<ol>` items get numbers and the `<ul>` items get bullets, without you typing any of them.

### 6. Follow the links

The two links work in two different ways. `https://overthewire.org/...` is a full URL, so it leads to another site. `about.html` is a **relative link**: the browser reads it from the folder of the current page, exactly like a relative path in lesson 1.2. The page is at `/`, so the link leads to `/about.html`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/about.html
```

```output
200
```

The page exists, so the link works. Click it in the browser, then click "Back to the home page".

### 7. Add the image

The page asks for `images/logo.svg`, which does not exist yet. Reload now and you see the alt text, or a small broken-image icon, in its place. Create the file:

```svg title="images/logo.svg"
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect x="4" y="4" width="112" height="112" fill="none" stroke="black" stroke-width="8"/>
  <text x="60" y="78" font-family="monospace" font-size="48" text-anchor="middle">BC</text>
</svg>
```

SVG is an image format written as text, so you can type it in your editor like the rest. Reload, and the logo appears.

```bash
curl -s -I http://127.0.0.1:8000/images/logo.svg | grep -i content-type
```

```output
Content-type: image/svg+xml
```

The image is a file of its own, fetched with its own request, and the server labels it as an image. The `alt` attribute is the text that stands in for the image: a screen reader reads it aloud to a blind user, and the browser shows it when the image fails to load. Write what the image shows, in a few words. The `width` and `height` let the browser keep the right space free while the image is still loading.

### 8. See what the form sends

Each field has a `name`. When someone clicks "Join", the browser takes the name and the value of each field, joins them into a **query string**, and requests the `action` address with it. With `method="get"`, the query string goes after a `?` in the URL. Python can build the same string:

```python
from urllib.parse import urlencode

print("/join?" + urlencode({"name": "Sam Lee", "level": "new"}))
```

```output
/join?name=Sam+Lee&level=new
```

The pairs are joined with `&`, and the space became a `+`, because a URL cannot contain a space. Now type a name in the browser form and click "Join". The address bar shows that same kind of URL, and the page says "Error response" and "Error code: 404": this file server has nothing at `/join`. The request still arrived:

<!-- lab: run
curl -s -o /dev/null "http://127.0.0.1:8000/join?name=Sam+Lee&level=new"
-->

<!-- lab: nocheck -->
```bash
grep join ~/web/server.log
```

```output
127.0.0.1 - - [21/Nov/2026 22:51:19] "GET /join?name=Sam+Lee&level=new HTTP/1.1" 404 -
```

The server log has the whole query string in it. Your line shows the name you typed and your own time. Lesson 8.5 writes a server that can read values like these and answer. The `<label for="name">` is tied to the field with `id="name"`: click the label text and the field gets the cursor. `required` makes the browser refuse to send the form while the name is empty. That is a help for the user, not a protection, because anyone can type a URL like `/join?level=new` into the address bar, or send it with `curl`, without using the form at all.

### 9. Print the whole tree and stop the server

```bash
python3 ../outline.py index.html | tail -n 9
pkill -f http.server
```

```output
    h2
    form
      label
      input
      label
      select
        option
        option
      button
```

The full tree is longer; `tail -n 9` keeps the form part. The fields sit inside the form, and the options inside the select. When a page looks wrong, a mistake in this nesting is often the cause.

## Exercise

1. Add a page `rules.html` with the title "Club rules", a main heading, a numbered list of three rules of your choice and a link back to `index.html`.
2. In `index.html`, add a paragraph under the list of meetings, with a link to `rules.html`.
3. Check that `rules.html` has the tree you expect, with `outline.py`.

<details>
<summary>Show the solution</summary>

```html title="rules.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Club rules</title>
</head>
<body>
  <h1>Club rules</h1>
  <ol>
    <li>Only attack machines you own or are allowed to test.</li>
    <li>Share what you learn.</li>
    <li>Ask when you are stuck for more than an hour.</li>
  </ol>
  <p><a href="index.html">Back to the home page</a></p>
</body>
</html>
```

In `index.html`, right after the `</ol>` of the meetings, add:

```html
  <p>Before you come, read the <a href="rules.html">club rules</a>.</p>
```

```bash
python3 ../outline.py rules.html
```

```output
html
  head
    meta
    title
  body
    h1
    ol
      li
      li
      li
    p
      a
```

Your rules can be different. What counts is that each `<li>` sits inside the `<ol>`, and that the link is inside a paragraph inside `body`.

</details>

## Check yourself

**1. In `<a href="about.html">About the club</a>`, what is the element, what is the attribute, and what does the reader see?**

<details>
<summary>Answer</summary>

The element is a link (`a`). `href` is the attribute, and it says where the link leads. The reader sees the text "About the club" and can click it.

</details>

**2. What is the difference between `<ul>` and `<ol>`?**

<details>
<summary>Answer</summary>

Both hold list items (`<li>`). `<ul>` is a list with bullets, where the order does not matter. `<ol>` is a numbered list, where it does.

</details>

**3. Why should every image have an `alt` attribute?**

<details>
<summary>Answer</summary>

The alt text stands in for the image. A screen reader reads it to a blind user, and the browser shows it when the image cannot load.

</details>

**4. A page at `http://127.0.0.1:8000/docs/start.html` has `<img src="images/map.svg">`. Which address does the browser request?**

<details>
<summary>Answer</summary>

`http://127.0.0.1:8000/docs/images/map.svg`. A relative link is read from the folder of the current page, which is `/docs/`.

</details>

**5. A form has `<input id="city">` with no `name`. What happens to that field when the form is sent?**

<details>
<summary>Answer</summary>

It is not sent at all. The browser builds the query string from the `name` of each field, so a field without a name has nothing to put there.

</details>

## Common mistakes

- **Closing tags in the wrong order.** `<p><strong>text</p></strong>` breaks the tree. Close the inner element first: `<p><strong>text</strong></p>`.
- **Wrong capital letters in a link.** On a Linux server, `Logo.svg` and `logo.svg` are two different files. Your own computer may forgive it and the real server will not. Use lowercase file names without spaces.
- **A form field without `name`.** It shows on the screen but is never sent. Give every field a `name`.
- **Empty or useless alt text.** `alt="image"` tells a blind reader nothing. Say what the image shows. Only a purely decorative image gets `alt=""`.
- **Trusting `required`.** The browser checks it, but anyone can send a request without the form. The server must check the data again, as you will do in lesson 8.8.

## Key terms

- **HTML**: HyperText Markup Language, the text format that says what each part of a web page is.
- **Tag**: a name in angle brackets, such as `<p>` or `</p>`, that starts or ends an element.
- **Element**: a start tag, an end tag and the content between them. It is one part of the page.
- **Attribute (HTML)**: an extra fact on a start tag, written as `name="value"`, such as `href` on a link.
- **Void element**: an element with no content and no end tag, such as `<img>` or `<input>`.
- **Relative link**: a link address that the browser reads from the folder of the current page.
- **Alt text**: the text in an image's `alt` attribute, which stands in for the image.
- **Query string**: the `name=value` pairs after the `?` in a URL, joined with `&`. A form with `method="get"` sends its fields this way.

## Go further

- [MDN: HTML](https://developer.mozilla.org/en-US/docs/Web/HTML): Mozilla's guides and reference for every element and attribute.
- [MDN: Web forms](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms): how forms, labels and fields work, with many examples.
- [W3C Markup Validation Service](https://validator.w3.org/): paste your HTML and it lists every mistake in the nesting or the attributes.
