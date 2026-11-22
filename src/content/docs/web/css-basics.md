---
title: CSS basics
description: Style a page with CSS rules, choose elements with selectors, understand the box model, and build a simple layout that is easy to read on a laptop and a phone.
lesson: "8.2"
time: 25 min
sidebar:
  order: 2
---

Open the Byte Club page from lesson 8.1 on a wide screen and look at one line of text. It runs from the left edge of the window to the right edge, maybe 200 characters long, and your eyes get lost on the way back to the start of the next line. Nothing in the HTML is wrong. The page just has no style yet, and that is the job of CSS.

## Goal

After this lesson you can:

- Write CSS rules and attach one style sheet to several pages.
- Choose elements with element, class and id selectors, and say which rule wins.
- Explain the box model and use it to build a calm, readable layout.

## Why it matters

Every site you use is HTML plus CSS. Knowing CSS means you can make your own pages, your portfolio in lesson 8.7 and your app in lesson 8.8, look like someone cared. It also makes the browser's developer tools readable, and those tools are where web developers and web security testers spend a lot of their time. Lesson 8.4 uses them.

## The idea

**CSS** (Cascading Style Sheets) is a list of **rules**. Each rule picks some elements and says how they should look:

```css
h2 {
  color: #1f6f50;
  margin-top: 2rem;
}
```

`h2` is the **selector**: it chooses the elements. Inside the braces are **declarations**, each a **property**, a colon, a value and a semicolon. This rule says "every `h2` is green, with space above it". You keep the rules in a file, usually ending in `.css`, and every page that links to the file gets the same style. Change one line and the whole site changes.

Three kinds of selector cover most needs:

| Selector | Chooses | Example |
|---|---|---|
| `p` | Every element of that type | all paragraphs |
| `.card` | Every element with `class="card"` | any number of elements |
| `#join` | The one element with `id="join"` | one element per page |
| `#join label` | Every `label` somewhere inside `#join` | the labels of one form |

A **class** is a label you can put on as many elements as you like. An **id** must be unique on its page. Several rules often set the same property on the same element, and then the cascade decides. A more specific selector beats a less specific one: an id beats a class, and a class beats an element name. Between two equally specific rules, the one that comes later in the file wins. Some properties, such as `color` and `font-family`, are also **inherited**: set them on `body`, and every element inside takes them, unless a rule says otherwise.

### The box model

The browser draws every element as a rectangle. The **box model** describes the layers of that rectangle, from the inside out:

<figure class="diagram">
<svg viewBox="0 0 460 250" role="img" aria-labelledby="box-title box-desc">
<title id="box-title">The CSS box model</title>
<desc id="box-desc">Four rectangles inside each other. The innermost is the content. Around it is the padding. The padding ends at the border, which is drawn highlighted. Outside the border is the margin, the outer rectangle.</desc>
<rect class="d-box" x="10" y="10" width="440" height="230"/>
<rect class="d-box d-hot" x="55" y="45" width="350" height="160"/>
<rect class="d-box" x="115" y="95" width="230" height="60"/>
<text x="230" y="32">margin</text>
<text x="230" y="78">padding</text>
<text x="230" y="130">content</text>
</svg>
<figcaption>The content sits inside the padding. The highlighted line is the border. The margin is the space outside the border.</figcaption>
</figure>

- The **content** is the text or the image itself.
- The **padding** is space inside the box, between the content and the border. It takes the box's background colour.
- The **border** is a line around the padding. It can be thin, thick or absent.
- The **margin** is space outside the border, which pushes other boxes away. It is always see-through.

It works like a framed photo on a wall: the photo, the white mat around it, the frame, and the empty wall you leave before the next frame. Here is the example that confuses everyone once. A box with `width: 300px`, `padding: 20px` and a `2px` border takes 344 pixels across the screen: 300 + 20 + 20 + 2 + 2. The width only counts the content. Add `box-sizing: border-box` and the browser counts padding and border inside the width instead, so the box is exactly 300 pixels wide. Most sites set it for every element, and so will you.

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
mkdir -p ~/web/site/images
cd ~/web
cat > outline.py <<'EOF'
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
EOF
cd ~/web/site
cat > images/logo.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect x="4" y="4" width="112" height="112" fill="none" stroke="black" stroke-width="8"/>
  <text x="60" y="78" font-family="monospace" font-size="48" text-anchor="middle">BC</text>
</svg>
EOF
cd ~
-->

This lesson continues the site from lesson 8.1 in `~/web/site`. You will replace its two pages with new versions, so only the logo and `outline.py` need to be there already.

### 1. Write the first rule

```bash
cd ~/web/site
```

```css title="style.css"
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
```

`/* ... */` is a **comment** in CSS, ignored by the browser. The first rule uses `*`, which chooses every element (`::before` and `::after` are extra boxes some elements get; include them and forget them). The `body` rule does most of the work:

- `font-family` lists fonts in order of preference. `system-ui` is the normal font of the reader's own system, and `sans-serif` is the fallback.
- `line-height: 1.6` puts more space between lines than the default, which makes long text easier to read.
- `max-width: 40rem` stops the text column at about 40 times the font size, around 70 characters per line. `rem` is a unit equal to the font size of the page, usually 16 pixels.
- `margin: 0 auto` means "no margin at the top and bottom, and share the free space equally left and right". That centres the column.
- `padding: 0 1rem` keeps the text away from the edges on a narrow phone screen, where `max-width` is not reached.

### 2. Link the style sheet

Replace `index.html` with this version:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Byte Club</title>
  <link rel="stylesheet" href="style.css">
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
  </section>
</body>
</html>
```

Three things changed. The `<link>` line in the head loads `style.css`. The logo and the title now sit together inside a `<header>`, with the class `top`. The form sits inside a `<section>` with the class `card` and the id `join`. `<header>` and `<section>` are containers: they do nothing on the screen by themselves, but they group elements so that CSS can style the group, and they tell screen readers how the page is organised.

Give the about page the same link:

```html title="about.html"
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
```

```bash
grep -n stylesheet index.html about.html
```

```output
index.html:7:  <link rel="stylesheet" href="style.css">
about.html:7:  <link rel="stylesheet" href="style.css">
```

Both pages point to the same file. That is the point of a separate style sheet: one file, every page.

### 3. Serve it and look

```bash
python3 -m http.server 8000 > ~/web/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s -I http://127.0.0.1:8000/style.css | grep -i content-type
```

```output
Content-type: text/css
```

The style sheet is a file of its own, fetched with its own request, like the logo. Open `http://127.0.0.1:8000/` in your browser and reload. The text sits in a centred column with a calmer font and more space between the lines. Make the window narrow: the column shrinks with it and keeps a small gap at the edges.

### 4. Style with classes and ids

Add these rules at the end of `style.css`:

<!-- lab: run
cat >> ~/web/site/style.css <<'EOF'

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
-->

```css
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
```

Reload the page. Go through the rules one by one:

- `h1, h2` chooses both kinds of heading at once: a comma means "and also". Headings keep tighter lines than body text.
- `a` gives every link the same green, on both pages.
- `.top` turns the header into a **flexbox**: its children, the logo and the title, are laid out in a row instead of one under the other. `align-items: center` lines them up in the middle, and `gap` puts space between them.
- `.card` gives the join section a white background, a thin border, rounded corners, padding inside and margin outside. Four values in `padding` go top, right, bottom, left; three values mean top, left and right, bottom.
- `#join label` makes each label of the form a **block**, which starts on its own line and fills the width. Labels are normally **inline**, which means they flow along a line of text like words in a sentence. The field after a block label lands on the next line.

### 5. Watch the cascade decide

Add one more rule at the very end of `style.css`:

<!-- lab: run
cat >> ~/web/site/style.css <<'EOF'

label {
  display: inline;
  color: #b00020;
}
EOF
-->

```css
label {
  display: inline;
  color: #b00020;
}
```

```bash
tail -n 4 style.css
```

```output
label {
  display: inline;
  color: #b00020;
}
```

Reload. The labels turn red, but they stay on their own lines. Both rules choose the same labels, and they disagree about `display`. `#join label` contains an id, so it is more specific, and it wins, even though the new rule comes later in the file. For `color` there is no disagreement, because only the new rule sets it, so the labels are red. Now delete those four lines again, and reload to see the labels in the normal colour.

<!-- lab: run
cd ~/web/site
head -n -5 style.css > style.tmp && mv style.tmp style.css
-->

### 6. Look at the boxes

Open the browser's **developer tools**, a set of panels built into every desktop browser, with F12 (or Ctrl+Shift+I; on macOS, Cmd+Option+I). Click the arrow icon at the top left of the panel, then click the join card in the page. The tools show the HTML of that element, the CSS rules that apply to it, and a drawing of its box model with the real numbers for margin, border, padding and content. Rules that lost the cascade are shown crossed out. Try it on a label too. Lesson 8.4 uses another panel of the same tools.

```bash
pkill -f http.server
```

:::tip[Change CSS live]
In the rules panel of the developer tools you can click any value and type a new one. The page changes at once. Nothing is saved, so it is a safe place to experiment, and a reload brings back what is in your file.
:::

## Exercise

1. The first meeting in the list is the next one. Give its `<li>` the class `next`, and write a rule that makes it bold, with a green line on its left: `border-left: 4px solid #1f6f50;` and `padding-left: 0.5rem;`.
2. Links should be underlined only when the mouse is over them. Use the selector `a:hover`, which means "a link while the pointer is on it", together with the property `text-decoration`.
3. Check in the developer tools which rules apply to the first `<li>`.

<details>
<summary>Show the solution</summary>

In `index.html`:

```html
    <li class="next">Linux basics, Monday</li>
```

At the end of `style.css`:

```css
.next {
  font-weight: bold;
  border-left: 4px solid #1f6f50;
  padding-left: 0.5rem;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

You could also add `text-decoration: none;` to the `a` rule you already have instead of writing a second `a` rule: both work. `a:hover` is more specific than `a`, so it wins while the pointer is on a link. In the developer tools, the first `<li>` shows the `.next` rule and, lower down, the rules it inherits from `body`, such as `font-family` and `line-height`.

</details>

## Check yourself

**1. In `p { color: gray; }`, what is the selector, the property and the value?**

<details>
<summary>Answer</summary>

`p` is the selector, `color` is the property and `gray` is the value. The rule makes every paragraph gray.

</details>

**2. One rule says `#join label { color: blue; }` and a later rule says `label { color: red; }`. What colour are the labels inside `#join`?**

<details>
<summary>Answer</summary>

Blue. The first selector contains an id, so it is more specific, and specificity counts before the order in the file.

</details>

**3. When do you use a class and when an id?**

<details>
<summary>Answer</summary>

A class can go on many elements, so you use it for a style you want to reuse, such as `card`. An id must be unique on the page, so you use it for one element, such as the join form.

</details>

**4. A box has `width: 200px`, `padding: 10px` and a `1px` border, with the browser's default box sizing. How wide is it on the screen? And with `box-sizing: border-box`?**

<details>
<summary>Answer</summary>

222 pixels: 200 + 10 + 10 + 1 + 1. With `box-sizing: border-box` it is 200 pixels, because the padding and the border are counted inside the width.

</details>

**5. Why does the body rule use `max-width` and not `width`?**

<details>
<summary>Answer</summary>

`max-width` only sets a limit. On a wide screen the column stops at 40rem, and on a phone it shrinks to fit. A fixed `width` of 40rem would be wider than a phone screen and make the page scroll sideways.

</details>

## Common mistakes

- **A missing semicolon or brace.** One missing `;` can make the browser drop the next declaration, and a missing `}` can swallow the rules after it. The developer tools show such declarations as invalid. Check the line just before the part that stopped working.
- **A dot or a hash in the HTML.** The CSS says `.card`, but the HTML says `class="card"`, without the dot. Writing `class=".card"` matches nothing.
- **The style sheet is not loaded.** A wrong `href` in the `<link>` fails without an error on the page. Request the file with `curl` or look for a 404 in the developer tools.
- **Old styles after a change.** Browsers keep copies of style sheets. If a change does not appear, do a hard reload with Ctrl+Shift+R (Cmd+Shift+R on macOS).
- **Fixed widths in pixels.** `width: 900px` breaks on a phone. Use `max-width`, and let boxes shrink.

## Key terms

- **CSS**: Cascading Style Sheets, the language that says how HTML elements look.
- **Rule**: a selector followed by declarations in braces.
- **Selector**: the part of a rule that chooses which elements it applies to.
- **Declaration**: one `property: value;` pair inside a rule.
- **Property**: the thing a declaration sets, such as `color` or `margin`.
- **Class (CSS)**: a name given to elements with `class="..."`, chosen in CSS with a dot.
- **Id**: a name that is unique on a page, given with `id="..."` and chosen in CSS with a hash.
- **Cascade (CSS)**: the way CSS picks one value when several rules set the same property: the more specific selector wins, then the later rule.
- **Inherited property**: a property, such as `color` or `font-family`, that elements take from the element they sit in.
- **Box model**: the layers of every element's rectangle: content, padding, border and margin.
- **Flexbox**: a layout mode, turned on with `display: flex`, that places the children of an element in a row or a column.
- **Developer tools**: panels built into the browser that show a page's HTML, CSS, network requests and errors.

## Go further

- [MDN: CSS](https://developer.mozilla.org/en-US/docs/Web/CSS): Mozilla's guides and the reference for every property.
- [MDN: The box model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model): the box model in more detail, with live examples you can change.
- [MDN: Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox): everything `display: flex` can do, step by step.
