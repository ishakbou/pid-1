---
title: JavaScript basics
description: Write JavaScript with variables, functions, arrays and objects, then use events and the DOM to make a page react when the reader clicks or sends a form.
lesson: "8.3"
time: 25 min
sidebar:
  order: 3
---

Type your name in the Byte Club form, click "Join", and you land on an error page, because no server is listening at `/join`. What if the page could answer by itself, right away, without asking any server? For that the page needs a program of its own, and the only language that every browser runs is JavaScript.

## Goal

After this lesson you can:

- Write JavaScript with variables, functions, arrays and objects, and run it with Node.js.
- Connect a script to a page, and make it react to clicks and form submissions.
- Change what the page shows through the DOM, safely.

## Why it matters

Almost every page you use runs JavaScript: menus that open, forms that check what you typed, feeds that load more posts. You do not need to become a JavaScript developer, but you need to read it. Lesson 8.5 uses it to fetch data from a server, and in Module 12 you will see that cross-site scripting is exactly this: someone else's JavaScript running in your page.

## The idea

**JavaScript** is a programming language. Browsers have it built in, and **Node.js** is a program that runs it outside the browser, in a terminal. You already know Python, and the ideas are the same. Mostly the spelling changes:

| Idea | Python | JavaScript |
|---|---|---|
| Print | `print("hi")` | `console.log("hi")` |
| A variable | `count = 0` | `let count = 0;` |
| A variable that never changes | (no keyword) | `const club = "Byte Club";` |
| A text with values in it | `f"Hi {name}"` | `` `Hi ${name}` `` |
| Equal | `==` | `===` |
| A block | indentation and `:` | braces `{ }` |
| A list and a dictionary | `[1, 2]`, `{"a": 1}` | an **array** `[1, 2]`, an **object** `{ a: 1 }` |

Indentation does not matter to JavaScript, only the braces do, but indent anyway so people can read it. Semicolons end statements. JavaScript can usually guess where they go, but writing them is a good habit.

In the browser, a script can reach the page through the **DOM** (Document Object Model): the tree of elements you printed in lesson 8.1, turned into objects. `document` is the whole page, and `document.querySelector("#tip")` finds the first element that matches a CSS selector, the same selectors as in lesson 8.2. Change the object, and the browser redraws the page.

A script reacts to what the reader does through **events**: a click, a key press, a form being sent. You attach an **event listener**, a function the browser calls when that event happens on that element. It works like a doorbell. You do not stand at the door all day; you install the bell, and when someone presses it, you go and open.

## Try it

<!-- lab: run
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
cd ~
-->

This lesson continues the site from lessons 8.1 and 8.2 in `~/web/site`. The outputs come from a user called `sam`; where a path shows `sam`, yours shows your own username.

### 1. Install Node.js

<!-- lab: nocheck -->
```bash
sudo apt install -y nodejs
node --version
```

```output
v18.19.1
```

apt prints its usual lines first, as in lesson 1.6, and they are left out here. Your version may be newer, which is fine for this lesson. In the course's Codespaces lab, Node.js is already installed.

### 2. Variables and types

```bash
mkdir -p ~/web/js
cd ~/web/js
```

```javascript title="basics.js"
const club = "Byte Club";
let members = 12;
members = members + 1;

console.log(club, "has", members, "members");
console.log(typeof club, typeof members, typeof true);
console.log("12" + 1, "12" - 1, 12 === "12");
console.log(`Welcome to ${club}.`);
```

```bash
node basics.js
```

```output
Byte Club has 13 members
string number boolean
121 11 false
Welcome to Byte Club.
```

`let` makes a variable you can change later, and `const` one you cannot: assigning to `club` again would stop the program with an error. Use `const` by default and `let` only when the value must change. `console.log` prints its values with spaces between them, like `print` in Python.

Look at the third line. In Python, `"12" + 1` is a `TypeError`. JavaScript turns the number into text and glues them together: `"121"`. With `-`, which has no meaning for text, it turns the text into a number instead: `11`. This guessing is called type conversion, and it causes many bugs. `===` checks the value and the type, so `12 === "12"` is `false`. Always use `===`, never the older `==`, which converts first.

### 3. Functions

```javascript title="greet.js"
function greet(name, level) {
  if (level === "new") {
    return `Welcome, ${name}. Start with Linux basics on Monday.`;
  }
  return `Welcome back, ${name}. See you at the CTF on Thursday.`;
}

const shout = (text) => text.toUpperCase();

console.log(greet("Sam", "new"));
console.log(greet("Alex", "some"));
console.log(shout("byte club"));
```

```bash
node greet.js
```

```output
Welcome, Sam. Start with Linux basics on Monday.
Welcome back, Alex. See you at the CTF on Thursday.
BYTE CLUB
```

`function greet(name, level) { ... }` works like `def greet(name, level):` in Python, with braces instead of indentation. The second form, `(text) => text.toUpperCase()`, is an **arrow function**: a short way to write a small function, often used for event listeners. Here it is stored in `shout`, and it returns the value after the arrow.

### 4. Arrays and objects

```javascript title="data.js"
const tips = ["Read the error message", "Press Tab to complete"];
tips.push("Commit small changes");
console.log(tips.length, tips[0]);

for (const tip of tips) {
  console.log("- " + tip);
}

const member = { name: "Sam", level: "new", ctfs: 0 };
member.ctfs += 1;
console.log(member.name, member.ctfs);
console.log(member);
```

```bash
node data.js
```

```output
3 Read the error message
- Read the error message
- Press Tab to complete
- Commit small changes
Sam 1
{ name: 'Sam', level: 'new', ctfs: 1 }
```

An array is JavaScript's list: `push` adds to the end, `length` counts, and `[0]` is the first item. `for (const tip of tips)` is Python's `for tip in tips:`. An object holds named values, like a dictionary, and you reach them with a dot: `member.ctfs`. Remember the shape of that last line: lesson 8.5 sends data across the network in almost exactly this form.

### 5. Add a script to the page

Back to the site. Replace `index.html` with this version:

```bash
cd ~/web/site
```

```html title="index.html"
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
```

The `<script>` line in the head loads `script.js`. `defer` tells the browser to run the script only after it has read the whole page, so the elements the script looks for already exist. There is a new card for tips, with a paragraph and a button that each have an id. Under the form, an empty paragraph waits for an answer; `role="status"` tells screen readers to read it out when it changes.

### 6. Write the script

```javascript title="script.js"
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
```

Read it in two parts.

- **The tips.** `querySelector` finds the paragraph and the button. `showTip` puts the current tip into the paragraph through `textContent`, the text inside an element, then moves `current` to the next tip. `%` is the remainder, as in Python, so after the last tip it goes back to 0. `addEventListener("click", showTip)` hands the function to the browser, to call on every click. Note `showTip` without brackets: you give the function itself, you do not call it. The last line calls it once, so a tip shows right away.
- **The form.** The listener runs when the form is sent. `event.preventDefault()` cancels what the browser would normally do, which is to load `/join?name=...`. Then it reads the two fields by their `name`, removes spaces at the ends with `trim()`, and writes the greeting into the answer paragraph.

### 7. Check the script before the browser does

```bash
node --check script.js && echo "syntax OK"
```

```output
syntax OK
```

`node --check` reads the file and reports mistakes in the writing, such as a missing brace, without running it. `&&` runs the `echo` only if the check passed, as in Module 1. Running it is a different story:

```bash
node script.js 2>&1 | grep Error
```

```output
ReferenceError: document is not defined
```

Node.js is JavaScript without a page, so it has no `document`. The DOM is not part of the language: the browser provides it. That is why the rest of this script can only be tried in a browser.

### 8. Try it in the browser

```bash
python3 -m http.server 8000 > ~/web/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

Open `http://127.0.0.1:8000/` and reload. The tip card shows the first tip, not the text from the HTML, because the script replaced it. Click "Next tip" three times and you are back at the first one. Type your name, pick a level and click "Join": the greeting appears under the form, and the address bar does not change, because no request was sent. Leave the name empty and click "Join": the browser stops you before the `submit` event even happens, because of `required`.

Now open the developer tools and choose the **Console** tab. It shows the messages and errors of the page's scripts, and you can type JavaScript there and press Enter. Type `document.querySelector("h1").textContent = "Hello"`: the main heading changes at once. A reload brings back the real one, because you changed the page in your browser, not the file on the server.

```bash
pkill -f http.server
```

:::caution[textContent, not innerHTML]
Elements also have `innerHTML`, which reads the text you give it as HTML. If the script did `answer.innerHTML = greet(name, level)`, a "name" such as `<img src=x onerror=alert(1)>` would become a real element and run code. That is cross-site scripting, the subject of a whole lesson in Module 12. When you put text from a user into a page, always use `textContent`.
:::

## Exercise

Under the list of meetings, add a button "I am coming" and a paragraph `<p>Coming so far: <span id="count">0</span></p>`. Each click on the button adds one to the number. After the first click, the button text changes to "Thanks, see you there". Check the syntax with `node --check`, then try it in the browser.

Hint: a `<span>` is an inline container for a few words, so the script can change just the number. `Number("4")` turns a text into a number.

<details>
<summary>Show the solution</summary>

In `index.html`, right after the `</ol>` of the meetings:

```html
  <button type="button" id="coming">I am coming</button>
  <p>Coming so far: <span id="count">0</span></p>
```

At the end of `script.js`:

```javascript
const comingButton = document.querySelector("#coming");
const count = document.querySelector("#count");

comingButton.addEventListener("click", () => {
  count.textContent = Number(count.textContent) + 1;
  comingButton.textContent = "Thanks, see you there";
});
```

<!-- lab: run
cd ~/web/site
cat >> script.js <<'EOF'

const comingButton = document.querySelector("#coming");
const count = document.querySelector("#count");

comingButton.addEventListener("click", () => {
  count.textContent = Number(count.textContent) + 1;
  comingButton.textContent = "Thanks, see you there";
});
EOF
-->

```bash
node --check script.js && echo "syntax OK"
```

```output
syntax OK
```

`Number(count.textContent)` is needed because `textContent` is always text: without it, `"0" + 1` would give `"01"`, the conversion trap from step 2. The counter lives only in this one page in your browser. Reload, and it starts at 0 again; nobody else sees your clicks. Keeping a count for everyone needs a server, which is where lesson 8.5 starts.

</details>

## Check yourself

**1. When do you use `const` and when `let`?**

<details>
<summary>Answer</summary>

`const` for a variable that is never assigned again, which is most of them. `let` for one whose value changes, such as a counter.

</details>

**2. What do `"5" + 1` and `"5" === 5` give in JavaScript, and why?**

<details>
<summary>Answer</summary>

`"5" + 1` gives the text `"51"`, because `+` with a text turns the number into text and joins them. `"5" === 5` is `false`, because `===` compares the type too, and one is text and the other a number.

</details>

**3. Why does `node script.js` fail with `document is not defined`, when the same file works in the browser?**

<details>
<summary>Answer</summary>

`document` belongs to the DOM, which the browser provides for the page it shows. Node.js runs JavaScript without any page, so there is no `document`.

</details>

**4. What does `event.preventDefault()` do in the submit listener?**

<details>
<summary>Answer</summary>

It cancels the browser's normal action for that event. For a form, that action is to send the fields to the `action` address and load the answer, so with `preventDefault` no request is sent and the page stays.

</details>

**5. Why does the script write the greeting with `textContent` and not `innerHTML`?**

<details>
<summary>Answer</summary>

The greeting contains the name the user typed. `innerHTML` would read it as HTML, so a "name" with tags in it could add elements and run code in the page. `textContent` always shows it as plain text.

</details>

## Common mistakes

- **Calling the function instead of passing it.** `addEventListener("click", showTip())` runs `showTip` once, right away, and passes its result, which is nothing. Write `showTip` without brackets.
- **`null` errors.** `Cannot read properties of null` in the console means `querySelector` found nothing: a typo in the selector, or a script that ran before the page was read. Check the id, and keep `defer` on the `<script>` tag.
- **Using `==`.** It converts types before comparing, so `0 == ""` is `true`. Use `===`.
- **Looking for errors on the page.** A broken script shows nothing on the page itself. Open the Console in the developer tools: the error is there, with the file name and the line.
- **Trusting checks in JavaScript.** Anyone can turn off JavaScript or send requests without the page. A check in the browser helps users; the server must check again.

## Key terms

- **JavaScript**: the programming language that browsers run, also used outside them.
- **Node.js**: a program that runs JavaScript outside the browser, for example in a terminal.
- **Array (JavaScript)**: an ordered list of values in JavaScript, written `[1, 2, 3]`.
- **Object (JavaScript)**: a group of named values, written `{ name: "Sam" }`, reached with a dot.
- **Arrow function**: a short way to write a function, such as `(x) => x + 1`.
- **DOM**: the Document Object Model, the tree of a page's elements as objects that scripts can read and change.
- **Event**: something that happens in the page, such as a click or a form being sent.
- **Event listener**: a function that the browser calls each time a given event happens on a given element.

## Go further

- [MDN: JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): Mozilla's guide and reference for the language.
- [MDN: The Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model): how pages become objects, and how scripts use them.
- [Node.js: Introduction](https://nodejs.org/learn/getting-started/introduction-to-nodejs): what Node.js is, from its own documentation.
