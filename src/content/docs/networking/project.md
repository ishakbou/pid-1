---
title: "Project step: a tiny web server in mylab"
description: Write app/server.py, a small web server made only from the Python standard library, serve a page from mylab with it, and read each request as it arrives.
lesson: "6.9"
time: 25 min
sidebar:
  order: 9
---

About sixty lines of Python: that is all a web server of your own takes. Every server in this module so far was someone else's, either Python's ready-made file server or `nc` listening on a port. The one you write today uses nothing but the Python standard library, and it becomes the first piece of the `mylab` web app that the next two modules grow.

## Goal

After this lesson you can:

- Write a small HTTP server in Python that answers different paths with different status codes.
- Run it, check its socket with `ss`, and talk to it with `curl`.
- Read your server's own log line for each request, and commit the server to `mylab`.

## Why it matters

Every web framework, including the Flask app you build in Module 8, does what this file does: listen on a port, read a request, choose an answer, write a response. Seeing it without any framework in the way makes the rest much less magic. It is also the first program in `mylab` that other programs can talk to, which is exactly what attackers look for. From here on, you are the person who decides what your server accepts and what it tells the world.

## The idea

Python's standard library includes the module `http.server`. It already knows how to accept TCP connections and how to read HTTP requests. You only write a **request handler**: a class with a method per HTTP method. When a GET request arrives, the library calls your `do_GET` method, and that method decides what to send back.

Think of a small shop where the building, the door and the till are already there. You only write the shop assistant's instructions: "if someone asks for this, give them that; if we do not have it, say so politely".

The server you write today does three things:

| Path | Status | Body |
|---|---|---|
| `/` | `200 OK` | A small HTML page |
| `/health` | `200 OK` | The text `ok` |
| anything else | `404 Not Found` | The text `not found` |

A `/health` path, called a **health check**, is a common convention: a monitoring tool can ask for it every few seconds, and `ok` means the server is alive.

Two decisions from this module are built in. The server listens on `127.0.0.1` only, so no other machine can reach it (lesson 6.7). And it writes one log line per request, with the client's address and ephemeral port, so you can watch requests arrive as you did with the capture in lesson 6.8.

`mylab` after this step:

```text
mylab/
    app/
        server.py      new: the web server
    logs/
        server.log     new: written by the server, ignored by git
    .gitignore         one new line
    ...                everything from earlier modules
```

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f app/server.py
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.venv/\n__pycache__/\n' > .gitignore
git init -q
git add README.md .gitignore
git commit -q -m "Start mylab"
cd ~
-->

This step continues the `mylab` folder from the earlier modules: it should be a git repository with a `logs/` folder. If you are missing parts, the [Module 1 project step](../linux/project/) and the [Module 2 project step](../git/project/) build them.

### 1. Make the app folder

```bash
cd ~/mylab
mkdir -p app logs
```

Everything that belongs to the web app goes into `app/`. The server writes its log into `logs/`. You made that folder in Module 1, but git does not keep empty folders, so a fresh copy of the repository may not have it. `-p` creates what is missing and says nothing about what already exists. Module 7 adds a database next to the server, and Module 8 adds a Flask app in the same folder.

### 2. Write the server

Create `app/server.py` in your editor with this content:

```python title="app/server.py"
"""A tiny web server for mylab, made only from the Python standard library.

Run it from the mylab folder:  python3 app/server.py [port]
"""
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "127.0.0.1"  # loopback only: no other machine can connect
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

PAGE = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>mylab</title></head>
<body>
<h1>mylab</h1>
<p>This page was served by app/server.py.</p>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def route(self):
        """Return the status code, content type and text for the requested path."""
        if self.path == "/":
            return 200, "text/html; charset=utf-8", PAGE
        if self.path == "/health":
            return 200, "text/plain; charset=utf-8", "ok\n"
        return 404, "text/plain; charset=utf-8", "not found\n"

    def do_GET(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        """Print one line per request: when, who, what, and the answer."""
        host, port = self.client_address
        headers = getattr(self, "headers", None)
        agent = headers.get("User-Agent", "-") if headers else "-"
        print(f"{self.log_date_time_string()} {host}:{port} {format % args} {agent}", flush=True)


def main():
    server = HTTPServer((HOST, PORT), Handler)
    print(f"mylab server on http://{HOST}:{PORT}/  (press Ctrl+C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
```

Read it from the bottom up:

- `main()` creates an `HTTPServer` on `127.0.0.1` and the chosen port, and hands it your `Handler` class. `serve_forever()` then waits for connections, one after the other. Ctrl+C stops it cleanly.
- `route()` holds the table from "The idea". It looks at `self.path`, the path from the request line, and returns three values.
- `do_GET()` turns the answer into a response: the status line with `send_response`, two headers, the empty line that `end_headers` writes, and the body. The body is encoded to bytes first, because `Content-Length` counts bytes, not characters.
- `log_message()` replaces the library's default log line with your own. The library calls it once for every response, from inside `send_response`, and also when it reports an error. `self.client_address` holds the client's IP address and port, and the `User-Agent` header says which program asked. A broken request may have no headers at all, and then `getattr(self, "headers", None)` gives `None` and the line shows `-` instead of crashing.

`PORT` comes from the first word after the script name, if there is one, so `python3 app/server.py 8001` starts the server on port 8001.

### 3. Start it

You could run the server in the foreground in a second terminal and watch its lines appear there. Here it runs in the background instead, and writes its lines into `logs/server.log`.

```bash
python3 app/server.py > logs/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
cat logs/server.log
```

```output
mylab server on http://127.0.0.1:8000/  (press Ctrl+C to stop)
```

The `flush=True` in each `print` makes Python write the line at once, instead of keeping it in memory until there is more to write.

<!-- lab: nocheck -->
```bash
ss -tlnp | grep 8000
```

```output
LISTEN 0      5          127.0.0.1:8000      0.0.0.0:*    users:(("python3",pid=4387,fd=3))
```

Your own program now owns a listening socket on `127.0.0.1:8000`.

### 4. Ask for the page

<!-- lab: nocheck -->
```bash
curl -i http://127.0.0.1:8000/
```

```output
HTTP/1.0 200 OK
Server: BaseHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 20:21:03 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 173

<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>mylab</title></head>
<body>
<h1>mylab</h1>
<p>This page was served by app/server.py.</p>
</body>
</html>
```

The status line, the headers and the body, as in lesson 6.5. `Server` and `Date` were added by `send_response`. `Content-Type` and `Content-Length` are the two headers your code sent. If you run Ubuntu directly on your computer, you can also open `http://127.0.0.1:8000/` in a browser.

### 5. Try the other paths

```bash
curl http://127.0.0.1:8000/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/admin
```

```output
ok
404
```

`/health` answers `ok`, and any unknown path gets a 404, just as the table said. Now send a HEAD request:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -I http://127.0.0.1:8000/
```

```output
501
```

`501 Not Implemented`: your handler has no `do_HEAD` method, so the library refuses. The exercise fixes that.

### 6. Watch the requests arrive

<!-- lab: nocheck -->
```bash
cat logs/server.log
```

```output
mylab server on http://127.0.0.1:8000/  (press Ctrl+C to stop)
21/Nov/2026 20:21:03 127.0.0.1:45790 "GET / HTTP/1.1" 200 - curl/8.5.0
21/Nov/2026 20:21:03 127.0.0.1:45792 "GET /health HTTP/1.1" 200 - curl/8.5.0
21/Nov/2026 20:21:03 127.0.0.1:45806 "GET /admin HTTP/1.1" 404 - curl/8.5.0
21/Nov/2026 20:21:03 127.0.0.1:45810 code 501, message Unsupported method ('HEAD') curl/8.5.0
21/Nov/2026 20:21:03 127.0.0.1:45810 "HEAD / HTTP/1.1" 501 - curl/8.5.0
```

One line per request: the time, the client's address and port, the request line, the status code, and the `User-Agent`. Every request came from a new ephemeral port, as in lesson 6.3. The HEAD request produced two lines: first the library's error message, `code 501`, then the normal line for the response. Both go through your `log_message`, which is why both end with the user agent.

The `User-Agent` is whatever the client chooses to send. Watch:

```bash
curl -s -A "definitely-a-browser" http://127.0.0.1:8000/health
```

```output
ok
```

<!-- lab: nocheck -->
```bash
tail -n 1 logs/server.log
```

```output
21/Nov/2026 20:21:04 127.0.0.1:45820 "GET /health HTTP/1.1" 200 - definitely-a-browser
```

`-A` sets the `User-Agent` header, and your server believed it. Everything in a request, every header and every path, is written by the client. A server can log it, but should never trust it. Module 12 comes back to this.

### 7. Start a second copy

```bash
python3 app/server.py 2>&1 | tail -n 1
```

```output
OSError: [Errno 98] Address already in use
```

The first server still owns port 8000, so the second one cannot listen there and stops with an error. `2>&1 | tail -n 1` keeps only the last line of the long error message. A different port works, because the port is part of the socket:

```bash
python3 app/server.py 8001 > /dev/null 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8001 ' && break; sleep 0.2; done
-->

```bash
curl http://127.0.0.1:8001/health
```

```output
ok
```

### 8. Stop the servers

```bash
pkill -f app/server.py
```

This stops both copies. When the server runs in the foreground, press Ctrl+C instead: it prints `stopped` and closes its socket.

### 9. Commit the server

```bash
git status --short
```

```output
?? app/
?? logs/
```

Git sees the new `app/` folder and the log file. A log is output, not source code, and it changes every time the server runs, so tell git to ignore it:

```bash
echo "logs/*.log" >> .gitignore
git status --short
```

```output
 M .gitignore
?? app/
```

The log file is gone from the list. Now commit the server and the new rule:

```bash
git add .gitignore app/server.py
git commit -q -m "Add a tiny web server"
git log --oneline -1 --format=%s
```

```output
Add a tiny web server
```

`-q` keeps `git commit` quiet, and `--format=%s` prints only the message of the last commit. The server is now part of `mylab`'s history.

## Exercise

Make `curl -I` work: add a `do_HEAD` method to the handler. It must send the same status line and headers as `do_GET`, but no body. Then restart the server, check that `curl -I` now gets `200`, and commit the change.

Hint: the library calls `do_HEAD` for HEAD requests, exactly as it calls `do_GET` for GET requests.

<details>
<summary>Show the solution</summary>

Add this method inside the `Handler` class, right after `do_GET`:

```python
    def do_HEAD(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/server.py"
code = open(path).read()
method = '''    def do_HEAD(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

'''
code = code.replace("    def log_message", method + "    def log_message", 1)
open(path, "w").write(code)
EOF
-->

It is `do_GET` without the last line. `Content-Length` still gives the size the body would have, which is what HEAD is for: the client learns about the page without downloading it.

```bash
python3 app/server.py > logs/server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null -w "%{http_code}\n" -I http://127.0.0.1:8000/
curl -s -o /dev/null -w "%{http_code}\n" -I http://127.0.0.1:8000/admin
```

```output
200
404
```

```bash
pkill -f app/server.py
git commit -q -am "Answer HEAD requests"
git log --oneline --format=%s
```

```output
Answer HEAD requests
Add a tiny web server
Start mylab
```

`git commit -a` adds every file that git already tracks and that has changed, here `app/server.py`. Your history shows more commits than this one, from the earlier modules.

The two methods now repeat five lines. A tidier version moves them into a helper method that both call. Try it if you like, and test again with `curl -i` and `curl -I`.

</details>

## Check yourself

**1. Who calls `do_GET`, and when?**

<details>
<summary>Answer</summary>

The `http.server` library calls it. When a request with the method GET arrives, the server creates a handler for that request and calls its `do_GET` method.

</details>

**2. Why does the server listen on `127.0.0.1` and not on `0.0.0.0`?**

<details>
<summary>Answer</summary>

`127.0.0.1` is the loopback address, so only programs on the same machine can connect. With `0.0.0.0` the server would listen on every address of the machine, and anyone on the network could reach it. A server that is still being built should stay private.

</details>

**3. Why is the body encoded with `text.encode("utf-8")` before `Content-Length` is computed?**

<details>
<summary>Answer</summary>

`Content-Length` is a number of bytes. In UTF-8 some characters take more than one byte, so the length of the text in characters can be smaller than the length of the body in bytes.

</details>

**4. Your log shows the user agent `definitely-a-browser`. Was the request really sent by a browser?**

<details>
<summary>Answer</summary>

You cannot tell. The `User-Agent` header is written by the client, and `curl -A` showed that any client can put anything there. Log it, but never trust it.

</details>

**5. `python3 app/server.py` stops with `Address already in use`. What do you check, and what are your two options?**

<details>
<summary>Answer</summary>

Check with `ss -tlnp` which process owns the port. Then stop that process, or start the server on another port, such as `python3 app/server.py 8001`.

</details>

## Common mistakes

- **Running the script from the wrong folder.** `python3 app/server.py` works from `~/mylab`. From somewhere else, Python answers `No such file or directory`. Run `pwd` first.
- **Forgetting the server is still running.** A background server keeps the port busy, and the next start fails with `Address already in use`. Stop it with `pkill -f app/server.py`.
- **Writing `Content-Length` from the length of the text.** For text with accents or other non-ASCII characters, the number is wrong and the client cuts the page off or waits for more. Measure the encoded bytes.
- **Changing `HOST` to `0.0.0.0` "to make it work".** That opens the server to the whole network. Keep `127.0.0.1` unless you have decided, with a reason, who else should reach it.
- **Committing the log file.** Logs change on every run and can hold addresses of your visitors. Keep `logs/*.log` in `.gitignore`.

## Key terms

- **Request handler**: the class that decides how a server answers each request. In `http.server`, a method such as `do_GET` handles one HTTP method.
- **Health check**: a path such as `/health` that a monitoring tool requests regularly to see whether a server is alive.
- **User-Agent**: the request header in which a client names the program that sends the request. The client chooses its value freely.

## Go further

- [Python documentation: http.server](https://docs.python.org/3/library/http.server.html): the module you used, with `BaseHTTPRequestHandler` and every method you can override. Read its security warning too.
- [MDN: HTTP messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages): the exact structure of the requests your server reads and the responses it writes.
- [MDN: User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent): what browsers put in this header, and why sites should not rely on it.
