---
title: HTTP and HTTPS
description: Read HTTP requests and responses line by line, with their methods, status codes and headers, send them yourself with curl, and understand what HTTPS adds.
lesson: "6.5"
time: 25 min
sidebar:
  order: 5
---

Here is a complete conversation between a browser and a web server: "GET /index.html", then "200 OK, here it is". That is nearly all there is. The web runs on short text messages that you can read with your own eyes and even type by hand, and in this lesson you do both.

## Goal

After this lesson you can:

- Read an HTTP request and an HTTP response, line by line.
- Say what the common methods, status codes and headers mean.
- Explain what HTTPS adds to HTTP.

## Why it matters

Websites, mobile apps, cloud services and most programming interfaces all speak HTTP. When something fails, the status code and the headers usually say why, if you know how to read them. Web security is built on the same knowledge: almost every web attack in Module 12 is a request that says something the developer did not expect. The next modules also build your own web app, and it will speak this protocol.

## The idea

**HTTP** (HyperText Transfer Protocol) is an application layer protocol with one simple rule: the **client** sends a **request**, and the **server** sends back one **response**. The server never speaks first.

Think of a counter with a strict order form. You hand over a form that says what you want and adds a few notes. The clerk hands back a slip with a result code, a few notes, and the item itself. The clerk does not remember you: the next form is handled as if you had never been there. HTTP works the same way, and "does not remember you" has a name: HTTP is **stateless**.

### The address

A web address is called a **URL**. It contains everything the lower layers need:

```text
http://127.0.0.1:8000/docs/index.html
 |        |       |        |
scheme   host    port     path
```

The scheme says which protocol to speak. The host is a name or an IP address. The port can be left out: then it is 80 for `http` and 443 for `https`. The path says which thing you want from that server.

### The request

```text
GET /docs/index.html HTTP/1.1
Host: 127.0.0.1:8000
User-Agent: curl/8.5.0
Accept: */*

```

The first line is the request line: a **method**, a path and the protocol version. Then come the **headers**, one per line, in the form `Name: value`. An empty line ends the headers. After it there can be a body, for example the content of a form.

| Method | Meaning |
|---|---|
| GET | Give me this thing. Changes nothing on the server |
| HEAD | Like GET, but send only the headers, not the thing itself |
| POST | Here is some data, process it. Used by forms and logins |
| PUT | Store this at exactly this path, replacing what is there |
| DELETE | Remove this thing |

### The response

```text
HTTP/1.0 200 OK
Content-type: text/html
Content-Length: 107

<!DOCTYPE html>
...
```

The first line is the status line, with the **status code**. Then headers, an empty line, and the body: the page, the image, the data.

The first digit of the code tells you who has to act:

| Codes | Meaning | Ones you will meet |
|---|---|---|
| 2xx | It worked | 200 OK, 201 Created |
| 3xx | Look somewhere else | 301 Moved Permanently, 302 Found |
| 4xx | The client made a mistake | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| 5xx | The server failed | 500 Internal Server Error, 503 Service Unavailable |

A few headers come up all the time:

| Header | Sent by | Meaning |
|---|---|---|
| `Host` | Client | Which site you want. One server can host many sites |
| `User-Agent` | Client | Which program is asking |
| `Content-Type` | Both | What kind of data the body is, such as `text/html` |
| `Content-Length` | Both | The size of the body in bytes |
| `Location` | Server | Where to go instead, in a 3xx response |

### HTTPS

HTTP is sent as plain text. Every device between you and the server can read it and change it. **HTTPS** is the same HTTP, sent through an encrypted connection made with a protocol called **TLS**. The requests and responses stay exactly as described above. Three things are added: nobody on the way can read the conversation, nobody can change it without being noticed, and the server proves its identity with a certificate. HTTPS uses port 443. Module 10 explains how TLS does this.

## Try it

You will build a two-page site, serve it, and talk to it. Dates and server versions in the outputs will differ on your machine.

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
-->

### 1. Make a small site and serve it

```bash
mkdir ~/netlab
cd ~/netlab
```

```html title="site/index.html"
<!DOCTYPE html>
<html lang="en">
<head><title>Netlab</title></head>
<body><h1>It works</h1></body>
</html>
```

```html title="site/docs/index.html"
<p>The docs live here.</p>
```

```bash
python3 -m http.server 8000 --directory site > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

Save the two files inside a new folder `site`, the second one in `site/docs`. `--directory site` tells Python's web server to hand out the files of that folder. Its messages go to `server.log`, and `&` runs it in the background.

### 2. Send a GET request

```bash
curl http://127.0.0.1:8000/
```

```output
<!DOCTYPE html>
<html lang="en">
<head><title>Netlab</title></head>
<body><h1>It works</h1></body>
</html>
```

By default `curl` sends a GET request and prints only the body of the response. The path `/` means "the top of the site", and this server answers it with `index.html`.

### 3. Look at the whole response

<!-- lab: nocheck -->
```bash
curl -i http://127.0.0.1:8000/
```

```output
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 18:52:12 GMT
Content-type: text/html
Content-Length: 107
Last-Modified: Sat, 21 Nov 2026 18:52:06 GMT

<!DOCTYPE html>
<html lang="en">
<head><title>Netlab</title></head>
<body><h1>It works</h1></body>
</html>
```

`-i` includes the status line and the headers. You can see every part from "The idea": the status line with code 200, the headers, the empty line, the body. `Content-Length: 107` is the exact size of `index.html` in bytes. The `HTTP/1.0` at the start is just the older protocol version that this simple server answers with.

### 4. Write a request by hand

<!-- lab: nocheck -->
```bash
printf 'GET / HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n' | nc 127.0.0.1 8000
```

```output
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 18:52:12 GMT
Content-type: text/html
Content-Length: 107
Last-Modified: Sat, 21 Nov 2026 18:52:06 GMT

<!DOCTYPE html>
<html lang="en">
<head><title>Netlab</title></head>
<body><h1>It works</h1></body>
</html>
```

No web client this time: `nc` opened a plain TCP connection, as in lesson 6.3, and `printf` typed the request. Each line of a request ends with `\r\n`, and the empty line that ends the headers is the final `\r\n`. The server cannot tell the difference between this and curl. HTTP really is just text sent over TCP.

### 5. Collect status codes

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/missing.html
```

```output
200
404
```

`-s -o /dev/null` hides the body, and `-w "%{http_code}\n"` prints only the status code. The first request worked. The second asked for a file that is not there: a 4xx code, so the mistake is on the client's side.

### 6. Follow a redirect

<!-- lab: nocheck -->
```bash
curl -i http://127.0.0.1:8000/docs
```

```output
HTTP/1.0 301 Moved Permanently
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 18:52:13 GMT
Location: /docs/
Content-Length: 0

```

`docs` is a folder, and this server wants folder addresses to end with a slash. It answers with a 3xx code and a `Location` header that says where to go. curl stops there unless you add `-L`, which means "follow redirects":

```bash
curl -L http://127.0.0.1:8000/docs
```

```output
<p>The docs live here.</p>
```

That was two requests: one for `/docs`, answered with 301, and a second for `/docs/`, answered with 200. A browser does the same without telling you.

### 7. Try other methods

<!-- lab: nocheck -->
```bash
curl -I http://127.0.0.1:8000/
```

```output
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 18:52:14 GMT
Content-type: text/html
Content-Length: 107
Last-Modified: Sat, 21 Nov 2026 18:52:06 GMT

```

`-I` sends a HEAD request. The response has the same headers as for GET, and no body. It is a cheap way to check that a page exists.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -d "name=sam" http://127.0.0.1:8000/
```

```output
501
```

`-d` sends data in the body of the request, which turns it into a POST. The answer is 501, "Not Implemented": a 5xx code, so the limit is on the server's side. This small server can only hand out files. It does not know what to do with a POST.

### 8. Read the server's log

<!-- lab: nocheck -->
```bash
tail -n 4 server.log
```

```output
127.0.0.1 - - [21/Nov/2026 18:52:14] "GET /docs/ HTTP/1.0" 200 -
127.0.0.1 - - [21/Nov/2026 18:52:14] "HEAD / HTTP/1.1" 200 -
127.0.0.1 - - [21/Nov/2026 18:52:15] code 501, message Unsupported method ('POST')
127.0.0.1 - - [21/Nov/2026 18:52:15] "POST / HTTP/1.1" 501 -
```

The server wrote down every request: the client's address, the time, the request line, and the status code it answered. Reading logs like this one is a daily task in security work, and the log analyzer you wrote in Module 3 does the same kind of job.

### 9. Try HTTPS on a server that only speaks HTTP

```bash
curl -I https://127.0.0.1:8000/
```

```output
curl: (35) OpenSSL/3.0.13: error:0A00010B:SSL routines::wrong version number
```

With `https://`, curl starts with the TLS setup to build the encrypted connection. This server knows nothing about TLS and answered in plain HTTP, so curl gave up. HTTPS is not a setting inside HTTP. It is a different first step, and both sides have to do it.

Against a real HTTPS site the same command works:

<!-- lab: skip -->
```bash
curl -I https://example.com
```

You get a status line and headers, as in step 7. The status line may start with `HTTP/2`, a newer version of the protocol that big sites use: the methods, status codes and headers mean the same. They travelled encrypted, and curl checked the site's certificate before it sent anything.

### 10. Stop the server

```bash
pkill -f http.server
```

:::note[What curl does not do]
A browser sends many more headers than curl and then requests every image, style sheet and script that the page mentions. One page view is often dozens of requests. curl sends exactly one, which is what makes it good for learning and testing.
:::

## Exercise

1. Add a page `site/about.html` with one line of HTML in it. Start the server again and request the page, printing only the status code.
2. Show only the response headers of `/about.html` that contain the word `content`. Then check that `Content-Length` matches the real size of the file. `wc -c < file` prints the size of a file in bytes.
3. What status code do you get for `/docs/`, with the slash? Why is it not the same as for `/docs`?

<details>
<summary>Show the solution</summary>

```bash
cd ~/netlab
echo "<p>About this site.</p>" > site/about.html
python3 -m http.server 8000 --directory site > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/about.html
```

```output
200
```

```bash
curl -s -I http://127.0.0.1:8000/about.html | grep -i content
wc -c < site/about.html
```

```output
Content-type: text/html
Content-Length: 24
24
```

`grep -i` ignores the difference between capital and small letters. The header and `wc` agree: the file is 24 bytes long, 23 characters plus the line break that `echo` adds.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/docs/
pkill -f http.server
```

```output
200
```

`/docs/` is the correct address of the folder, so the server answers 200 directly. `/docs` without the slash gets a 301 that points to `/docs/`.

</details>

## Check yourself

**1. What are the three parts of an HTTP response?**

<details>
<summary>Answer</summary>

The status line with the status code, the headers, and after an empty line the body.

</details>

**2. You get a 404. Who made the mistake, and what about a 503?**

<details>
<summary>Answer</summary>

404 is a 4xx code: the client asked for something that does not exist, so check the address. 503 is a 5xx code: the request was fine and the server failed to handle it.

</details>

**3. What is the difference between GET and POST?**

<details>
<summary>Answer</summary>

GET asks for something and changes nothing on the server. POST sends data in the body of the request for the server to process, as a form or a login does.

</details>

**4. What does "HTTP is stateless" mean?**

<details>
<summary>Answer</summary>

The server handles every request on its own and does not remember earlier requests from the same client.

</details>

**5. What does HTTPS add to HTTP, and what stays the same?**

<details>
<summary>Answer</summary>

It sends HTTP through a connection encrypted with TLS. Nobody on the way can read or change the traffic, and the server proves its identity with a certificate. The requests and responses themselves, with their methods, status codes and headers, stay the same.

</details>

## Common mistakes

- **Reading only the body.** `curl` hides the status line by default, so an error page can look like success. Add `-i`, or print the code with `-w "%{http_code}\n"`.
- **Forgetting that curl does not follow redirects.** An empty answer with a 301 or 302 is not a failure. Add `-L`.
- **Treating every error as the server's fault.** Look at the first digit. A 4xx means: fix your request. A 5xx means: the server has a problem.
- **Typing `https://` for a server that only speaks HTTP, or the reverse.** In the first case curl reports an SSL error such as `wrong version number`. In the second, the server usually answers with an error or closes the connection. Check the scheme and the port.
- **Thinking HTTPS means the site is trustworthy.** It means the connection is private and you reached the server named in the address. It says nothing about the honesty of the people who run it.

## Key terms

- **HTTP**: the application layer protocol of the web, made of requests and responses in text form.
- **Client**: the program that sends the request, such as a browser or curl.
- **Server**: the program that receives requests and sends responses.
- **Request**: the message a client sends: a request line, headers, and sometimes a body.
- **Response**: the message a server sends back: a status line, headers, and usually a body.
- **URL**: a web address, made of a scheme, a host, an optional port and a path.
- **Method**: the first word of a request, which says what to do: GET, HEAD, POST, PUT or DELETE.
- **Status code**: the three-digit number in a response that says how the request went.
- **Stateless**: said of a protocol in which the server does not remember earlier requests.
- **HTTPS**: HTTP sent through a connection encrypted with TLS, on port 443 by default.
- **TLS**: the protocol that encrypts a connection and proves the identity of the server.

## Go further

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP): the best free reference for methods, status codes and every header.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110): the official definition. Section 15 lists all status codes.
- [Everything curl](https://everything.curl.dev/): the free book by the authors of curl, with every option explained.
