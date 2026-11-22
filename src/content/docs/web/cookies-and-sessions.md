---
title: Cookies and sessions
description: See how a site remembers you between requests with cookies and sessions, why a plain cookie cannot be trusted, and which cookie settings protect a login.
lesson: "8.6"
time: 25 min
sidebar:
  order: 6
---

In lesson 6.5 you learned that HTTP is stateless: the server handles every request as if it had never seen you before. Yet you log in to a site once, click through twenty pages, and every page greets you by name. Something travels with each of those requests and says "it is me again". That something is a cookie, and in this lesson you watch it, read it, and try to fake it.

## Goal

After this lesson you can:

- Explain how cookies let a server recognise a browser across requests.
- Build a login that keeps a user logged in with a signed session cookie.
- Say why a cookie value cannot be trusted, and which cookie settings protect a session.

## Why it matters

The session cookie is the key to your account. Whoever holds it is you, as far as the site knows, without needing your password. That is why attackers try to steal cookies, and why so much of web security is about protecting them. Your `mylab` app gets a login in lesson 8.8, and it uses exactly what you build here.

## The idea

A **cookie** is a small piece of data, a name and a value, that a server asks the browser to keep. The server sends it in a `Set-Cookie` header of a response. From then on, the browser adds a `Cookie` header with that value to every request it sends to the same site.

```text
Response:  Set-Cookie: visits=1; Max-Age=3600; Path=/
Request:   Cookie: visits=1
```

A **session** is the time a server recognises one visitor across many requests, and the data it keeps for them, such as "logged in as sam". There are two common ways to build one on top of cookies.

- **A session id.** The cookie holds only a long random number. The server keeps the data in its own memory or database, filed under that number. This works like a cloakroom ticket: the ticket says nothing about you or your coat, but whoever shows it gets the coat.
- **A signed cookie.** The cookie holds the data itself, plus a **signature**: a code that the server computes from the data and a **secret key** that only the server knows. Anyone can read the data, but changing it breaks the signature, and the server notices. Flask's sessions work this way.

A cookie can carry **attributes** after its value, which tell the browser how to handle it:

| Attribute | Meaning |
|---|---|
| `Max-Age=3600` or `Expires=...` | Keep the cookie this long. Without it, the cookie goes when the browser closes |
| `Path=/` | Send the cookie for every path on the site |
| `HttpOnly` | Scripts in the page cannot read the cookie; only the browser sends it |
| `Secure` | Send the cookie only over HTTPS, never over plain HTTP |
| `SameSite=Lax` | Do not send the cookie with most requests that other sites start |

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f "flask --app"
sudo apt-get install -y -q python3-venv > /dev/null 2>&1
mkdir -p ~/web/api
cd ~/web/api
python3 -m venv .venv
.venv/bin/pip install -q flask > /dev/null 2>&1
cd ~
-->

This lesson uses the virtual environment with Flask from lesson 8.5, in `~/web/api/.venv`. If you do not have it, create it again as in that lesson.

### 1. Count visits with a plain cookie

```bash
mkdir -p ~/web/session
cd ~/web/session
source ~/web/api/.venv/bin/activate
```

```python title="remember.py"
"""Two ways to remember a visitor: a plain cookie and a signed session."""
import secrets

from flask import Flask, make_response, request, session

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # a new random key each time the app starts

USERS = {"sam": "test-pass-1"}  # for this demo only: a real app uses a database


@app.get("/count")
def count():
    visits = int(request.cookies.get("visits", "0")) + 1
    response = make_response(f"You have been here {visits} times.\n")
    response.set_cookie("visits", str(visits), max_age=3600)
    return response


@app.post("/login")
def login():
    name = request.form.get("username", "")
    password = request.form.get("password", "")
    if name in USERS and USERS[name] == password:
        session["user"] = name
        return "Logged in.\n"
    return "Wrong name or password.\n", 401


@app.get("/me")
def me():
    user = session.get("user")
    if user is None:
        return "Not logged in.\n", 401
    return f"You are {user}.\n"


@app.post("/logout")
def logout():
    session.clear()
    return "Logged out.\n"
```

The `/count` route reads the cookie `visits` from the request, adds one, and sends the new number back in a `Set-Cookie` header. `make_response` builds the response first, so that `set_cookie` can add the header to it. The other routes come in step 4.

```bash
flask --app remember run --port 5000 > flask.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

### 2. Watch the cookie go back and forth

```bash
curl -s http://127.0.0.1:5000/count
curl -s http://127.0.0.1:5000/count
```

```output
You have been here 1 times.
You have been here 1 times.
```

curl forgets everything between commands, so the server sees a new visitor each time. This is what "stateless" means. A browser keeps the cookies it gets in a **cookie jar**, and curl can do the same in a file:

```bash
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count
```

```output
You have been here 1 times.
You have been here 2 times.
You have been here 3 times.
```

`-c jar.txt` saves the cookies of each response in the file, and `-b jar.txt` sends them back with the next request, as a browser does. Look at the headers themselves:

<!-- lab: nocheck -->
```bash
curl -s -i -b "visits=3" http://127.0.0.1:5000/count | grep -i cookie
```

```output
Set-Cookie: visits=4; Expires=Sat, 21 Nov 2026 22:02:51 GMT; Max-Age=3600; Path=/
```

`-b "visits=3"` sends a `Cookie: visits=3` header, and the server answers with `Set-Cookie: visits=4`, valid for an hour. Your date will differ.

### 3. Lie to the server

That `-b "visits=3"` was a lie, and the server believed it. Lie a little more:

```bash
curl -s -b "visits=1000" http://127.0.0.1:5000/count
curl -s -o /dev/null -w "%{http_code}\n" -b "visits=hello" http://127.0.0.1:5000/count
```

```output
You have been here 1001 times.
500
```

The cookie lives on the client, so the client can set it to anything. The first request made the counter jump. The second sent a value that `int()` cannot read, and the server crashed with **500 Internal Server Error**. A visit counter does not matter, but imagine a cookie `role=user` that the user can change to `role=admin`. A plain cookie is input from the user, exactly like a form field: check it, and never let it decide who someone is.

### 4. Log in with a signed session

```bash
curl -s -c jar.txt -b jar.txt -d "username=sam&password=wrong" http://127.0.0.1:5000/login
curl -s -c jar.txt -b jar.txt -d "username=sam&password=test-pass-1" http://127.0.0.1:5000/login
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/me
```

```output
Wrong name or password.
Logged in.
You are sam.
```

`-d` sends the fields as a form would, with `method="post"`: the same `name=value&name=value` text as the query string in lesson 8.1, but in the body of the request instead of the URL. `request.form` reads them. On success, `login` writes `session["user"] = "sam"`. Flask's `session` works like a dictionary, and at the end of the request Flask puts its content into a cookie called `session`, signed with `app.secret_key`. The `/me` request carried that cookie, and Flask read the user back from it.

### 5. Read the session cookie

```bash
cookie=$(grep session jar.txt | cut -f 7)
echo "$cookie" | cut -d . -f 1
```

```output
eyJ1c2VyIjoic2FtIn0
```

A cookie jar file has one line per cookie, with the value in the seventh column, so `cut -f 7` takes it out. The value has three parts separated by dots: the data, the time it was signed, and the signature. The first part looks like noise, but it is only **Base64**, a way to write any bytes with letters and digits:

```bash
python3 -c "import base64; print(base64.urlsafe_b64decode('eyJ1c2VyIjoic2FtIn0=').decode())"
```

```output
{"user":"sam"}
```

The data is plain JSON that anyone holding the cookie can read. (The `=` at the end restores padding that Flask removes; Module 10 explains Base64 properly.) So a Flask session can say who you are, but it must never hold a secret, such as a password.

### 6. Try to forge it

Base64 of `{"user":"alex"}` is `eyJ1c2VyIjoiYWxleCJ9`. Put it in place of the first part, keep the rest, and send it:

```bash
forged="eyJ1c2VyIjoiYWxleCJ9.$(echo "$cookie" | cut -d . -f 2-)"
curl -s -b "session=$forged" http://127.0.0.1:5000/me
```

```output
Not logged in.
```

The signature was made for `{"user":"sam"}`. It does not match the changed data, so Flask threw the whole session away. To make a valid signature for alex you need the secret key, and only the server has it. That is why the key must stay secret: anyone who has it can sign a session for any user.

### 7. Log out, and keep a copy

```bash
old="$cookie"
curl -s -c jar.txt -b jar.txt -X POST http://127.0.0.1:5000/logout
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/me
curl -s -b "session=$old" http://127.0.0.1:5000/me
```

```output
Logged out.
Not logged in.
You are sam.
```

`session.clear()` emptied the session, and Flask told the browser to delete the cookie. So the jar no longer logs you in. But look at the last line: a copy of the old cookie still works. The server keeps no list of sessions, so it cannot tell that this one was ended; it only checks the signature, which is still valid. With a signed cookie, a stolen copy works until it expires, or until the secret key changes. Stop the server and start it again, and this demo app gets a new random key, so every old cookie stops working at once.

### 8. Look at the cookie's settings

<!-- lab: nocheck -->
```bash
curl -s -i -d "username=sam&password=test-pass-1" http://127.0.0.1:5000/login | grep -i set-cookie
pkill -f "flask --app"
```

```output
Set-Cookie: session=eyJ1c2VyIjoic2FtIn0.aT_gew.3r9vdq3h_yAN6UXyqufu1n3o6-g; HttpOnly; Path=/
```

Flask sets `HttpOnly` on its session cookie by default, so a script in the page cannot read it: an attacker who manages to run JavaScript in your page, which is cross-site scripting, still cannot copy the cookie out. The value on your screen is different on each run, because of the time and the random key.

In a real app you add two more settings, before the first route:

```python
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # not sent with most requests that other sites start
app.config["SESSION_COOKIE_SECURE"] = True     # sent only over HTTPS
```

`SameSite=Lax` makes it harder for another site to send requests that carry your user's cookie. `Secure` keeps the cookie off plain HTTP, where anyone on the network could read it, as lesson 6.5 showed. Leave `Secure` out while you test on `http://127.0.0.1`, because the site has no HTTPS there.

In the browser, the developer tools show the cookies of a site: in the **Application** tab under "Cookies" in Chrome and Edge, or the **Storage** tab in Firefox. Each cookie is listed with its value and its attributes.

:::caution[A session cookie is a password]
Never paste a session cookie into a chat, a bug report or a screenshot. Whoever has it is logged in as you, without your password, until the session ends. Stealing it is called session hijacking.
:::

## Exercise

The visit counter can be faked because it is a plain cookie. Make it safe: add a route `/count2` that keeps the number in the session instead, with `session["visits"]`. Restart the server, count three visits with a cookie jar, then check that `-b "visits=1000"` has no effect on it.

<details>
<summary>Show the solution</summary>

Add this route to `remember.py`:

```python
@app.get("/count2")
def count2():
    session["visits"] = session.get("visits", 0) + 1
    return f"You have been here {session['visits']} times.\n"
```

<!-- lab: run
cd ~/web/session
cat >> remember.py <<'EOF'


@app.get("/count2")
def count2():
    session["visits"] = session.get("visits", 0) + 1
    return f"You have been here {session['visits']} times.\n"
EOF
-->

```bash
flask --app remember run --port 5000 > flask.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count2
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count2
curl -s -c jar.txt -b jar.txt http://127.0.0.1:5000/count2
curl -s -b "visits=1000" http://127.0.0.1:5000/count2
```

```output
You have been here 1 times.
You have been here 2 times.
You have been here 3 times.
You have been here 1 times.
```

The number now lives inside the signed session cookie, so the plain `visits` cookie means nothing to this route, and the last request, without the jar, starts at 1. The user can still delete the session cookie to start again, but cannot set it to 1000.

```bash
pkill -f "flask --app"
deactivate
```

</details>

## Check yourself

**1. HTTP is stateless. How does a site still know that two requests come from the same browser?**

<details>
<summary>Answer</summary>

The server sends a cookie with `Set-Cookie` in a response, and the browser sends it back in a `Cookie` header with every later request to that site. The server recognises the value.

</details>

**2. A Flask session cookie holds `{"user":"sam"}` in Base64. Can the user read it? Can the user change it to `alex`?**

<details>
<summary>Answer</summary>

They can read it, because Base64 is not encryption. They cannot change it: the signature no longer matches, and Flask ignores the session. Only someone with the secret key can sign new data.

</details>

**3. What does the `HttpOnly` attribute protect against?**

<details>
<summary>Answer</summary>

It stops scripts in the page from reading the cookie. If an attacker manages to run JavaScript in the page, they still cannot copy the session cookie and send it away.

</details>

**4. In step 7, why did the old cookie still work after logout?**

<details>
<summary>Answer</summary>

Flask's session lives in the signed cookie, not on the server. Logout told the browser to delete its cookie, but the server keeps no record that the session ended, so a copy with a valid signature is still accepted until it expires or the secret key changes.

</details>

**5. What happens if the secret key of a Flask app is published on GitHub?**

<details>
<summary>Answer</summary>

Anyone can sign a session cookie with any content, for example `{"user":"admin"}`, and the app accepts it. The key must be replaced at once, which also logs out every user.

</details>

## Common mistakes

- **Trusting a plain cookie.** A value such as `role=admin` or `user_id=5` in a plain cookie can be changed by anyone. Keep facts about the user in a signed session, or on the server.
- **Putting secrets in the session.** A Flask session can be read by its owner and by anyone who steals it. Store an id or a name, never a password.
- **A secret key in the code.** `app.secret_key = "dev"` committed to a public repository lets anyone forge sessions. Lesson 8.8 keeps the key in a file that git ignores.
- **Forgetting `-c` and `-b` with curl.** Without a jar, every curl command is a new visitor, and a login seems not to work.
- **Thinking logout ends a stolen session.** With signed cookies it does not. Keep sessions short, and change the key if a cookie may have leaked.

## Key terms

- **Cookie**: a small name and value that a server asks the browser to store and send back with every request to that site.
- **Session**: the time a server recognises one visitor across many requests, and the data it keeps for them.
- **Session id**: a long random value in a cookie that points to session data kept on the server.
- **Signature (cookie)**: a code computed from a cookie's data and a secret key, which shows that the data was not changed.
- **Secret key**: a random value known only to the server, used to sign session cookies.
- **Cookie jar**: the place where a browser, or curl with `-c`, stores the cookies it has received.
- **Cookie attribute**: an extra setting after a cookie's value, such as `HttpOnly`, `Secure`, `SameSite` or `Max-Age`.
- **Session hijacking**: using a stolen session cookie to act as its owner.

## Go further

- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies): how cookies work, with every attribute explained.
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): how to protect sessions in a real application.
- [Flask: Sessions](https://flask.palletsprojects.com/en/stable/quickstart/#sessions): Flask's own short explanation of its signed sessions.
