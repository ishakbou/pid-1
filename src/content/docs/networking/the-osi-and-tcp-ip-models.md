---
title: The OSI and TCP/IP models
description: See how networking is split into layers, what each layer is responsible for, and how one web request travels down the layers on your computer and up again on the server.
lesson: "6.1"
time: 20 min
sidebar:
  order: 1
---

What happens between the moment you press Enter on a web address and the moment the page appears? Your request is wrapped in several envelopes, handed from machine to machine across networks owned by different companies, then unwrapped on the other side. No single program does all of that. The work is split into layers, and this lesson gives you the map of those layers.

## Goal

After this lesson you can:

- Name the four layers of the TCP/IP model and say what each one is responsible for.
- Match the seven OSI layers to the TCP/IP layers.
- Read an error message and say which layer the problem is on.

## Why it matters

Every other lesson in this module is about one layer: IP addresses, TCP and UDP, DNS, HTTP. Without the map you learn a pile of unrelated facts, and with it each new protocol has a place. The layers are also how people debug: "can you reach the machine?" and "does the program answer?" are questions about two different layers, and they have different tools. And in security, people describe attacks and defences by layer number all the time.

## The idea

A **protocol** is an agreed set of rules for a conversation between machines: who speaks first, what a message looks like, what to answer. Getting a web page needs several protocols at once, so they are stacked in **layers**. Each layer has one job. It uses the layer below it and does not care how that layer does its work.

Think of a letter sent between two companies. You write the letter. Your assistant numbers the pages and writes the name of the department it is for. The postal service looks only at the street address on the envelope and moves it from one sorting centre to the next. A van carries it for one leg of the trip. Each person reads only their own label, and nobody except the reader opens the letter.

Networks work the same way. The model used on the real internet is the **TCP/IP model**, with four layers:

| Layer | Its job | Examples | The address it uses |
|---|---|---|---|
| Application | What the two programs say to each other | HTTP, DNS, SSH | Names such as `example.com` |
| Transport | Deliver the data to the right program, in order | TCP, UDP | Port number |
| Internet | Get the data across networks to the right machine | IP | IP address |
| Link | Carry the data to the next device on the same network | Ethernet, Wi-Fi | MAC address |

In the letter story: the application layer is the letter, the transport layer is your assistant, the internet layer is the postal service, and the link layer is the van.

You will meet every name in the table later in this module. For now, two are enough: HTTP is the protocol of the web, and DNS is the service that turns a name such as `example.com` into an IP address.

### Down the stack, across, and up again

Say your browser asks a server for a page. The request goes down the layers on your computer, and each layer puts its own label in front of what it received from the layer above. That label is called a **header**, and the wrapping is called **encapsulation**.

```text
Application                                        GET /hello.txt
Transport                             [TCP header] GET /hello.txt
Internet                  [IP header] [TCP header] GET /hello.txt
Link    [Ethernet header] [IP header] [TCP header] GET /hello.txt
```

The TCP header holds the port numbers. The IP header holds the two IP addresses, yours and the server's. The Ethernet header holds the MAC address of the next device on the way. On the server, the same layers remove the headers in the opposite order, and the web server program receives exactly the text your browser wrote.

<figure class="diagram">
<svg viewBox="0 0 560 270" role="img" aria-labelledby="stack-title stack-desc">
<title id="stack-title">A request going down one stack and up another</title>
<desc id="stack-desc">Two columns of four boxes. The left column is your computer, the right column is the server. From top to bottom each column has the layers Application, Transport, Internet and Link. A highlighted path goes down the left column, across from the left Link box to the right Link box, and up the right column. Between the two columns, each pair of layers is joined by a line with the name of the protocol they share: HTTP, TCP, IP, and Ethernet or Wi-Fi at the bottom.</desc>
<path class="d-line" d="M200 50 H360 M200 110 H360 M200 170 H360"/>
<path class="d-line d-hot" d="M120 70 V90 M120 130 V150 M120 190 V210 M200 230 H360 M440 70 V90 M440 130 V150 M440 190 V210"/>
<rect class="d-box d-hot" x="40" y="30" width="160" height="40"/>
<rect class="d-box d-hot" x="40" y="90" width="160" height="40"/>
<rect class="d-box d-hot" x="40" y="150" width="160" height="40"/>
<rect class="d-box d-hot" x="40" y="210" width="160" height="40"/>
<rect class="d-box d-hot" x="360" y="30" width="160" height="40"/>
<rect class="d-box d-hot" x="360" y="90" width="160" height="40"/>
<rect class="d-box d-hot" x="360" y="150" width="160" height="40"/>
<rect class="d-box d-hot" x="360" y="210" width="160" height="40"/>
<text x="120" y="18">Your computer</text>
<text x="440" y="18">The server</text>
<text x="120" y="55">Application</text>
<text x="120" y="115">Transport</text>
<text x="120" y="175">Internet</text>
<text x="120" y="235">Link</text>
<text x="440" y="55">Application</text>
<text x="440" y="115">Transport</text>
<text x="440" y="175">Internet</text>
<text x="440" y="235">Link</text>
<text x="280" y="42">HTTP</text>
<text x="280" y="102">TCP</text>
<text x="280" y="162">IP</text>
<text x="280" y="222">Ethernet or Wi-Fi</text>
</svg>
<figcaption>The data really travels along the highlighted path. But each layer behaves as if it talked directly to the same layer on the other machine.</figcaption>
</figure>

The data has a different name at each layer. A link layer unit is a **frame**, an internet layer unit is a **packet**, and a TCP unit is a **segment**. In everyday speech people say "packet" for all three.

### The OSI model

The **OSI model** is an older reference model with seven layers. Almost no real system is built exactly like it, but its layer numbers became the common vocabulary. When someone says "a layer 3 problem", they mean OSI numbers.

| OSI layer | Name | TCP/IP layer |
|---|---|---|
| 7 | Application | Application |
| 6 | Presentation | Application |
| 5 | Session | Application |
| 4 | Transport | Transport |
| 3 | Network | Internet |
| 2 | Data link | Link |
| 1 | Physical | Link |

Three numbers are worth knowing by heart: layer 2 means MAC addresses, layer 3 means IP addresses, and layer 4 means ports. "Layer 7" means the application itself, for example HTTP.

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
-->

You will send one request to a small web server on your own machine and look at each layer. Your addresses and interface names will differ from the ones shown here.

### 1. Look at the link layer

<!-- lab: nocheck -->
```bash
ip -br link
```

```output
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp0s2           UP             52:54:00:12:34:56 <BROADCAST,MULTICAST,UP,LOWER_UP>
```

`ip` is the Linux tool for network settings, and `-br` means "brief". Each line is a **network interface**: a connection point between your machine and a network. The value made of six pairs of hexadecimal digits is the **MAC address**, the link layer address of that interface. `lo` is the **loopback** interface, a fake network that leads back to your own machine. It has no hardware, so its MAC address is all zeros.

### 2. Look at the internet layer

<!-- lab: nocheck -->
```bash
ip -br addr
```

```output
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s2           UP             10.0.2.15/24 metric 100 fec0::5054:ff:fe12:3456/64 fe80::5054:ff:fe12:3456/64
```

Same interfaces, one layer up: now you see IP addresses. `127.0.0.1` on the loopback interface is the address that always means "this machine". The next lesson explains how to read the rest.

### 3. Start a small web server

```bash
mkdir ~/netlab
cd ~/netlab
echo "hello from the application layer" > hello.txt
python3 -m http.server 8000 > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

Python comes with a web server that hands out the files of the current directory. The `8000` is the port it listens on. The `> server.log 2>&1` part sends everything the server prints into a file, and the final `&` runs it in the background, so you get your prompt back. The shell answers with a job number and a process ID, something like `[1] 4321`.

### 4. Send a request and watch the layers

<!-- lab: nocheck -->
```bash
curl -v http://127.0.0.1:8000/hello.txt
```

```output
*   Trying 127.0.0.1:8000...
* Connected to 127.0.0.1 (127.0.0.1) port 8000
> GET /hello.txt HTTP/1.1
> Host: 127.0.0.1:8000
> User-Agent: curl/8.5.0
> Accept: */*
> 
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Server: SimpleHTTP/0.6 Python/3.12.3
< Date: Sat, 21 Nov 2026 18:37:20 GMT
< Content-type: text/plain
< Content-Length: 33
< Last-Modified: Sat, 21 Nov 2026 18:37:18 GMT
< 
hello from the application layer
* Closing connection
```

`curl` is a web client for the terminal, and `-v` (verbose) makes it show its work. Read the output from the bottom layer up:

- `Trying 127.0.0.1:8000...`: the internet layer needs an IP address (`127.0.0.1`), and the transport layer needs a port (`8000`).
- `Connected to ... port 8000`: the transport layer, TCP here, has opened a connection to the program that listens on that port.
- The lines that start with `>` are what curl sent: the application layer, speaking HTTP.
- The lines that start with `<` are the server's answer, also HTTP. The last line before `Closing connection` is the content of the file.

You did not see the link layer: on the loopback interface there is no cable and no next device. Lesson 6.8 shows you the real headers of every layer.

### 5. Check that the request arrived

<!-- lab: nocheck -->
```bash
cat server.log
```

```output
127.0.0.1 - - [21/Nov/2026 18:37:20] "GET /hello.txt HTTP/1.1" 200 -
```

The server wrote one line for the request it received. On its side the request came up the stack: the internet layer accepted a packet for `127.0.0.1`, TCP handed the data to the program on port 8000, and that program read `GET /hello.txt`.

### 6. Break one layer at a time

Ask for a file that does not exist:

```bash
curl http://127.0.0.1:8000/nothing.txt
```

```output
<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Error response</title>
    </head>
    <body>
        <h1>Error response</h1>
        <p>Error code: 404</p>
        <p>Message: File not found.</p>
        <p>Error code explanation: 404 - Nothing matches the given URI.</p>
    </body>
</html>
```

This is an application layer problem. Everything below worked: the machine was reached, the connection was opened, and the server program answered. It just answered "I do not have that".

Now use a port where no program listens:

<!-- lab: nocheck -->
```bash
curl http://127.0.0.1:8001/hello.txt
```

```output
curl: (7) Failed to connect to 127.0.0.1 port 8001 after 1 ms: Couldn't connect to server
```

This is a transport layer problem. The machine exists and answered, but nothing is behind port 8001, so no connection could be opened. HTTP never got a chance to speak.

Last, use a name that does not exist:

```bash
curl http://no-such-machine.test:8000/hello.txt
```

```output
curl: (6) Could not resolve host: no-such-machine.test
```

The internet layer works with IP addresses, not names, so the name has to be turned into an address first. Here that lookup failed, and nothing was sent to any server. Lesson 6.4 shows how the lookup works.

### 7. Stop the server

```bash
pkill -f http.server
```

`pkill` stops processes by name. With `-f` it looks at the whole command line, so this stops the server you started in step 3. The next time you press Enter, the shell confirms it with a line that ends in `Terminated`. Always stop a test server when you are done, or the port stays busy.

## Exercise

1. Put each item on its TCP/IP layer: a MAC address, HTTP, port 443, an IP address, Wi-Fi, TCP, DNS, UDP.
2. A classmate shows you three error messages. For each one, say which layer you would check first:
   - `Could not resolve host: myserver.test`
   - `Failed to connect to 192.168.1.20 port 8080`
   - `404 Not Found`
3. Start the Python web server again in `~/netlab`, this time on port 9000. Request `server.log` itself with `curl -v`, find the line that proves the transport layer connected, then stop the server.

<details>
<summary>Show the solution</summary>

1. Application: HTTP, DNS. Transport: port 443, TCP, UDP. Internet: an IP address. Link: a MAC address, Wi-Fi.
2. `Could not resolve host`: the name lookup failed, so no packet was sent to the server yet. The lookup is done by DNS, an application layer service, so check the name and DNS first. `Failed to connect ... port 8080`: transport layer, check that a program listens on that port on that machine. `404 Not Found`: application layer, the server works and the path is wrong.
3. The commands:

   ```bash
   cd ~/netlab
   python3 -m http.server 9000 > server.log 2>&1 &
   ```

   <!-- lab: run
   for i in $(seq 100); do ss -ltn | grep -q ':9000 ' && break; sleep 0.2; done
   -->

   ```bash
   curl -v http://127.0.0.1:9000/server.log 2>&1 | grep Connected
   ```

   ```output
   * Connected to 127.0.0.1 (127.0.0.1) port 9000
   ```

   ```bash
   pkill -f http.server
   ```

   The `grep` is optional. It only keeps the line you were asked to find. The `2>&1` is needed because curl prints its `-v` notes on the error stream.

</details>

## Check yourself

**1. Which layer uses port numbers, and which layer uses IP addresses?**

<details>
<summary>Answer</summary>

The transport layer uses port numbers, to reach the right program. The internet layer uses IP addresses, to reach the right machine.

</details>

**2. What is encapsulation?**

<details>
<summary>Answer</summary>

Each layer puts its own header in front of the data it receives from the layer above. An HTTP request ends up inside a TCP segment, inside an IP packet, inside a frame. The receiving machine removes the headers in the opposite order.

</details>

**3. Someone says "that is a layer 3 device". Which model are they using, and what does the device look at?**

<details>
<summary>Answer</summary>

The OSI model. Layer 3 is the network layer, the same as the internet layer of TCP/IP, so the device looks at IP addresses.

</details>

**4. `curl` prints `Failed to connect to 127.0.0.1 port 8001`. Is the web page missing?**

<details>
<summary>Answer</summary>

You cannot know yet. The failure is on the transport layer: no program listens on that port, so HTTP was never spoken. A missing page is an application layer answer, such as 404, and you only get it after a connection was opened.

</details>

## Common mistakes

- **Learning the seven OSI names and stopping there.** The names are vocabulary. What you need is the job of each layer and the address it uses: MAC, IP, port.
- **Thinking the layers are separate trips.** There is one trip. The request is wrapped on the way down, sent once, and unwrapped on the way up.
- **Blaming the application for every failure.** `Could not resolve host` and `Failed to connect` mean the request never reached the web server. Fix the lower layer first.
- **Leaving the test server running.** The next time you start it you get `Address already in use`. Stop it with `pkill -f http.server`.
- **Mixing up OSI and TCP/IP numbers.** People say "layer 7" for HTTP even though the TCP/IP model has only four layers. Spoken layer numbers are always OSI numbers.

## Key terms

- **Protocol**: an agreed set of rules for how two machines talk, such as HTTP, TCP or IP.
- **Layer**: one level of the network stack, with one job. It uses the layer below it.
- **TCP/IP model**: the four-layer model of the real internet: application, transport, internet, link.
- **OSI model**: a seven-layer reference model. Its layer numbers are used as common vocabulary.
- **Header**: the label a layer puts in front of the data, with what that layer needs, such as addresses or port numbers.
- **Encapsulation**: wrapping the data of one layer inside the unit of the layer below.
- **Frame**: the unit of data at the link layer.
- **Packet**: the unit of data at the internet layer. Often used loosely for any unit of network data.
- **Segment**: the unit of data in TCP, at the transport layer.
- **Network interface**: a connection point between a machine and a network, such as a Wi-Fi card or the loopback interface.
- **MAC address**: the link layer address of a network interface, written as six pairs of hexadecimal digits.
- **Loopback**: the interface `lo` with the address `127.0.0.1`. Traffic sent to it stays on your own machine.

## Go further

- [RFC 1122: Requirements for Internet Hosts, Communication Layers](https://www.rfc-editor.org/rfc/rfc1122): the official description of the internet's layers. Section 1.1.3 is a short and readable summary.
- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview): shows where HTTP sits above TCP and IP, with clear drawings.
- [ip(8) manual page](https://manpages.ubuntu.com/manpages/noble/man8/ip.8.html): the reference for the `ip` command you used in steps 1 and 2.
