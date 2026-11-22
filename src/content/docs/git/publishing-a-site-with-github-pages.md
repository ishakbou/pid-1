---
title: Publishing a site with GitHub Pages
description: Put a simple web page online for free with GitHub Pages, straight from a repository, and update it with an ordinary commit and push.
lesson: "2.7"
time: 20 min
sidebar:
  order: 7
---

<!-- lab: run
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
git config --global pull.rebase false
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
export GIT_AUTHOR_DATE="2026-11-21T15:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T15:00:00+0000"
-->

GitHub will host a small website for you, for free, at an address with your own name in it. There is no server to rent and nothing to install: you push files to a repository, flip one setting, and a minute later anyone in the world can open your page. The site you are reading right now is published with GitHub Pages too.

## Goal

After this lesson you can:

- Explain what GitHub Pages does, and what a static site is.
- Publish a page from a repository and find its address.
- Update the site with an ordinary commit and push.

## Why it matters

A page with your name on it, your projects and a way to contact you is worth more than a line on a CV that says "I know git". GitHub Pages is also how many open source projects publish their documentation, so you will meet it again and again. And because the site is just a repository, everything you learned in this module still applies: commits, branches, pull requests and the history of every change.

## The idea

**GitHub Pages** is a GitHub service that takes the files of one branch of a repository and serves them as a website. It serves a **static site**: the files are sent to the visitor exactly as they are stored. No program of yours runs on the server, so Pages can show pages, pictures and styles, but it cannot run a Python program or keep a database for each visitor. Modules 6 to 8 build that kind of site on your own machine.

The pages are written in **HTML**, the language that tells a browser what is a heading, a paragraph or a link. Module 8 teaches it properly; today you only copy a small page. When an address names a folder and not a file, most web servers, GitHub Pages included, send the file called **`index.html`** in that folder. That is why the first page of a site is usually `index.html`.

The address of the site depends on the name of the repository:

| Repository | Address |
|---|---|
| `yourname/my-page` | `https://yourname.github.io/my-page/` |
| `yourname/yourname.github.io` | `https://yourname.github.io/` |

The second kind is your personal site: one per account, at the shortest address.

Think of a shop window. Whatever you put in it, passers-by see exactly that. To change what they see, you change the window, and here that means a commit and a push. At the time of writing, on a free account, Pages works for public repositories, so everything in the repository is public as well. Never put anything secret in it.

## Try it

The git steps run on your computer. The GitHub steps happen in your browser, with your own account, so the course cannot show their output. Replace `yourname` with your GitHub username.

### 1. Make a repository for the site

```bash
mkdir ~/my-page
cd ~/my-page
git init
```

```output
Initialized empty Git repository in /home/sam/my-page/.git/
```

A site is a project like any other, so it gets its own repository.

### 2. Write the page

Create `index.html` in `~/my-page` with nano:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sam's page</title>
</head>
<body>
  <h1>Hello, I am Sam</h1>
  <p>I am learning git, Linux and security with the PID 1 course.</p>
  <ul>
    <li>Module 1: Linux and the terminal</li>
    <li>Module 2: Git and GitHub</li>
  </ul>
</body>
</html>
```

Put your own name and words in it. Each pair of **tags**, such as `<h1>` and `</h1>`, marks a part of the page: `h1` is the main heading, `p` a paragraph, `ul` a list and `li` one item of it. The `head` part holds information about the page, such as the `title` shown on the browser tab. That is all you need to know for now.

### 3. Look at it on your own computer

Before you publish, look at the page in a browser. Python, which comes with Ubuntu, has a small web server built in. Run it in the folder of the site:

<!-- lab: skip -->
```bash
python3 -m http.server 8000
```

It answers `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...` and keeps running. Open `http://localhost:8000` in your browser, also in Windows if you use WSL. You see your page, and the terminal prints one line for each file the browser asks for. Press Ctrl+C in the terminal to stop the server. Module 6 explains addresses and ports; for now, `localhost` means "this computer".

### 4. Commit the page

```bash
git add index.html
git commit -m "Add first page"
```

```output
[main (root-commit) 842ee0a] Add first page
 1 file changed, 15 insertions(+)
 create mode 100644 index.html
```

### 5. Push it to GitHub

On GitHub, create a new repository called `my-page`. Make it **Public** and leave it empty, as in lesson 2.5. Then connect and push:

<!-- lab: skip -->
```bash
git remote add origin git@github.com:yourname/my-page.git
git push -u origin main
```

Reload the repository page on GitHub: `index.html` is there. It is not a website yet, only a file in a repository.

### 6. Turn on Pages

In the repository on GitHub, open Settings, then Pages in the menu on the left. At the time of writing, the screen has a part called Build and deployment:

1. Under Source, choose Deploy from a branch.
2. Under Branch, choose `main` and the folder `/ (root)`, and click Save.

GitHub now builds the site. After a minute or so, reload the Pages settings: they show "Your site is live at" with the address, `https://yourname.github.io/my-page/`. Open it. That is your page, on the internet. You can follow the build on the Actions tab of the repository, where it appears as a run called "pages build and deployment".

### 7. Add a second page and a link

A site with one page is a start. Add an "About" page:

```html title="about.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>About Sam</title>
</head>
<body>
  <h1>About me</h1>
  <p>I like pancakes, Linux and finding out how things work.</p>
  <p><a href="index.html">Back to the start</a></p>
</body>
</html>
```

An `a` tag is a link, and `href` says where it goes. `index.html` is a relative path, exactly as in lesson 1.2: the browser looks for it in the same folder as the page. That way the link works on your computer and on GitHub, whatever the address is.

Now add a link to the new page in `index.html`. Open it and put this line just before `</body>`:

```text
  <p><a href="about.html">About me</a></p>
```

<!-- lab: run
sed -i 's|^</body>|  <p><a href="about.html">About me</a></p>\n</body>|' index.html
-->

```bash
git status --short
git diff
```

```output
 M index.html
?? about.html
diff --git a/index.html b/index.html
index b6c0caa..c47ca06 100644
--- a/index.html
+++ b/index.html
@@ -11,5 +11,6 @@
     <li>Module 1: Linux and the terminal</li>
     <li>Module 2: Git and GitHub</li>
   </ul>
+  <p><a href="about.html">About me</a></p>
 </body>
 </html>
```

The diff shows one new line, right where it should be. If you still have the local server from step 3 running, reload `http://localhost:8000` and click the link.

### 8. Publish the update

```bash
git add index.html about.html
git commit -m "Add an About page"
```

```output
[main a3987cf] Add an About page
 2 files changed, 13 insertions(+)
 create mode 100644 about.html
```

<!-- lab: skip -->
```bash
git push
```

That is the whole publishing process from now on: commit, push, wait a minute, reload. Each push starts a new run on the Actions tab. When it finishes, `https://yourname.github.io/my-page/about.html` exists, and the link on the first page leads there.

## Exercise

1. Add a page `projects.html` to `~/my-page`, with the heading `My projects`, a list with one item, `recipes: my first git repository`, and a link back to `index.html`.
2. Link to it from `index.html`, next to the About link.
3. Commit both files with one commit, and push.
4. Check with `git log --oneline` that your site has three commits.

<details>
<summary>Show the solution</summary>

```html title="projects.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sam's projects</title>
</head>
<body>
  <h1>My projects</h1>
  <ul>
    <li>recipes: my first git repository</li>
  </ul>
  <p><a href="index.html">Back to the start</a></p>
</body>
</html>
```

In `index.html`, add this line under the About link:

```text
  <p><a href="projects.html">My projects</a></p>
```

<!-- lab: run
sed -i 's|^</body>|  <p><a href="projects.html">My projects</a></p>\n</body>|' index.html
-->

```bash
git add index.html projects.html
git commit -qm "Add a projects page"
git log --oneline
```

```output
18da885 (HEAD -> main) Add a projects page
a3987cf Add an About page
842ee0a Add first page
```

Then `git push`, wait a minute, and open `https://yourname.github.io/my-page/projects.html`. If you put the recipes repository on GitHub in lesson 2.5, you can make the list item a link to it, with its address in `href`.

</details>

## Check yourself

**1. The user `sam-lee` publishes the repository `notes` with Pages. What is the address of the site?**

<details>
<summary>Answer</summary>

`https://sam-lee.github.io/notes/`.

</details>

**2. Why is the first page of the site called `index.html`?**

<details>
<summary>Answer</summary>

When an address names a folder and not a file, the web server sends the file called `index.html` in that folder. So `https://sam-lee.github.io/notes/` shows `index.html`.

</details>

**3. You pushed a change, but the site still shows the old page. Name two possible reasons.**

<details>
<summary>Answer</summary>

GitHub has not finished building the new version yet: check the Actions tab and wait a minute. Or you pushed to a different branch than the one Pages publishes from, which is set in Settings, then Pages. Your browser may also show a copy it kept: reload the page.

</details>

**4. Can a GitHub Pages site run a Python program for each visitor?**

<details>
<summary>Answer</summary>

No. Pages serves a static site: it sends the stored files as they are, and runs no program of yours on the server.

</details>

**5. Why must nothing secret go into the repository of a Pages site?**

<details>
<summary>Answer</summary>

On a free account, Pages works for public repositories, so anyone can read every file and every old commit of the repository, not only the pages.

</details>

## Common mistakes

- **Naming the first page differently.** With `Index.html` or `home.html`, the site's address gives a "404" error, or shows your `README.md` if the repository has one. Name it exactly `index.html`, in the folder Pages publishes.
- **Absolute links that start with `/`.** On `yourname.github.io/my-page/`, a link to `/about.html` goes to `yourname.github.io/about.html`, outside your site. Use relative links such as `about.html`.
- **Expecting the change at once.** Each push needs a short build. Watch the Actions tab, then reload. If the old page still shows, your browser may be showing a copy it kept: reload once more.
- **A folder whose name starts with `_` goes missing.** When Pages publishes from a branch, it runs the files through a tool called Jekyll, which skips such names. Rename the folder, or add an empty file called `.nojekyll` to the top of the repository.
- **Choosing a private repository.** On a free account, Pages needs a public repository. If the Pages settings ask you to upgrade, check the visibility of the repository.

## Key terms

- **GitHub Pages**: the GitHub service that serves the files of a repository branch as a website.
- **Static site**: a website whose files are sent to visitors exactly as stored, with no program running on the server for each visit.
- **HTML**: the language web pages are written in. It marks the parts of a page with tags.
- **Tag**: a marker such as `<p>` and `</p>` that says what a part of an HTML page is.
- **`index.html`**: the file most web servers send when an address names a folder, so usually the first page of a site.

## Go further

- [GitHub Docs: Quickstart for GitHub Pages](https://docs.github.com/en/pages/quickstart): GitHub's own short guide to a first site.
- [GitHub Docs: Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): the choice between a branch and a workflow, and the `/docs` folder option.
- [MDN: HTML](https://developer.mozilla.org/en-US/docs/Web/HTML): the reference and guides for HTML that Module 8 builds on.
