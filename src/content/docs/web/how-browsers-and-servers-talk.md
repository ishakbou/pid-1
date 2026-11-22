---
title: How browsers and servers talk
description: Follow one page load from the URL to the pixels, request by request, with curl, the server log and the Network panel of the browser's developer tools.
lesson: "8.4"
time: 25 min
sidebar:
  order: 4
---

You type an address, press Enter, and a page appears, usually in less than a second. In that second your browser asks several questions, sends several requests and does a lot of work with the answers. The Byte Club site from the last three lessons is small enough that you can follow every one of those requests, so that is what you will do now.

## Goal

After this lesson you can:

- List the steps of a page load, from the URL to the pixels on the screen.
- Tell which parts of a page make the browser send more requests.
- Follow a page load in the server log, with curl and in the Network panel of the developer tools.

## Why it matters

When a page is slow, broken or half styled, the cause is almost always one of these steps: a file that answers 404, a script that fails, a request that takes three seconds. Knowing the order tells you where to look. In security work you read the same requests, because every request is something a user, or an attacker, can see, repeat and change.

## The idea

A **page load** is everything the browser does from reading the URL to showing the finished page, and it is a chain of steps. You met the first ones in Module 6:

1. **Read the URL.** The browser splits it into scheme, host, port and path, as in lesson 6.5.
2. **Find the address.** If the host is a name, DNS turns it into an IP address (lesson 6.4).
3. **Connect.** The browser opens a TCP connection to that address and port (lesson 6.3), and for `https` it sets up TLS on top.
4. **Ask for the page.** It sends an HTTP request for the path and gets back the HTML.
5. **Read the HTML and ask for the rest.** While it reads the HTML, the browser builds the DOM. Every style sheet, script and image the HTML mentions means one more request.
6. **Draw.** The browser applies the CSS to the DOM, runs the scripts, works out the position and size of every box, which is called **layout**, and then fills in the pixels, which is called **painting**.

It is a little like cooking from a recipe you get by post. Before you can cook, you need the recipe. Reading it, you find the ingredients you lack, and you send for each one, several at a time. When they arrive, you cook. A missing ingredient does not stop the meal, but it shows: a page whose style sheet fails still appears, without its style.

<figure class="diagram">
<svg viewBox="0 0 460 260" role="img" aria-labelledby="load-title load-desc">
<title id="load-title">The requests of one page load</title>
<desc id="load-desc">Two vertical lines, the browser on the left and the server on the right. First the browser sends GET slash and the server answers 200 with the HTML. Then, highlighted, the browser sends three more requests, for style.css, script.js and the logo, and the server answers each with 200. After that the browser draws the page.</desc>
<text x="90" y="28">Browser</text>
<text x="370" y="28">Server</text>
<path class="d-line" d="M90 40 V230 M370 40 V230"/>
<path class="d-line" d="M90 75 H370 M362 71 L370 75 L362 79 M370 110 H90 M98 106 L90 110 L98 114"/>
<path class="d-line d-hot" d="M90 155 H370 M362 151 L370 155 L362 159 M370 190 H90 M98 186 L90 190 L98 194"/>
<text x="230" y="68">GET /</text>
<text x="230" y="103">200 OK: the HTML</text>
<text x="230" y="148">GET style.css, script.js, logo.svg</text>
<text x="230" y="183">200 OK: three files</text>
<text x="230" y="250">then: DOM + CSS, run the script, layout, paint</text>
</svg>
<figcaption>One page load of the Byte Club site: one request for the HTML, then one for each file it mentions.</figcaption>
</figure>

Only some elements make the browser fetch something by itself. `<link rel="stylesheet" href>`, `<script src>` and `<img src>` are fetched during the load, because the page needs them to be drawn. An `<a href>` is fetched only when someone clicks it.

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
mkdir -p ~/web/site/images
cd ~/web/site
cat > images/logo.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect x="4" y="4" width="112" height="112" fill="none" stroke="black" stroke-width="8"/>
  <text x="60" y="78" font-family="monospace" font-size="48" text-anchor="middle">BC</text>
</svg>
EOF
cat > about.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About Byte Club</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>About Byte Club</h1>
  <p>We meet twice a week. <a href="index.html">Back to the home page</a>.</p>
</body>
</html>
EOF
cat > style.css <<'EOF'
/* Byte Club: one style sheet for every page */

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  color: #1c1c1c;
  background: #faf9f6;
  max-width: 40rem;
  margin: 0 auto;
  padding: 0 1rem;
}

h1,
h2 {
  line-height: 1.2;
}

a {
  color: #1f6f50;
}

.top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card {
  background: white;
  border: 1px solid #c8c8c8;
  border-radius: 6px;
  padding: 0 1rem 1rem;
  margin: 2rem 0;
}

#join label {
  display: block;
  margin-top: 0.75rem;
}

#join button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}
EOF
cat > index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Byte Club</title>
  <link rel="stylesheet" href="style.css">
  <script src="script.js" defer></script>
</head>
<body>
  <header class="top">
    <img src="images/logo.svg" alt="The Byte Club logo: the letters BC in a square" width="120" height="120">
    <h1>Byte Club</h1>
  </header>
  <p>A small club for students who like to take computers apart, <strong>on paper and in the terminal</strong>.</p>

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

  <section class="card">
    <h2>Tip of the day</h2>
    <p id="tip">Turn on JavaScript to see the tips.</p>
    <button type="button" id="next-tip">Next tip</button>
  </section>

  <section class="card" id="join">
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
    <p id="answer" role="status"></p>
  </section>
</body>
</html>
EOF
cat > script.js <<'EOF'
// Byte Club: things the page does by itself, without a server

const tips = [
  "Read the whole error message before you search for it.",
  "Press Tab to complete names in the terminal.",
  "Commit small changes often.",
];
let current = 0;

const tipText = document.querySelector("#tip");
const tipButton = document.querySelector("#next-tip");

function showTip() {
  tipText.textContent = tips[current];
  current = (current + 1) % tips.length;
}

tipButton.addEventListener("click", showTip);
showTip();

function greet(name, level) {
  if (level === "new") {
    return `Welcome, ${name}. Start with Linux basics on Monday.`;
  }
  return `Welcome back, ${name}. See you at the CTF on Thursday.`;
}

const form = document.querySelector("#join form");
const answer = document.querySelector("#answer");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  const level = form.elements.level.value;
  answer.textContent = greet(name, level);
});
EOF
touch -d "2026-11-21 09:00:00 UTC" index.html about.html style.css script.js images/logo.svg
cd ~
-->

This lesson uses the site from lessons 8.1 to 8.3 in `~/web/site`, with its HTML page, style sheet, script and logo.

### 1. Start the server with a fresh log

```bash
cd ~/web/site
rm -f ~/web/server.log
python3 -m http.server 8000 --bind 127.0.0.1 > ~/web/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

`--bind 127.0.0.1` makes the server listen on the loopback address only, so no other computer can reach it. The log starts empty, so every line in it now comes from this lesson.

### 2. Make the first request, and watch every step

<!-- lab: nocheck -->
```bash
curl -v -s -o /dev/null http://127.0.0.1:8000/ 2>&1
```

```output
*   Trying 127.0.0.1:8000...
* Connected to 127.0.0.1 (127.0.0.1) port 8000
> GET / HTTP/1.1
> Host: 127.0.0.1:8000
> User-Agent: curl/8.5.0
> Accept: */*
> 
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Server: SimpleHTTP/0.6 Python/3.12.3
< Date: Sat, 21 Nov 2026 23:01:27 GMT
< Content-type: text/html
< Content-Length: 1539
< Last-Modified: Sat, 21 Nov 2026 09:00:00 GMT
< 
{ [1539 bytes data]
* Closing connection
```

`-v` means verbose: curl tells you what it does. `-o /dev/null` throws the body away, and `2>&1` sends curl's messages to the normal output, so you can read them. The marks at the start of the lines tell you who is talking:

- `*` lines are curl's own notes. Here you see step 3: the TCP connection to port 8000. There was no DNS step, because `127.0.0.1` is already an IP address.
- `>` lines are the request that curl sent: step 4.
- `<` lines are the response's status line and headers. `{ [1539 bytes data]` is the body, the HTML, which is exactly `Content-Length` bytes long.

The date and the version numbers on your screen will differ. `HTTP/1.0` means this small server closes the connection after each answer; real servers keep it open for the next requests, which saves time.

### 3. Find what else the page needs

The browser now reads the HTML. You can look for the same things it looks for:

```bash
grep -o -E '(href|src)="[^"]+"' index.html
```

```output
href="style.css"
src="script.js"
src="images/logo.svg"
href="https://overthewire.org/wargames/bandit/"
href="about.html"
```

`grep -o` prints only the matching part of each line, and `-E` allows the `|` meaning "or". Five addresses, but only the first three are fetched during the load: the style sheet, the script and the image. The last two are links in `<a>` elements, so the browser waits for a click.

### 4. Fetch them like a browser

```bash
for f in style.css script.js images/logo.svg; do
  curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download} bytes $f\n" "http://127.0.0.1:8000/$f"
done
```

```output
200 text/css 633 bytes style.css
200 text/javascript 1016 bytes script.js
200 image/svg+xml 278 bytes images/logo.svg
```

A `for` loop from Module 1 runs one request per file. `-w` prints facts about each answer: the status code, the `Content-Type` and the size. The type matters. The browser uses it to decide what to do with the file: apply it as CSS, run it as a script, or draw it as an image. A browser makes these three requests at the same time, over several connections, instead of one after the other.

### 5. Read the load in the server log

```bash
cut -d '"' -f 2 ~/web/server.log
```

```output
GET / HTTP/1.1
GET /style.css HTTP/1.1
GET /script.js HTTP/1.1
GET /images/logo.svg HTTP/1.1
```

Each log line has the request between double quotes, so `cut` with `"` as the separator keeps only that part. These four lines are one page load: one page, three files. Now open `http://127.0.0.1:8000/` in your browser and run the same `cut` command again. You see the same four requests from your browser, and probably a fifth, `GET /favicon.ico`, answered with 404. Browsers ask every site for a small icon to show in the tab, and this site has none. That 404 is harmless.

### 6. See where the time goes

<!-- lab: nocheck -->
```bash
curl -s -o /dev/null -w "connect: %{time_connect}s  first byte: %{time_starttransfer}s  total: %{time_total}s\n" http://127.0.0.1:8000/
```

```output
connect: 0.000361s  first byte: 0.002402s  total: 0.002534s
```

`time_connect` is the time until the TCP connection was open, `time_starttransfer` the time until the first byte of the answer arrived, and `time_total` the end. On the same machine everything takes about a millisecond, and your numbers will differ. Over the internet, each step can take tens of milliseconds, and a page with fifty files pays for some of them fifty times. That is why big sites combine files and keep connections open.

### 7. Ask again, and get "nothing changed"

The second time you open a page, the browser already has a copy of its files in its **cache**, a store of earlier answers on your disk. Instead of downloading a file again, it can ask "has this changed since this date?". You can send the same question:

```bash
last=$(curl -s -I http://127.0.0.1:8000/style.css | grep -i '^last-modified' | cut -d ' ' -f 2- | tr -d '\r')
echo "$last"
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" -H "If-Modified-Since: $last" http://127.0.0.1:8000/style.css
```

```output
Sat, 21 Nov 2026 09:00:00 GMT
304 0 bytes
```

The first line asks only for the headers (`-I`, from lesson 6.5) and keeps the date in the `Last-Modified` header in a variable. `tr -d '\r'` removes the carriage return that ends every HTTP header line. The second request sends that date back in an `If-Modified-Since` header, with `-H`, which adds a header. The answer is **304 Not Modified**, with an empty body: "use the copy you have". Your date shows when you last saved `style.css`.

Change the file and ask the same question:

```bash
echo "/* changed */" >> style.css
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" -H "If-Modified-Since: $last" http://127.0.0.1:8000/style.css
```

```output
200 647 bytes
```

The file is newer than the date you sent, so the server sends all of it again, now 14 bytes longer. This is also why a change to your CSS sometimes does not appear: the browser may use its copy without asking at all, for a while. A hard reload, with Ctrl+Shift+R, makes it fetch everything again.

### 8. Do it all again in the Network panel

Open the developer tools (F12) in your browser and choose the **Network** tab, then reload the page. Each line is one request, with columns for the name, the status code, the type, the size and the time. The bar on the right of each line, called the waterfall, shows when the request started and how long it took. You can see the HTML first, then the style sheet, the script and the logo starting together. A file the browser already had shows `304` when the server confirmed that it had not changed, or `(memory cache)` or `(disk cache)` in the size column when the browser did not even ask; tick "Disable cache" at the top and reload, and every file comes from the server again. Click a line to see the request and response headers, the same ones `curl -v` printed.

Now compare what the server sent with what the browser has. The server sent this:

```bash
curl -s http://127.0.0.1:8000/ | grep 'id="tip"'
pkill -f http.server
```

```output
    <p id="tip">Turn on JavaScript to see the tips.</p>
```

Open the **Elements** tab (called **Inspector** in Firefox) and find the same paragraph. There it holds a tip, because the script changed the DOM after the page arrived. The Elements tab shows the DOM as it is now; "View page source" in the browser menu shows the HTML as the server sent it. When the two disagree, a script made the difference.

:::note[Every request can be changed]
curl just sent a header that no page told it to send. Anyone can do that, with any value, to any request: a header, a field of a form, a cookie. A server must never trust a request only because it looks like it came from its own page. Module 12 is built on this fact.
:::

## Exercise

Break the page on purpose, then find the cause without looking at the HTML.

1. In `index.html`, change `href="style.css"` to `href="stlye.css"`. Start the server again with a fresh log, and open the page in your browser. What do you see?
2. Use the server log to find which request failed and with which status code.
3. Fix the typo, reload, and check the log again.

<details>
<summary>Show the solution</summary>

<!-- lab: run
cd ~/web/site
sed -i 's/href="style.css"/href="stlye.css"/' index.html
rm -f ~/web/server.log
python3 -m http.server 8000 --bind 127.0.0.1 > ~/web/server.log 2>&1 &
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
for f in / stlye.css script.js images/logo.svg; do curl -s -o /dev/null "http://127.0.0.1:8000/${f#/}"; done
-->

The page appears with the right text, image and tips, but in the browser's default style: black text from edge to edge. The script still runs, because only the style sheet is missing.

```bash
grep ' 404 ' ~/web/server.log | cut -d '"' -f 2-
```

```output
GET /stlye.css HTTP/1.1" 404 -
```

The browser asked for `/stlye.css`, exactly as the HTML said, and the server answered 404. The Network tab shows the same line in red. After you fix the typo and reload, the log shows `GET /style.css` with 200 or 304.

<!-- lab: run
pkill -f http.server
cd ~/web/site
sed -i 's/href="stlye.css"/href="style.css"/' index.html
-->

</details>

## Check yourself

**1. Put these in the order they happen: the browser paints the page, DNS finds the IP address, the browser requests `style.css`, the TCP connection opens, the browser requests the HTML.**

<details>
<summary>Answer</summary>

DNS finds the IP address, the TCP connection opens, the browser requests the HTML, it requests `style.css` (found while reading the HTML), and last it paints the page.

</details>

**2. A page has one `<link rel="stylesheet">`, two `<img>` and four `<a href>` elements. How many requests does one load make, if every file exists and nothing is cached?**

<details>
<summary>Answer</summary>

Four: one for the HTML, one for the style sheet and two for the images. Links are only fetched when clicked. A browser may add one more for `/favicon.ico`.

</details>

**3. What does a `304 Not Modified` answer mean, and why is its body empty?**

<details>
<summary>Answer</summary>

The client asked whether the file had changed since a given date (`If-Modified-Since`), and it had not. The client already has a copy, so the server does not send the file again.

</details>

**4. "View page source" shows `Turn on JavaScript to see the tips.`, but the Elements tab shows a real tip. Why?**

<details>
<summary>Answer</summary>

Page source shows the HTML as the server sent it. The Elements tab shows the DOM now, after the script changed the paragraph's text.

</details>

## Common mistakes

- **Reading only the page, not the requests.** A page without style or with a broken image is a failed request. Open the Network tab first, and look for red lines and 4xx codes.
- **Testing changes against the cache.** Your change is on disk but the browser shows the old file. Hard reload, or tick "Disable cache" while the developer tools are open.
- **Forgetting the favicon.** A `GET /favicon.ico` with 404 in your log is the browser's own request, not an attack and not a bug in your page.
- **Mixing up page source and the DOM.** When a script changes the page, the source no longer matches the screen. Use the Elements tab to see what is really there.

## Key terms

- **Page load**: everything a browser does from reading a URL to showing the finished page.
- **Layout**: the step where the browser works out the size and position of every box.
- **Painting**: the step where the browser fills in the pixels of each box.
- **Cache (browser)**: a store of earlier answers that the browser keeps, so it does not have to download the same file again.
- **304 Not Modified**: the status code a server sends when the client's cached copy is still current.
- **Network panel**: the part of the developer tools that lists every request of a page, with its status, size and timing.

## Go further

- [MDN: Populating the page: how browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work): the steps of a page load in more detail.
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching): how browsers decide when to ask again and when to use their copy.
- [Chrome DevTools: Network features reference](https://developer.chrome.com/docs/devtools/network/reference): every column and button of the Network panel.
