---
title: Reading traffic with Wireshark
description: Capture your own network traffic to a file, then open it in Wireshark or tshark to read a TCP handshake and an HTTP request packet by packet.
lesson: "6.8"
time: 25 min
sidebar:
  order: 8
---

So far, every tool told you its own summary of what happened: `curl` said "200 OK", `ss` said "ESTAB". In this lesson you stop taking anyone's word for it. You record every packet of one web request, then open the recording and read the handshake, the headers of each layer, and the HTTP text itself.

## Goal

After this lesson you can:

- Capture your own traffic to a file, safely, with `dumpcap`.
- Open a capture in Wireshark or `tshark` and find the TCP handshake and the HTTP request.
- Use capture filters and display filters to see only the packets you care about.

## Why it matters

When two programs disagree about what was sent, the capture settles it. Network engineers use captures to debug slow or broken connections, and security analysts use them to investigate incidents: which machine talked to which, when, and what was said. Many CTF challenges (capture the flag, the security puzzle games of Module 14) are a capture file with a secret hidden inside. And once you have seen a password travel in plain text on your own machine, you will never again doubt why HTTPS exists.

## The idea

A **packet capture** is a copy of every packet that passes a network interface, each with a timestamp, saved to a file. The usual file format is called **pcap**. Think of a clerk at the sorting desk of a post office who photocopies every envelope, and everything inside it, before passing it on. The mail still arrives normally, and you get a complete record to read later.

Three programs from the same project work together:

- **Wireshark** is the program with a window, for reading captures with the mouse.
- **tshark** is its terminal version. It uses the same engine and the same filters, and prints text.
- **dumpcap** is the small program that both of them use to do the actual capturing.

Capturing needs root, because it lets you see traffic of every program on the machine. Reading a capture file does not. The Wireshark project recommends that only `dumpcap` gets the right to capture, and that Wireshark and tshark never run as root. In this lesson you follow that rule: you capture with `sudo dumpcap` and do everything else as your normal user. A capture file can contain passwords and cookies, and the code that takes packets apart is big and complex, so you do not want it running as root.

### The Wireshark window

Wireshark shows a capture in three parts, from top to bottom:

1. **The packet list**: one line per packet, with its number, time, source, destination, protocol, length and a short summary called "Info".
2. **The packet details**: for the selected packet, one line per layer that you can unfold: `Frame`, `Ethernet II`, `Internet Protocol Version 4`, `Transmission Control Protocol`, `Hypertext Transfer Protocol`. This is encapsulation from lesson 6.1, made visible.
3. **The packet bytes**: the same packet as raw hexadecimal bytes. Click a field in the details, and its bytes light up here.

### Two kinds of filters

| | Capture filter | Display filter |
|---|---|---|
| When it acts | Before capturing: what is recorded at all | After capturing: what is shown |
| Example | `tcp port 8000` | `tcp.port == 8000` |
| Where you type it | `dumpcap -f`, or Wireshark's start screen | `tshark -Y`, or the filter bar above the packet list |
| If you get it wrong | The packets are gone for good | Change it and look again |

Capture filters are short words, such as `host 127.0.0.1` or `udp port 53`. Display filters name fields of the protocols, such as `http.request` or `tcp.flags.syn == 1`, and are much more precise.

:::caution[Your traffic only]
Capture only on your own machines and on networks you own or have written permission to watch. Recording other people's traffic without permission can be a crime in many countries, even on a shared Wi-Fi. In this lesson you capture on the loopback interface, which carries only your own machine's traffic.
:::

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
sudo pkill -x dumpcap
-->

The outputs below come from Ubuntu with the user `sam`. Port numbers, times and sizes will differ on your machine.

### 1. Install the tools

```bash
sudo apt install -y tshark
```

This installs `tshark` and `dumpcap`. During the installation a blue screen may ask "Should non-superusers be able to capture packets?". Choose **No** with the arrow keys and press Enter: you will capture with `sudo` instead.

For the window version, install Wireshark from [wireshark.org](https://www.wireshark.org/download.html) on Windows or macOS. On an Ubuntu desktop the package is called `wireshark`. The steps below only need `tshark`.

### 2. Start something to watch

```bash
mkdir ~/netlab
cd ~/netlab
echo "hello from the application layer" > hello.txt
python3 -m http.server 8000 --bind 127.0.0.1 > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

The same server as in lesson 6.7.

### 3. Start the capture

```bash
sudo -v
sudo dumpcap -i lo -f "tcp port 8000" -w - > web.pcap 2> capture.log &
```

<!-- lab: run
for i in $(seq 120); do grep -q Capturing capture.log && break; sleep 0.5; done
-->

`sudo -v` asks for your password now, so that the next `sudo` can run in the background without asking. Then the options of `dumpcap`:

- `-i lo` captures on the loopback interface.
- `-f "tcp port 8000"` is the capture filter: record only TCP packets to or from port 8000.
- `-w -` writes the capture to standard output, and `> web.pcap` saves it in a file. Because your own shell creates that file, it belongs to you and not to root.
- `2> capture.log` keeps the messages of `dumpcap` out of your way, and `&` runs it in the background.

Wait a few seconds, then check that it is ready:

```bash
cat capture.log
```

```output
Capturing on 'Loopback: lo'
File: -
```

### 4. Make some traffic

```bash
curl -s http://127.0.0.1:8000/hello.txt
```

```output
hello from the application layer
```

One request, one answer. Every packet of it is now in `web.pcap`.

### 5. Stop the capture

```bash
sudo pkill -INT -x dumpcap
```

<!-- lab: run
sleep 2
-->

`-INT` sends the same signal as pressing Ctrl+C, so `dumpcap` finishes the file properly before it stops.

<!-- lab: nocheck -->
```bash
ls -l web.pcap
```

```output
-rw-rw-r-- 1 sam sam 1900 Nov 21 20:14 web.pcap
```

About 2 KB for one small request. The file belongs to `sam`, so you can read it without `sudo`.

### 6. Read the packet list

<!-- lab: nocheck -->
```bash
tshark -r web.pcap
```

```output
    1 0.000000000    127.0.0.1 → 127.0.0.1    TCP 74 46518 → 8000 [SYN] Seq=0 Win=65495 Len=0 MSS=65495 SACK_PERM TSval=2982258899 TSecr=0 WS=128
    2 0.000296529    127.0.0.1 → 127.0.0.1    TCP 74 8000 → 46518 [SYN, ACK] Seq=0 Ack=1 Win=65483 Len=0 MSS=65495 SACK_PERM TSval=2982258900 TSecr=2982258899 WS=128
    3 0.000504149    127.0.0.1 → 127.0.0.1    TCP 66 46518 → 8000 [ACK] Seq=1 Ack=1 Win=65536 Len=0 TSval=2982258901 TSecr=2982258900
    4 0.002454836    127.0.0.1 → 127.0.0.1    HTTP 152 GET /hello.txt HTTP/1.1 
    5 0.002683558    127.0.0.1 → 127.0.0.1    TCP 66 8000 → 46518 [ACK] Seq=1 Ack=87 Win=65408 Len=0 TSval=2982258903 TSecr=2982258903
    6 0.019207748    127.0.0.1 → 127.0.0.1    TCP 252 HTTP/1.0 200 OK  [TCP segment of a reassembled PDU]
    7 0.019628888    127.0.0.1 → 127.0.0.1    TCP 66 46518 → 8000 [ACK] Seq=87 Ack=187 Win=65408 Len=0 TSval=2982258920 TSecr=2982258919
    8 0.020491371    127.0.0.1 → 127.0.0.1    HTTP 99 HTTP/1.0 200 OK  (text/plain)
    9 0.020929513    127.0.0.1 → 127.0.0.1    TCP 66 46518 → 8000 [ACK] Seq=87 Ack=220 Win=65408 Len=0 TSval=2982258921 TSecr=2982258921
   10 0.021964513    127.0.0.1 → 127.0.0.1    TCP 66 46518 → 8000 [FIN, ACK] Seq=87 Ack=220 Win=65536 Len=0 TSval=2982258922 TSecr=2982258921
   11 0.022410256    127.0.0.1 → 127.0.0.1    TCP 66 8000 → 46518 [FIN, ACK] Seq=220 Ack=88 Win=65536 Len=0 TSval=2982258923 TSecr=2982258922
   12 0.023190831    127.0.0.1 → 127.0.0.1    TCP 66 46518 → 8000 [ACK] Seq=88 Ack=221 Win=65536 Len=0 TSval=2982258923 TSecr=2982258923
```

`-r` reads a file instead of capturing. This is exactly Wireshark's packet list: number, seconds since the first packet, source and destination, protocol, length in bytes, and the Info summary. The lines are long, so scroll sideways. Twelve packets for one tiny request:

- **1 to 3** are the three-way handshake from lesson 6.3: `[SYN]`, `[SYN, ACK]`, `[ACK]`. The client used the ephemeral port 46518.
- **4** is the HTTP request, `GET /hello.txt`.
- **6 and 8** are the response. The server sent its headers and the file content in two segments, and Wireshark put them back together. That is what "reassembled PDU" means: a PDU (protocol data unit) is one complete message of a protocol, here the whole HTTP response.
- **5, 7 and 9** are acknowledgements: "I got your data up to here".
- **10 to 12** close the connection. Each side sends a segment with the **FIN** flag, "I am done sending", and the other side acknowledges it.

### 7. Look inside the handshake

`-T fields` prints the fields named with `-e`, and `-E header=y` adds a line with their names.

```bash
tshark -r web.pcap -c 3 -T fields -E header=y -e frame.number -e tcp.flags.syn -e tcp.flags.ack -e tcp.seq -e tcp.ack
```

```output
frame.number	tcp.flags.syn	tcp.flags.ack	tcp.seq	tcp.ack
1	True	False	0	0
2	True	True	0	1
3	False	True	1	1
```

`-c 3` stops after three packets. The SYN and ACK flags confirm the handshake. The last two columns are the **sequence number** and the acknowledgement number: TCP numbers the bytes it sends, and an acknowledgement says "the next byte I expect from you is this one". Real sequence numbers start at a random value, so Wireshark shows them counted from 0 to keep them readable. A SYN counts as one byte, which is why each side answers with `1`.

### 8. See the headers of every layer

```bash
tshark -r web.pcap -Y http.request -T fields -e frame.protocols
```

```output
eth:ethertype:ip:tcp:http
```

`-Y http.request` is a display filter: show only packets that carry an HTTP request. `frame.protocols` lists the layers inside the packet, from the outside in: Ethernet, IP, TCP, HTTP. Now one field from each header:

```bash
tshark -r web.pcap -Y http.request -T fields -e eth.src -e eth.dst -e ip.src -e ip.dst -e tcp.dstport
```

```output
00:00:00:00:00:00	00:00:00:00:00:00	127.0.0.1	127.0.0.1	8000
```

The MAC addresses from the Ethernet header, the IP addresses from the IP header, and the destination port from the TCP header. The MAC addresses are all zeros because the loopback interface has no hardware. On a real network you would see the MAC addresses of your network card and of your router here.

### 9. Follow the conversation

<!-- lab: nocheck -->
```bash
tshark -r web.pcap -q -z follow,tcp,ascii,0
```

```output

===================================================================
Follow: tcp,ascii
Filter: tcp.stream eq 0
Node 0: 127.0.0.1:46518
Node 1: 127.0.0.1:8000
86
GET /hello.txt HTTP/1.1
Host: 127.0.0.1:8000
User-Agent: curl/8.5.0
Accept: */*


	186
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 20:14:11 GMT
Content-type: text/plain
Content-Length: 33
Last-Modified: Sat, 21 Nov 2026 20:11:15 GMT


	33
hello from the application layer

===================================================================
```

`-z follow,tcp,ascii,0` puts the data of TCP connection number 0 back together and prints it as text, and `-q` hides the packet list. You see the whole conversation as the two programs saw it: 86 bytes from the client, then 186 bytes of headers and 33 bytes of content from the server.

### 10. Open the same file in Wireshark

If you installed Wireshark, open `web.pcap` in it. On an Ubuntu desktop:

<!-- lab: skip -->
```bash
wireshark web.pcap &
```

On Windows with WSL, copy the file to your Windows desktop first, replacing `YOURNAME` with your Windows user name, then double-click it there:

<!-- lab: skip -->
```bash
cp web.pcap /mnt/c/Users/YOURNAME/Desktop/
```

Click packet 4 and unfold each layer in the details pane. Type `tcp.flags.syn == 1` in the filter bar and press Enter: only packets 1 and 2 remain. Then right-click packet 4 and choose Follow, then TCP Stream: Wireshark shows the same conversation as step 9, with the client's part in one colour and the server's in another.

### 11. Stop the server

```bash
pkill -f http.server
```

## Exercise

See for yourself what plain HTTP means for a password.

1. Start the web server again in `~/netlab` and start a new capture into `login.pcap`.
2. Send a fake login form: `curl -s -o /dev/null -w "%{http_code}\n" -d "user=sam&password=s3cret" http://127.0.0.1:8000/`. The server answers 501, which does not matter here.
3. Stop the capture and find the password in `login.pcap` with a display filter.
4. Delete both capture files and stop the server.

<details>
<summary>Show the solution</summary>

```bash
cd ~/netlab
python3 -m http.server 8000 --bind 127.0.0.1 > server.log 2>&1 &
sudo -v
sudo dumpcap -i lo -f "tcp port 8000" -w - > login.pcap 2> capture.log &
```

<!-- lab: run
for i in $(seq 120); do grep -q Capturing capture.log && ss -ltn | grep -q ':8000 ' && break; sleep 0.5; done
-->

```bash
curl -s -o /dev/null -w "%{http_code}\n" -d "user=sam&password=s3cret" http://127.0.0.1:8000/
sudo pkill -INT -x dumpcap
```

```output
501
```

<!-- lab: run
sleep 2
-->

```bash
tshark -r login.pcap -Y urlencoded-form -T fields -e urlencoded-form.key -e urlencoded-form.value
```

```output
user,password	sam,s3cret
```

`urlencoded-form` is the name Wireshark gives to form data sent with POST. Its keys and values sit in the capture in plain text: anyone who can capture on the way can read them. With HTTPS, the same capture would show only encrypted bytes after the TLS setup.

```bash
rm web.pcap login.pcap
pkill -f http.server
```

</details>

## Check yourself

**1. Why capture with `sudo dumpcap` and read the file as your normal user, instead of running everything as root?**

<details>
<summary>Answer</summary>

Only capturing needs root. The code that takes packets apart is large and reads data that anyone on the network could have sent, so it is safer to run it without root.

</details>

**2. What is the difference between the capture filter `tcp port 8000` and the display filter `tcp.port == 8000`?**

<details>
<summary>Answer</summary>

The capture filter decides what is recorded at all: packets that do not match are never saved. The display filter only hides packets that are already in the capture, and you can change it at any time.

</details>

**3. Which three packets start every TCP connection in a capture, and what flags do they have?**

<details>
<summary>Answer</summary>

The three-way handshake: a packet with SYN from the client, one with SYN and ACK from the server, and one with ACK from the client.

</details>

**4. In step 6, why does the response from the server appear in two packets?**

<details>
<summary>Answer</summary>

The server sent its headers and the file content in two separate TCP segments. TCP carries a stream of bytes, and the sender decides how to cut it. Wireshark reassembles the segments and shows the complete HTTP response on the last one.

</details>

**5. You find a password in a capture of HTTP traffic. Would the same happen with HTTPS?**

<details>
<summary>Answer</summary>

No. With HTTPS the HTTP messages travel inside an encrypted TLS connection. The capture still shows the IP addresses, the ports and the handshake, but the requests, headers and form data are unreadable bytes.

</details>

## Common mistakes

- **Capturing on the wrong interface.** Traffic to `127.0.0.1` only appears on `lo`. Traffic to other machines appears on your network interface, such as `enp0s2` or `wlan0`.
- **Using display filter syntax as a capture filter, or the reverse.** `dumpcap -f "tcp.port == 8000"` fails with a syntax error. Capture filters use words: `tcp port 8000`.
- **Running Wireshark or tshark as root.** Capture with `sudo dumpcap`, then read the file as yourself.
- **Stopping the capture with `kill -9`.** The file may end up cut off. Use Ctrl+C, or `pkill -INT`, so that `dumpcap` can finish the file.
- **Sharing a capture file without looking inside.** It can contain passwords, cookies and private addresses. Check it, and delete it when you no longer need it.

## Key terms

- **Packet capture**: a recording of the packets that passed a network interface, with a timestamp for each one.
- **pcap**: the most common file format for packet captures.
- **Wireshark**: a free program for capturing and reading network traffic in a window.
- **tshark**: the terminal version of Wireshark, with the same engine and filters.
- **dumpcap**: the small capture program that Wireshark and tshark use to record packets.
- **Capture filter**: a filter applied while capturing, which decides which packets are recorded at all.
- **Display filter**: a filter applied to an existing capture, which decides which packets are shown.
- **Sequence number**: the number TCP gives to the bytes it sends, so that the receiver can acknowledge them and put them in order.
- **FIN**: the TCP flag that says "I have nothing more to send", used to close a connection.

## Go further

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/): the official manual, with a clear chapter on the main window and one on display filters.
- [Wireshark display filter reference](https://www.wireshark.org/docs/dfref/): every field of every protocol that you can use in a display filter, such as `http.request` or `tcp.flags.syn`.
- [Wireshark sample captures](https://wiki.wireshark.org/SampleCaptures): free capture files of many protocols, safe to download and explore.
