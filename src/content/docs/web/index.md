---
title: "Module 8: The Web"
description: Write pages with HTML, CSS and JavaScript, follow what browsers and servers say to each other, build a JSON API and a login with Flask, and publish a page of your own.
module: 8
sidebar:
  order: 0
  label: Overview
---

You use the web all day, and most of it is three plain text languages and a lot of short conversations between a browser and a server. In this module you write a small club website by hand, watch every request it makes, build a JSON API and a login with Flask, and put a portfolio page online at your own address. At the end, `mylab` becomes a real web application: a notes app with a login, built on the database from Module 7.

## What you will learn

- How to structure a page with HTML: headings, links, lists, images and forms, and what a form sends.
- How to style it with CSS: selectors, the cascade, the box model, flexbox and media queries.
- How to make it react with JavaScript: variables, functions, events and the DOM, using `textContent` to stay safe.
- What happens in a page load, from the URL to the pixels, and how to follow it with curl and the developer tools.
- What an API is, how to read and write JSON, and how to call an API with curl and `fetch`.
- How cookies and signed sessions let a site remember you, and why a cookie value can never be trusted.
- How to build a Flask app with templates, a login and per-user data, and publish a static page with GitHub Pages.

## Before you start

You need the terminal from [Module 1](../linux/), with background jobs, pipes and `grep`, and git and GitHub from [Module 2](../git/), including lesson 2.7 on GitHub Pages. Several lessons use small Python scripts, and lessons 8.5 to 8.8 use Flask, so [Module 3](../python/) should be behind you, with virtual environments and pip. [Module 6](../networking/) explains the HTTP requests, ports and status codes that this module uses all the time. The project step builds on the database code from the [Module 7 project step](../databases/project/).

Everything runs on your own machine, in Ubuntu (on WSL, in Codespaces or installed), plus a desktop browser for the pages. You need an internet connection to install Node.js and Flask, and to publish your portfolio.

## Time

8 lessons, about 3 hours and 20 minutes of reading and practice.

## Module map

```mindmap
The Web
  Pages
    HTML elements
    forms
    CSS rules
    box model
    media queries
  In the browser
    JavaScript
    DOM and events
    page load
    developer tools
  Talking to servers
    JSON
    APIs and fetch
    Flask routes
  Remembering users
    cookies
    signed sessions
    secret key
  Shipping it
    portfolio page
    GitHub Pages
    mylab notes app
```

## Lessons

1. 8.1 [HTML basics](../web/html-basics/): structure a page with headings, links, lists, images and forms.
2. 8.2 [CSS basics](../web/css-basics/): selectors, the box model, and a simple readable layout.
3. 8.3 [JavaScript basics](../web/javascript-basics/): variables, functions, events, and changing the page.
4. 8.4 [How browsers and servers talk](../web/how-browsers-and-servers-talk/): follow a page load from URL to pixels with the browser's developer tools.
5. 8.5 [APIs and JSON](../web/apis-and-json/): call an API with curl and fetch, and build a small JSON endpoint.
6. 8.6 [Cookies and sessions](../web/cookies-and-sessions/): how a site remembers you between requests, and why that matters for security.
7. 8.7 [Build and publish a portfolio page](../web/build-and-publish-a-portfolio-page/): write a personal page and put it online with GitHub Pages.
8. 8.8 [Project step: the mylab web app](../web/project/): turn mylab into a small notes app with pages, a form, a login and the database from Module 7.

## Project step

`mylab` gets a face. You write `app/app.py` with Flask: routes for the home page, the login, the logout and the notes, each one checking on the server who is logged in. The pages come from Jinja templates in `app/templates/`, which escape every value they show, and one style sheet in `app/static/style.css`. The login keeps the user in a signed session cookie, whose secret key lives in `data/secret_key`, ignored by git like the database. You test it all with curl, including what happens when one user tries to delete another user's note. The app is simple on purpose: passwords are still plain text until Module 10, and Module 12 tests it for the common web flaws.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: HTML, CSS and HTTP](../web/cheat-sheet/).
