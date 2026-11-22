---
title: "Cheat sheet: Web flaws and their fixes"
description: The web flaws of Module 12 on one printable page, with the OWASP Top 10 categories, the fix for each flaw, the curl and grep commands for testing, and the Juice Shop commands.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

Only test systems you own or have written permission to test: your own apps on `127.0.0.1`, Juice Shop on your machine, and PortSwigger's labs.

## OWASP Top 10:2025

| ID | Category | In plain English |
|---|---|---|
| A01 | Broken Access Control | Users reach data or functions that are not theirs |
| A02 | Security Misconfiguration | A setting is unsafe, missing or left at its default |
| A03 | Software Supply Chain Failures | Something you depend on is flawed or tampered with |
| A04 | Cryptographic Failures | No encryption, weak algorithms, plain passwords |
| A05 | Injection | User input read as code: SQL, HTML (XSS), shell |
| A06 | Insecure Design | The plan itself has no defense |
| A07 | Authentication Failures | Logins can be guessed, skipped or faked |
| A08 | Software or Data Integrity Failures | Code or data trusted without checking it |
| A09 | Security Logging and Alerting Failures | Attacks happen and nobody notices |
| A10 | Mishandling of Exceptional Conditions | Errors handled badly: they leak or break things |

A finding: category, what, where, how to see it again. `A01 Broken Access Control: any user can read any order (/orders/2 as sam)`

## Flaws and fixes

| Flaw | Warning sign | Fix |
|---|---|---|
| SQL injection | `f"SELECT ... '{word}'"`; a quote gives an error or 500 | Placeholders: `con.execute("... WHERE user_id = ? AND title LIKE ?", (user_id, f"%{word}%"))` |
| Column or table name from input | A placeholder cannot hold it | Check it against an allowlist |
| Command injection | `subprocess.run(f"wc -l {name}", shell=True)` | A list, no shell: `subprocess.run(["wc", "-l", name])` |
| Stored or reflected XSS | HTML built in f-strings; `\|safe` on user text | Escape on the way out: Jinja `{{ ... }}`, or `markupsafe.escape(text)` |
| DOM-based XSS | `element.innerHTML = ...` with user text | `textContent` |
| IDOR (horizontal) | An object found by the id in the URL alone | Filter by owner: `WHERE id = ? AND user_id = ?`, answer 404 |
| Admin page for everyone (vertical) | Only "is logged in" is checked | Check the role, answer 403 |
| User taken from the request | `request.args.get("user")` | Take it from the signed session: `session["name"]` |
| Debug mode | `app.run(debug=True)`; error pages with code | Debug off; details go to the log only |
| Files served by accident | A directory listing; `/.env` answers | Serve only the public folder: `--directory public` |
| Default password | `admin` / `admin` still works | Change every default at setup |

Rules: deny by default; check on the server, on every request; store text as typed and escape it when it goes into a page.

## Security headers (as in mylab)

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `same-origin` |

```python
@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response
```

`white-space: pre-line` in CSS shows line breaks without HTML.

## Testing from the outside

| Command | What it does |
|---|---|
| `curl -s -H "X-User: sam" URL` | Add a header |
| `curl -s -c jar.txt -d "name=alex" URL/login` | Log in, save the cookie |
| `curl -s -b jar.txt URL` | Send the saved cookie |
| `curl -s --data-urlencode "text=<b>x</b>" URL` | POST a value with special characters |
| `curl -s --get --data-urlencode "q=x' OR 1=1 --" URL` | Put an encoded value in the URL |
| `curl -s -d @login.json -H "Content-Type: application/json" URL` | Send a file as a JSON body |
| `curl -s -o /dev/null -w "%{http_code}\n" URL` | Status code only |
| `curl -s -o /dev/null -D - URL` | Headers only, of a GET |
| `curl -sI URL` | Headers only, of a HEAD request |

| Code | Meaning here |
|---|---|
| 401 | Not logged in |
| 403 | Logged in, not allowed (when the page's existence is no secret) |
| 404 | Not found, or not yours |
| 500 | The server failed: often an unhandled case, sometimes injection |

## Reviewing code

| Command | Finds |
|---|---|
| `grep -n -E 'f"(SELECT\|INSERT\|UPDATE\|DELETE)' app/db.py` | SQL built with f-strings |
| `grep -rn "safe" app/templates` | Escaping switched off |
| `pytest -q --tb=no -rf tests/test_security.py` | One line per failed test |

Order of work: reproduce, write a test that fails, fix, watch it pass. Test the allowed case too.

## Juice Shop

| Command | What it does |
|---|---|
| `sudo apt-get install -y docker.io` | Install Docker |
| `sudo docker pull -q bkimminich/juice-shop` | Download the image |
| `sudo docker run -d --name juice-shop -p 127.0.0.1:3000:3000 bkimminich/juice-shop` | Start it, reachable only from your machine |
| `sudo docker rm -f juice-shop` | Stop and delete it (the image stays) |

Score board: `http://127.0.0.1:3000/#/score-board`. One challenge: `curl -s "http://127.0.0.1:3000/api/Challenges/?key=loginAdminChallenge"`.
