---
title: "Cheat sheet: HTML, CSS and HTTP"
description: The HTML elements, CSS rules, JavaScript, curl commands, status codes, cookie settings and Flask patterns of Module 8 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Name in the tab</title>
  <meta name="description" content="One sentence for search results and shared links.">
  <link rel="stylesheet" href="style.css">
  <script src="script.js" defer></script>
</head>
<body>
  ...
</body>
</html>
```

| Element | Marks |
|---|---|
| `<h1>` to `<h6>`, `<p>`, `<strong>` | headings, paragraph, important text |
| `<a href="about.html">` | link; `href="#id"` scrolls to an element on the same page |
| `<ul>`, `<ol>`, `<li>` | bullet list, numbered list, one item |
| `<img src="..." alt="..." width="..." height="...">` | image; `alt` describes it, `alt=""` only if decorative |
| `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` | regions and parts of a page |
| `<form action="/join" method="get">` | form; `get` puts the fields in the URL, `post` in the body |
| `<label for="name">` + `<input id="name" name="name">` | a field and its label; only fields with a `name` are sent |
| `<select>` with `<option>`, `<textarea>`, `<button type="submit">` | choice list, multi-line text, send button |

A form sends `name=value&name=value`. `required` is a help for users, not a protection: the server must check again.

## CSS

| Selector | Chooses |
|---|---|
| `p` | every `<p>` |
| `.card` | every element with `class="card"` |
| `#join` | the element with `id="join"` |
| `#join label` | every `label` inside `#join` |
| `h1, h2` | both |
| `a:hover` | a link while the pointer is on it |

The cascade: the more specific selector wins (id > class > element), then the later rule. Box width = content + padding + border, unless `box-sizing: border-box`.

| Declaration | Effect |
|---|---|
| `max-width: 40rem; margin: 0 auto;` | a centred column of about 70 characters |
| `line-height: 1.6;` | more space between lines |
| `display: flex; gap: 1rem; align-items: center;` | children in a row, spaced, centred |
| `justify-content: space-between;` | push flex children to both ends |
| `display: block;` | start on a new line and fill the width |
| `--accent: #1f6f50;` and `color: var(--accent);` | set and use a CSS variable |
| `@media (max-width: 30rem) { ... }` | rules for narrow screens only |
| `@media (prefers-color-scheme: dark) { ... }` | rules for dark mode only |

## JavaScript

| Code | Meaning |
|---|---|
| `const x = 1;` / `let n = 0;` | fixed / changeable variable |
| `` `Hi ${name}` `` | text with a value in it |
| `===` | equal value and type; never use `==` |
| `(x) => x + 1` | arrow function |
| `document.querySelector("#tip")` | first element matching a CSS selector |
| `el.textContent = text` | set the text; never `innerHTML` for user text |
| `el.addEventListener("click", fn)` | call `fn` on every click (pass `fn`, not `fn()`) |
| `event.preventDefault()` | cancel the browser's normal action, such as sending a form |
| `const r = await fetch(url); const data = await r.json();` | call an API, inside an `async` function |
| `node file.js`, `node --check file.js` | run a script, check its syntax only |

## curl and HTTP

| Command | Does |
|---|---|
| `curl -v -s -o /dev/null URL 2>&1` | show the connection, request and response headers |
| `curl -s -I URL` | headers only |
| `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" URL` | status code and type only |
| `-w "%{redirect_url}"`, `-w "%{time_total}"` | where a redirect points, how long it took |
| `curl -s URL \| python3 -m json.tool` | print JSON readably |
| `-d "a=1&b=2"`, `--data-urlencode "title=<b>x</b>"` | send form fields with POST |
| `-H "Content-Type: application/json" -d '{"text": "hi"}'` | send JSON with POST |
| `-X DELETE`, `-X POST` | choose the method |
| `-c jar.txt -b jar.txt` | save and send cookies like a browser |
| `-b "name=value"` | send any cookie you like |

| Code | Meaning |
|---|---|
| 200 / 201 / 204 | OK / created / OK with no body |
| 302 | go to the address in `Location` |
| 304 | not modified: use your cached copy |
| 400 / 401 / 404 | bad request / not logged in or wrong password / not found |
| 500 | the server crashed |

## Cookies and sessions

| Attribute | Meaning |
|---|---|
| `Max-Age=3600` | keep it one hour; without it, until the browser closes |
| `HttpOnly` | scripts in the page cannot read it |
| `Secure` | only sent over HTTPS |
| `SameSite=Lax` | not sent with most requests that other sites start |

A plain cookie is user input. A Flask session cookie is readable (Base64 JSON) but signed: it cannot be changed without the secret key. Never put a secret in it, never publish the key, never share a session cookie.

## Flask

```python
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = load_secret_key()               # from a file that git ignores

@app.get("/api/tips/<int:tip_id>")               # also @app.post, @app.delete
def get_tip(tip_id):
    ...
    return jsonify({"error": "no such tip"}), 404  # a body and a status code

@app.route("/login", methods=["GET", "POST"])
def login():
    ...
    user = db.check_login(request.form.get("username", ""), request.form.get("password", ""))
    session["user_id"] = user["id"]              # stored in the signed cookie
    return redirect(url_for("notes"))            # 302 after every successful POST
```

| Task | Command or code |
|---|---|
| Start an app | `flask --app api run --port 5000` or `python3 app/app.py` |
| Read the query string, a form, JSON | `request.args.get("q", "")`, `request.form.get("title", "")`, `request.get_json(silent=True)` |
| Fill a template | `render_template("notes.html", notes=rows)` |
| Template value / logic | `{{ note.title }}` (escaped) / `{% if %}`, `{% for %}`, `{% extends %}`, `{% block %}` |
| Static files | `app/static/style.css` at `/static/style.css` |

## Servers and tools

| Task | Command |
|---|---|
| Serve a folder | `python3 -m http.server 8000 --bind 127.0.0.1 &` |
| Stop it | `pkill -f http.server`, `pkill -f "flask --app"`, `pkill -f app/app.py` |
| Developer tools | F12; tabs Elements, Console, Network, Application (Storage in Firefox) |
| Phone width | Ctrl+Shift+M in the developer tools |
| Reload without the cache | Ctrl+Shift+R |
| Publish a portfolio | repository `yourname.github.io`, push, Settings, Pages |
