---
title: APIs and JSON
description: Read and write JSON, build a small JSON API with Flask, and call it with curl and with fetch from JavaScript.
lesson: "8.5"
time: 25 min
sidebar:
  order: 5
---

The weather app on your phone does not download a weather web page and cut the numbers out of it. It asks a server a short question, such as "the forecast for this town", and gets back only the data, with no HTML around it. Programs talk to each other like this all day, and in this lesson you build a small server that answers such questions, then ask it from the terminal and from JavaScript.

## Goal

After this lesson you can:

- Read and write JSON, and turn it into Python and JavaScript values.
- Build a small JSON API with Flask, with routes for reading and adding data.
- Call an API with `curl` and with `fetch`, and read its status codes.

## Why it matters

Most of the web today is APIs. Mobile apps, single-page sites, cloud services and the tools you will use in security work all send JSON over HTTP. Being able to call an API from the terminal lets you test a service without its app, and being able to read one tells you what data an app really exchanges. Many web flaws in Module 12 live in APIs, because their requests are easy to change.

## The idea

An **API** (Application Programming Interface) is an agreed way for one program to ask another for something. A **web API** does it over HTTP: each **endpoint**, a method plus a path such as `GET /api/tips`, does one job and answers with data instead of a page. It works like the menu and the counter of a takeaway. The menu lists what you can order and how to ask for it; you never walk into the kitchen, and the kitchen can change its tools without changing the menu.

The data is almost always **JSON** (JavaScript Object Notation): a text format that looks like the JavaScript objects and arrays from lesson 8.3, with stricter rules.

```json
{
  "id": 1,
  "text": "Read the whole error message.",
  "tags": ["errors", "terminal"],
  "done": false,
  "author": null
}
```

| JSON | Python | JavaScript |
|---|---|---|
| `{"a": 1}` object | `dict` | object |
| `[1, 2]` array | `list` | array |
| `"text"` | `str` | string |
| `1`, `2.5` | `int`, `float` | number |
| `true`, `false` | `True`, `False` | `true`, `false` |
| `null` | `None` | `null` |

The rules: names and texts always use double quotes, there are no comments, and there is no comma after the last item. Because it is plain text, any language can read and write it.

To build the API you will use **Flask**, a small **web framework** for Python. A framework is a library that does the repetitive work of a web server, such as reading requests, finding the right function and writing responses, so that you only write the functions. Each function is tied to a URL path by a **route**.

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f "flask --app"
sudo apt-get install -y -q python3-venv nodejs > /dev/null 2>&1
-->

The outputs below come from a user called `sam`; where a path shows `sam`, yours shows your own username.

### 1. Turn JSON into Python and back

```bash
mkdir -p ~/web/api
cd ~/web/api
```

```python
import json

text = '{"id": 1, "text": "Read the error", "done": false, "author": null}'
tip = json.loads(text)
print(tip)
print(tip["text"], type(tip["done"]))

tip["done"] = True
print(json.dumps(tip))
```

```output
{'id': 1, 'text': 'Read the error', 'done': False, 'author': None}
Read the error <class 'bool'>
{"id": 1, "text": "Read the error", "done": true, "author": null}
```

`json.loads` ("load from string") turns JSON text into Python values: an object becomes a dictionary, `false` becomes `False`, `null` becomes `None`. `json.dumps` ("dump to string") goes the other way. Look at the quotes: Python prints its dictionary with single quotes, which is not JSON. Only the `dumps` line is valid JSON.

### 2. Install Flask in a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

<!-- lab: nocheck -->
```bash
pip install flask
```

```output
Collecting flask
...
Installing collected packages: markupsafe, itsdangerous, click, blinker, werkzeug, jinja2, flask
Successfully installed blinker-1.9.0 click-8.5.1 flask-3.1.3 itsdangerous-2.2.0 jinja2-3.1.6 markupsafe-3.0.4 werkzeug-3.1.9
```

This is the venv from lesson 3.8: Flask and the packages it needs go into `.venv`, not into the system Python. pip prints a line for each download; the middle part is cut here. Your versions may be newer.

### 3. Write the API

```python title="api.py"
"""A small JSON API for the Byte Club tips."""
from flask import Flask, jsonify, request

app = Flask(__name__)

tips = [
    {"id": 1, "text": "Read the whole error message before you search for it."},
    {"id": 2, "text": "Press Tab to complete names in the terminal."},
]


@app.get("/api/tips")
def list_tips():
    word = request.args.get("search", "").lower()
    return jsonify([tip for tip in tips if word in tip["text"].lower()])


@app.get("/api/tips/<int:tip_id>")
def get_tip(tip_id):
    for tip in tips:
        if tip["id"] == tip_id:
            return jsonify(tip)
    return jsonify({"error": "no such tip"}), 404


@app.post("/api/tips")
def add_tip():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("text"), str) or not data["text"].strip():
        return jsonify({"error": "send a JSON object with a non-empty text"}), 400
    tip = {"id": max(t["id"] for t in tips) + 1, "text": data["text"].strip()}
    tips.append(tip)
    return jsonify(tip), 201
```

Read it from the top:

- `app = Flask(__name__)` creates the application.
- `@app.get("/api/tips")` is a **decorator**: the line above a function that registers it with Flask. It means "when a GET request for `/api/tips` arrives, call `list_tips` and send back what it returns". `@app.post` does the same for POST.
- `jsonify` turns Python values into a JSON response with the right `Content-Type`. A function can also return a pair, the body and a status code, as in `return ..., 404`.
- `request` holds the request that is being answered. `request.args` is the query string from lesson 8.1, and `request.get_json(silent=True)` reads a JSON body, or gives `None` if the body is not JSON.
- `<int:tip_id>` in a path is a variable part: `/api/tips/2` calls `get_tip(2)`.

The tips live in a Python list, in memory, so they are lost when the server stops. The project step uses a database instead.

### 4. Start the server

```bash
flask --app api run --port 5000 > flask.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
cat flask.log
```

```output
 * Serving Flask app 'api'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

`flask --app api run` loads `api.py` and starts Flask's own small web server, in the background and with its messages in `flask.log`. It listens on `127.0.0.1`, so only your own computer can reach it. The warning is honest: this server is made for development on your machine, not for real visitors.

### 5. Call the API with curl

```bash
curl -s http://127.0.0.1:5000/api/tips
```

```output
[{"id":1,"text":"Read the whole error message before you search for it."},{"id":2,"text":"Press Tab to complete names in the terminal."}]
```

That is the whole answer: JSON, with no spaces and no HTML. Programs do not need line breaks, but you do, so pipe it through Python's JSON tool:

```bash
curl -s http://127.0.0.1:5000/api/tips | python3 -m json.tool
```

```output
[
    {
        "id": 1,
        "text": "Read the whole error message before you search for it."
    },
    {
        "id": 2,
        "text": "Press Tab to complete names in the terminal."
    }
]
```

`python3 -m json.tool` reads JSON and prints it with indentation. It also stops with an error if the text is not valid JSON, which makes it a quick checker.

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:5000/api/tips
```

```output
200 application/json
```

The `Content-Type` of JSON is `application/json`. That header is how a client knows it can parse the body as JSON.

### 6. Ask for one tip, and for one that does not exist

```bash
curl -s http://127.0.0.1:5000/api/tips/2
curl -s -w "%{http_code}\n" http://127.0.0.1:5000/api/tips/9
```

```output
{"id":2,"text":"Press Tab to complete names in the terminal."}
{"error":"no such tip"}
404
```

A good API answers errors in JSON too, with a status code that matches. The program that calls it checks the code first: 2xx means "here is your data", 4xx means "your request was wrong", as in lesson 6.5.

### 7. Search with a query string

```bash
curl -s "http://127.0.0.1:5000/api/tips?search=tab"
```

```output
[{"id":2,"text":"Press Tab to complete names in the terminal."}]
```

`request.args.get("search", "")` read `tab` from the query string, and the list kept only the tips that contain it. The quotes around the URL stop the shell from reading the `?` as a wildcard.

### 8. Add a tip with POST

```bash
curl -s -w "%{http_code}\n" -H "Content-Type: application/json" -d '{"text": "Commit small changes often."}' http://127.0.0.1:5000/api/tips
```

```output
{"id":3,"text":"Commit small changes often."}
201
```

`-d` sends a body and makes the request a POST, and `-H` says the body is JSON. The answer is **201 Created**, with the new tip and its id. Now send something wrong:

```bash
curl -s -w "%{http_code}\n" -H "Content-Type: application/json" -d '{"txt": 42}' http://127.0.0.1:5000/api/tips
```

```output
{"error":"send a JSON object with a non-empty text"}
400
```

The server checked the input and refused it with **400 Bad Request**. Never assume a client sends what your page would send: anyone can type this curl command.

### 9. Call the API from JavaScript

```javascript title="fetch-tips.js"
async function main() {
  const response = await fetch("http://127.0.0.1:5000/api/tips");
  console.log(response.status, response.headers.get("content-type"));
  const tips = await response.json();
  for (const tip of tips) {
    console.log(`${tip.id}. ${tip.text}`);
  }
}

main();
```

```bash
node fetch-tips.js
```

```output
200 application/json
1. Read the whole error message before you search for it.
2. Press Tab to complete names in the terminal.
3. Commit small changes often.
```

`fetch` sends an HTTP request, the same in Node.js and in the browser. An answer from the network takes time, and JavaScript does not stop and wait for it. Instead, `fetch` returns at once with a promise of the answer, and **`await`** pauses this one function until the answer is there, while the rest of the program, or the page, keeps working. `await` only works inside a function marked `async`. `response.json()` reads the body and parses the JSON, which also takes time, so it gets an `await` too. The third tip is the one you added with curl: both clients talk to the same server.

### 10. Use the API from a page

The same `fetch` works in a page. Flask can also hand out ordinary files from a folder called `static`. Create a page there:

```html title="static/tips.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Byte Club tips</title>
  <script src="tips.js" defer></script>
</head>
<body>
  <h1>All tips</h1>
  <ul id="tips"></ul>
</body>
</html>
```

```javascript title="static/tips.js"
async function loadTips() {
  const response = await fetch("/api/tips");
  const tips = await response.json();
  const list = document.querySelector("#tips");
  for (const tip of tips) {
    const item = document.createElement("li");
    item.textContent = tip.text;
    list.append(item);
  }
}

loadTips();
```

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:5000/static/tips.html
```

```output
200 text/html; charset=utf-8
```

Open `http://127.0.0.1:5000/static/tips.html` in your browser (in Codespaces, use the address offered for port 5000, as in lesson 8.1). The page arrives with an empty list, then its script asks the API for the tips and adds one `<li>` per tip: `createElement` makes a new element and `append` puts it into the list. In the Network panel of the developer tools you see the page, the script, and then a request for `/api/tips` of type `fetch`. The address `"/api/tips"` has no host, so the browser sends it to the server the page came from.

```bash
pkill -f "flask --app"
deactivate
```

:::note[Same origin]
A page may freely read answers from the server it came from. If a page from another site asked your API for data, the browser would not let that page read the answer, unless your server allows it with special headers. This rule, the same-origin policy, protects you from sites that try to read your data from other sites. Module 12 comes back to it.
:::

## Exercise

Add an endpoint `DELETE /api/tips/<id>` that removes a tip. It answers `204` with an empty body when it worked, and `404` with a JSON error when there is no such tip. Restart the server and test both cases with `curl -X DELETE`, which sends a DELETE request.

Hint: `@app.delete(...)` works like `@app.get(...)`, and `return "", 204` sends an empty answer.

<details>
<summary>Show the solution</summary>

Add this function to the end of `api.py`:

```python
@app.delete("/api/tips/<int:tip_id>")
def delete_tip(tip_id):
    for tip in tips:
        if tip["id"] == tip_id:
            tips.remove(tip)
            return "", 204
    return jsonify({"error": "no such tip"}), 404
```

<!-- lab: run
cd ~/web/api
cat >> api.py <<'EOF'


@app.delete("/api/tips/<int:tip_id>")
def delete_tip(tip_id):
    for tip in tips:
        if tip["id"] == tip_id:
            tips.remove(tip)
            return "", 204
    return jsonify({"error": "no such tip"}), 404
EOF
-->

Start the server again, so that it loads the new code:

```bash
source .venv/bin/activate
flask --app api run --port 5000 > flask.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -w "%{http_code}\n" -X DELETE http://127.0.0.1:5000/api/tips/1
curl -s -w "%{http_code}\n" -X DELETE http://127.0.0.1:5000/api/tips/1
curl -s http://127.0.0.1:5000/api/tips
```

```output
204
{"error":"no such tip"}
404
[{"id":2,"text":"Press Tab to complete names in the terminal."}]
```

The first DELETE removed tip 1 and answered 204 with no body, so only the code is printed. The second found nothing to delete. The list now holds only tip 2: the tip you added with POST is gone too, because the restart emptied the memory and started again from the two tips in the code.

```bash
pkill -f "flask --app"
deactivate
```

</details>

## Check yourself

**1. What is wrong with this JSON: `{'name': 'Sam', 'ctfs': 3,}`?**

<details>
<summary>Answer</summary>

Two things: JSON needs double quotes, not single quotes, and it does not allow a comma after the last item. The correct form is `{"name": "Sam", "ctfs": 3}`.

</details>

**2. What do the status codes 200, 201, 400 and 404 tell the client of an API?**

<details>
<summary>Answer</summary>

200: here is what you asked for. 201: the thing you sent was created. 400: your request was wrong, for example invalid JSON or a missing field. 404: there is nothing at that address, for example no tip with that id.

</details>

**3. In `@app.get("/api/tips/<int:tip_id>")`, what does `<int:tip_id>` do?**

<details>
<summary>Answer</summary>

It makes that part of the path a variable. Flask checks that it is a whole number and passes it to the function as `tip_id`, so `/api/tips/2` calls the function with `tip_id = 2`.

</details>

**4. Why does `fetch-tips.js` write `await` before `fetch(...)` and before `response.json()`?**

<details>
<summary>Answer</summary>

Both take time: one waits for the answer from the network, the other reads and parses the body. `await` pauses the function until the result is ready, without blocking the rest of the program.

</details>

**5. The page in `static/tips.html` checks nothing before it sends a request. Why must the API check every POST anyway?**

<details>
<summary>Answer</summary>

Anyone can call the API without the page, for example with curl, and send any body. Only the checks on the server are sure to run.

</details>

## Common mistakes

- **Forgetting `Content-Type: application/json` on a POST.** Without it, `request.get_json(silent=True)` gives `None` and the API answers 400. Add `-H "Content-Type: application/json"` to curl.
- **Single quotes inside JSON.** `'{"text": "ok"}'` is right in the shell: the single quotes are for the shell, and the JSON inside uses double quotes. `"{'text': 'ok'}"` is not JSON.
- **Changes that do not appear.** The Flask server loaded your code when it started. Stop it and start it again after every change.
- **`Address already in use`.** An old server still holds port 5000. Stop it with `pkill -f "flask --app"`, or choose another port with `--port`.
- **Using the answer before it arrives.** Without `await`, `fetch` gives you a promise, not the response, and `response.json` is not what you think. Put `await` before both.

## Key terms

- **API**: Application Programming Interface, an agreed way for one program to ask another for data or actions.
- **Web API**: an API that works over HTTP, with URLs that answer with data instead of pages.
- **Endpoint**: one method and path of a web API, such as `GET /api/tips`, that does one job.
- **JSON**: JavaScript Object Notation, a text format for data made of objects, arrays, texts, numbers, `true`, `false` and `null`.
- **Web framework**: a library, such as Flask, that does the routine work of a web server so that you write only the functions.
- **Flask**: a small web framework for Python.
- **Route**: the link between a URL path and the function that answers it.
- **Decorator**: a line starting with `@` above a function, which hands the function to something else, such as `@app.get` to Flask.
- **`await`**: a JavaScript keyword that pauses an `async` function until a slow result, such as a network answer, is ready.

## Go further

- [Flask: Quickstart](https://flask.palletsprojects.com/en/stable/quickstart/): routes, requests and responses, from the Flask documentation.
- [MDN: Working with JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON): JSON in JavaScript, with examples.
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch): every option of `fetch`, including how to send JSON.
