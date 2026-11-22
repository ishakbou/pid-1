---
title: Build and publish a portfolio page
description: Plan and write a one-page portfolio with clear HTML and calm CSS that works on phones and in dark mode, check it with a small script, and publish it at your own GitHub Pages address.
lesson: "8.7"
time: 25 min
sidebar:
  order: 7
---

<!-- lab: run
pkill -f http.server
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
export GIT_AUTHOR_DATE="2026-11-21T15:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T15:00:00+0000"
rm -rf ~/portfolio
mkdir -p ~/web/site/images
cat > ~/web/site/images/logo.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect x="4" y="4" width="112" height="112" fill="none" stroke="black" stroke-width="8"/>
  <text x="60" y="78" font-family="monospace" font-size="48" text-anchor="middle">BC</text>
</svg>
EOF
-->

Somebody reads your CV, sees a link, and clicks it. You get about thirty seconds of their attention. In that time the page has to say who you are, show one or two things you really built, and tell them how to reach you. In this lesson you write that page with what you learned in this module, check it, and put it online at your own address.

## Goal

After this lesson you can:

- Plan the content of a short portfolio page and structure it with clear HTML.
- Style it so that it reads well on a laptop, on a phone and in dark mode.
- Check the page for broken links and missing alt text, and publish it with GitHub Pages.

## Why it matters

Employers, internship tutors and CTF teams look you up. A page you made yourself, with links to code you wrote, says more than a list of skills, and it proves that you know the basics of the web. Lesson 2.7 showed you how GitHub Pages publishes files; now you have the HTML and CSS to make those files worth publishing.

## The idea

A **portfolio** is a short page that shows who you are and what you have built, with links to the work itself. It works like the trailer of a film: it does not show everything, it shows the best parts, and it makes people want to see the rest, which here means your repositories.

Four parts are enough for a student:

| Part | What goes in it |
|---|---|
| About | Two or three sentences: what you study, what you like to work on |
| Projects | Two or three projects. For each: what it is, what you did, a link to the code |
| Skills | Only things you have actually used in a project |
| Contact | One way to reach you that you are happy to make public |

HTML has elements made for these parts. `<header>`, `<nav>`, `<main>` and `<footer>` are **landmark elements**: they mark the big regions of a page, so a screen reader can jump straight to the navigation or to the main content. Inside `<main>`, each part is a `<section>` with a heading, and each project is an `<article>`, a piece that makes sense on its own.

The navigation uses **fragment links**. A link such as `<a href="#projects">` does not load another page: it scrolls to the element with `id="projects"` on the same page. The part after the `#` is called the fragment.

The page must also work on a phone. **Responsive design** means one page that adapts to the screen, instead of a separate phone version. Lesson 8.2 started it with `max-width`. Today you add a **media query**: a block of CSS rules that applies only when a condition is true, such as "the screen is narrow" or "the reader chose dark mode".

## Try it

The outputs come from a user called `sam`; where they show `sam`, yours show your own name. Use your own name and words in the page too.

### 1. Make a repository for the portfolio

```bash
mkdir -p ~/portfolio/images
cd ~/portfolio
git init
```

```output
Initialized empty Git repository in /home/sam/portfolio/.git/
```

The portfolio gets its own repository, because GitHub Pages publishes a whole repository. Everything in this folder will be public, so keep only the site in it.

### 2. Write the page

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sam Lee: computer science student</title>
  <meta name="description" content="Sam Lee, computer science student. Projects in Linux, Python and web security, with links to the code.">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Sam Lee</h1>
    <p>Computer science student, learning security one lab at a time.</p>
    <nav aria-label="Sections">
      <a href="#projects">Projects</a>
      <a href="#skills">Skills</a>
      <a href="#contacts">Contact</a>
    </nav>
  </header>

  <main>
    <section id="about">
      <h2>About me</h2>
      <p>I study computer science and spend my evenings in the terminal. I like to find out how things work, and then how they break.</p>
    </section>

    <section id="projects">
      <h2>Projects</h2>
      <article class="project">
        <h3>mylab</h3>
        <p>A lab that I build and secure step by step: Bash scripts, a Python log analyzer, and a small web app with a database.</p>
        <p><a href="https://github.com/yourname/mylab">Code on GitHub</a></p>
      </article>
      <article class="project">
        <h3>Byte Club site</h3>
        <img src="images/byte-club.svg" width="120" height="120">
        <p>A club website in plain HTML, CSS and JavaScript, with a form that answers without a server.</p>
      </article>
    </section>

    <section id="skills">
      <h2>Skills</h2>
      <ul>
        <li>Linux command line and Bash scripts</li>
        <li>Git and GitHub</li>
        <li>Python, SQL and Flask</li>
        <li>HTTP, cookies and the browser's developer tools</li>
      </ul>
    </section>

    <section id="contact">
      <h2>Contact</h2>
      <p>Write to me at <a href="mailto:sam.lee@example.com">sam.lee@example.com</a>.</p>
    </section>
  </main>

  <footer>
    <p>Written by hand in HTML and CSS. No trackers, no cookies.</p>
  </footer>
</body>
</html>
```

Most of it you know from lesson 8.1. The new parts:

- The `<meta name="description">` is the short text that search engines and chat apps often show under the title when someone shares your link. Write it as one plain sentence about you.
- `<nav aria-label="Sections">` holds the links of the page. `aria-label` gives the region a name that screen readers announce.
- `mailto:` in a link opens the reader's mail program with your address filled in.
- `https://github.com/yourname/mylab` stands for your own `mylab` repository from Module 2. Put your username in place of `yourname`.

This page has two mistakes in it, on purpose. Do not look for them yet: a script will find them in step 4.

Copy the Byte Club logo from lesson 8.1 into the portfolio, so the project has a picture:

```bash
cp ~/web/site/images/logo.svg images/byte-club.svg
```

### 3. Write the style sheet

```css title="style.css"
/* Portfolio: calm, readable, works on a phone and in dark mode */

*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --text: #1c1c1c;
  --page: #faf9f6;
  --accent: #1f6f50;
  --line: #c8c8c8;
}

body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background: var(--page);
  max-width: 40rem;
  margin: 0 auto;
  padding: 0 1rem;
}

a {
  color: var(--accent);
}

nav {
  display: flex;
  gap: 1.5rem;
}

.project {
  border-top: 1px solid var(--line);
}

.project img {
  background: white;
}

footer {
  border-top: 1px solid var(--line);
  margin-top: 3rem;
  font-size: 0.9rem;
}

@media (max-width: 30rem) {
  nav {
    flex-direction: column;
    gap: 0.25rem;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #e4e4e4;
    --page: #121314;
    --accent: #5fbf93;
    --line: #444444;
  }
}
```

The body rule is the one from lesson 8.2. Three ideas are new.

- **Custom properties.** A name that starts with `--`, such as `--accent`, is a **CSS variable**: you set it once and use it anywhere with `var(--accent)`. `:root` chooses the top element of the page, `<html>`, so the variables are set for every element inside it.
- **The narrow-screen query.** `@media (max-width: 30rem) { ... }` means "only when the window is 30rem wide or less", which is about 480 pixels, the width of a phone. There, the navigation links go in a column, one under the other, instead of a row that may not fit.
- **The dark-mode query.** `prefers-color-scheme: dark` is true when the reader has chosen dark mode in their system. The query sets the same four variables to dark colours, and every rule that uses them follows. That is why the variables are worth it: dark mode costs one short block, not a copy of every rule. The logo is drawn in black, so `.project img` gives it a white background that keeps it visible on the dark page.

Both colour sets have strong contrast between text and background, so the page stays easy to read in both modes.

### 4. Check the page with a script

Before anyone else sees the page, check it. Save this script in `~/web`, outside the portfolio folder, so that it is not published with the site:

```python title="../web/check.py"
"""Check an HTML page before you publish it: alt texts, local links and #fragments."""
import sys
from html.parser import HTMLParser
from pathlib import Path


class Checker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.addresses = []
        self.problems = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "img" and "alt" not in attrs:
            self.problems.append(f"image without alt: {attrs.get('src')}")
        for name in ("href", "src"):
            if name in attrs:
                self.addresses.append(attrs[name])


page = Path(sys.argv[1])
checker = Checker()
checker.feed(page.read_text(encoding="utf-8"))

for address in checker.addresses:
    if address.startswith(("https://", "http://", "mailto:")):
        continue  # outside the site: open these by hand
    if address.startswith("#"):
        if address[1:] not in checker.ids:
            checker.problems.append(f"no element with id: {address}")
    elif not (page.parent / address.split("#")[0]).exists():
        checker.problems.append(f"missing file: {address}")

for problem in checker.problems:
    print(problem)
print(f"{page}: {len(checker.addresses)} addresses, {len(checker.problems)} problems")
```

It uses the same `HTMLParser` as `outline.py` in lesson 8.1. While it reads the page, it collects every `id`, every `href` and `src`, and every image without an `alt` attribute. Then it checks each address: a fragment must match an `id` on the page, and a local file must exist next to the page. Addresses of other sites are skipped, because the script does not go online; open those in your browser once.

```bash
python3 ~/web/check.py index.html
```

```output
image without alt: images/byte-club.svg
no element with id: #contacts
index.html: 7 addresses, 2 problems
```

There are the two mistakes. The Byte Club image has no alt text, and the navigation link points to `#contacts`, while the section is called `contact`. A click on that link would change the address bar and nothing else, and nothing on the page would tell you why. Fix both in your editor: add `alt="The Byte Club logo: the letters BC in a square"` to the `<img>`, and change the link to `#contact`.

<!-- lab: run
cd ~/portfolio
sed -i 's|<img src="images/byte-club.svg" width|<img src="images/byte-club.svg" alt="The Byte Club logo: the letters BC in a square" width|; s|href="#contacts"|href="#contact"|' index.html
-->

```bash
python3 ~/web/check.py index.html
```

```output
index.html: 7 addresses, 0 problems
```

Run the script after every change. It takes a second, and it finds the mistakes that are hardest to see by eye.

### 5. Look at it on a laptop and on a phone

```bash
python3 -m http.server 8000 --bind 127.0.0.1 > /dev/null 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:8000/style.css
```

```output
200 text/css
```

The style sheet is there. Open `http://127.0.0.1:8000/` in your browser and click each navigation link: the page scrolls to that section.

Now press Ctrl+Shift+M with the developer tools open (Cmd+Shift+M on macOS). At the time of writing, Chrome and Edge call this the device toolbar and Firefox calls it Responsive Design Mode. It shows the page at the width of a phone. Pick a phone, or drag the edge to make the page narrower than 480 pixels: the navigation links move into a column. Make it wider again, and they go back into a row.

To see dark mode, switch your system to dark mode, or ask the developer tools to pretend. In Chrome, the Rendering panel (in the menu of the developer tools, under More tools) has an option to emulate `prefers-color-scheme: dark`. Firefox has a button with a sun or moon in the rules panel of its Inspector. The background turns near-black and the links turn light green.

```bash
pkill -f http.server
```

### 6. Commit the site

```bash
git status --short
```

```output
?? images/
?? index.html
?? style.css
```

Three new things and nothing else: no script, no notes, nothing private. That is the whole public site.

```bash
git add index.html style.css images
git commit -m "Add portfolio page"
```

```output
[main (root-commit) 36fc027] Add portfolio page
 3 files changed, 128 insertions(+)
 create mode 100644 images/byte-club.svg
 create mode 100644 index.html
 create mode 100644 style.css
```

Your commit number will differ.

### 7. Publish it at your own address

Lesson 2.7 published a site at `https://yourname.github.io/my-page/`. A portfolio deserves the shortest address, `https://yourname.github.io/`, and that address belongs to one special repository: the one named exactly `yourname.github.io`, with your username in place of `yourname`.

On GitHub, create a new repository with that name. Make it **Public** and leave it empty. Then connect and push, as in lesson 2.5:

<!-- lab: skip -->
```bash
git remote add origin git@github.com:yourname/yourname.github.io.git
git push -u origin main
```

Open Settings, then Pages, in the new repository. If the site is not on yet, choose Deploy from a branch, the `main` branch and the folder `/ (root)`, as in lesson 2.7. After a minute or so, the Pages settings show the address. You can check it from the terminal too:

<!-- lab: skip -->
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://yourname.github.io/
```

It prints `200` when the site is live. While the first build is still running it prints `404`; wait a minute and ask again. From now on, every update is the routine from lesson 2.7: edit, run `check.py`, commit, push.

:::caution[Public means public]
Everything in this repository, and its whole history, can be read by anyone. Do not put your phone number, your home address or your date of birth on the page. An email address that you use for job and course contacts is enough. If you would not write it on a poster in the street, leave it out.
:::

## Exercise

Add a third project to your portfolio: your CTF write-ups.

1. Create a page `writeups.html` with the title "Write-ups", a main heading, one short paragraph that says write-ups are coming, a link to `style.css`, and a link back to `index.html`.
2. In `index.html`, add an `<article class="project">` for it in the Projects section, with a link to `writeups.html`.
3. Run `check.py` on both pages until each one reports 0 problems, then commit.

<details>
<summary>Show the solution</summary>

```html title="writeups.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Write-ups: Sam Lee</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Write-ups</h1>
    <p>My write-ups of solved CTF challenges will appear here.</p>
    <p><a href="index.html">Back to the home page</a></p>
  </main>
</body>
</html>
```

In `index.html`, after the Byte Club article:

```html
      <article class="project">
        <h3>CTF write-ups</h3>
        <p>How I solved practice challenges, step by step.</p>
        <p><a href="writeups.html">Read the write-ups</a></p>
      </article>
```

<!-- lab: run
cd ~/portfolio
python3 - <<'EOF'
path = "index.html"
code = open(path).read()
new = '''      <article class="project">
        <h3>CTF write-ups</h3>
        <p>How I solved practice challenges, step by step.</p>
        <p><a href="writeups.html">Read the write-ups</a></p>
      </article>
    </section>

    <section id="skills">'''
code = code.replace('''    </section>

    <section id="skills">''', new, 1)
open(path, "w").write(code)
EOF
-->

```bash
python3 ~/web/check.py index.html
python3 ~/web/check.py writeups.html
```

```output
index.html: 8 addresses, 0 problems
writeups.html: 2 addresses, 0 problems
```

```bash
git add index.html writeups.html
git commit -q -m "Add a write-ups page"
git log --oneline --format=%s
```

```output
Add a write-ups page
Add portfolio page
```

After a `git push`, the new page is online at `https://yourname.github.io/writeups.html`. Module 14 teaches you how to write good write-ups to fill it.

</details>

## Check yourself

**1. What happens when someone clicks `<a href="#skills">Skills</a>`?**

<details>
<summary>Answer</summary>

The browser does not load another page. It scrolls to the element with `id="skills"` on the same page. If no element has that id, the page does not move; only the address bar changes.

</details>

**2. What does `@media (max-width: 30rem) { nav { flex-direction: column; } }` do?**

<details>
<summary>Answer</summary>

When the window is 30rem wide or less, about the width of a phone, the links in `nav` are placed in a column instead of a row. On wider screens the rule does not apply.

</details>

**3. Why does the style sheet keep its colours in variables such as `--text` and `--accent`?**

<details>
<summary>Answer</summary>

Each colour is written once. The dark-mode media query only has to set the four variables to new values, and every rule that uses `var(...)` follows, instead of repeating every rule with new colours.

</details>

**4. Which repository name gives you the address `https://yourname.github.io/`?**

<details>
<summary>Answer</summary>

A repository called exactly `yourname.github.io`, with your own GitHub username in place of `yourname`. Any other repository name is published under a path, such as `https://yourname.github.io/my-page/`.

</details>

**5. Why is `check.py` kept in `~/web` and not in the portfolio folder?**

<details>
<summary>Answer</summary>

GitHub Pages publishes the whole repository. A file in the portfolio folder could be committed and would then be online for anyone. Only the files of the site belong there.

</details>

## Common mistakes

- **A long list of skills and no projects.** "Python, Linux, networking" proves nothing by itself. Show two projects with links to the code, and list only skills those projects use.
- **Fragment links that do nothing.** The `href` says `#contacts` and the id says `contact`. Ids and fragments must match exactly, including capital letters. Run `check.py`.
- **A page made only for a wide screen.** Fixed widths and long rows of links overflow on a phone. Use `max-width`, test with the device toolbar, and add a media query where a row does not fit.
- **Private data on a public page.** A phone number or home address on GitHub Pages stays in the history even after you delete it. Leave it out from the start.
- **The wrong repository name.** `yourname-github-io` or `portfolio` is published under a path, not at the short address. The name must be exactly `yourname.github.io`.

## Key terms

- **Portfolio**: a short page that shows who you are and what you have built, with links to the work.
- **Landmark element**: an element such as `<header>`, `<nav>`, `<main>` or `<footer>` that marks a big region of a page for readers and screen readers.
- **Fragment link**: a link such as `#projects` that scrolls to the element with that id instead of loading a page.
- **Responsive design**: building one page that adapts to every screen width, instead of a separate version for phones.
- **Media query**: a block of CSS, written `@media (condition) { ... }`, whose rules apply only when the condition is true.
- **CSS variable**: a value with a name that starts with `--`, set once and used with `var(...)`. Also called a custom property.

## Go further

- [MDN: Responsive web design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design): media queries and flexible layouts, with examples.
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties): how CSS variables work and where they apply.
- [GitHub Docs: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): user sites, project sites and their addresses, from GitHub itself.
