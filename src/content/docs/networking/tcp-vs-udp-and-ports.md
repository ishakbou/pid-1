---
title: TCP vs UDP and ports
description: Learn what a port number is for, how TCP opens a connection with a three-way handshake and delivers data reliably, and when the simpler and faster UDP is the better choice.
lesson: "6.3"
time: 20 min
sidebar:
  order: 3
---

An IP address gets a packet to the right machine, and then two problems remain. The machine runs dozens of programs: which one is the packet for? And the network gives no promises: packets can get lost, arrive twice, or arrive in the wrong order. The transport layer answers both, with port numbers and with two protocols that make opposite choices.

## Goal

After this lesson you can:

- Explain what a port number is and list the ports of SSH, DNS, HTTP and HTTPS.
- Describe the TCP three-way handshake and what TCP guarantees.
- Choose between TCP and UDP for a given kind of traffic.

## Why it matters

"Port 443 is open", "the service listens on 5432", "connection refused": you will read sentences like these every week. Firewalls allow or block traffic by protocol and port, so you cannot write or read a firewall rule without them. And when a program cannot reach another, the first question is always the same: is something listening on that port?

## The idea

### Ports

A **port** is a number from 0 to 65535 that identifies one endpoint of communication on a machine. If the IP address is the street address of a building, the port is the apartment number: the address gets the letter to the building, and the number gets it to the right door.

A program that wants to receive traffic asks the operating system for a port and then **listens** on it. Servers use fixed, well-known numbers so that clients know where to knock:

| Port | Protocol | Used for |
|---|---|---|
| 22 | TCP | SSH, remote login |
| 53 | UDP and TCP | DNS, turning names into addresses |
| 80 | TCP | HTTP, the web without encryption |
| 443 | TCP | HTTPS, the web with encryption |

Ports below 1024 are reserved for such standard services, and by default on Linux only root may listen on them. That is why test servers use numbers such as 8000 or 5000.

The client needs a port too, so that the answer can find its way back. It does not choose one: the operating system picks a free high number for each new connection, called an **ephemeral port**. The pair of an IP address and a port, such as `192.168.1.37:51514`, is called a **socket**.

### TCP: a phone call

**TCP** (Transmission Control Protocol) works like a phone call. First you set up the call. Then both sides talk, and each confirms what it heard. If something was not understood, it is said again. At the end, both sides hang up.

Setting up the call is the **three-way handshake**:

<figure class="diagram">
<svg viewBox="0 0 460 260" role="img" aria-labelledby="hs-title hs-desc">
<title id="hs-title">The TCP three-way handshake</title>
<desc id="hs-desc">Two vertical lines, the client on the left and the server on the right. Three highlighted arrows go between them from top to bottom. The first arrow goes from the client to the server and is labelled SYN. The second goes from the server back to the client and is labelled SYN-ACK. The third goes from the client to the server and is labelled ACK. Under the arrows a note says that the connection is open.</desc>
<path class="d-line" d="M90 30 V230 M370 30 V230"/>
<path class="d-line d-hot" d="M90 60 L370 90 M359.5 93.9 L370 90 L360.6 84 M370 120 L90 150 M99.4 144 L90 150 L100.5 153.9 M90 180 L370 210 M359.5 213.9 L370 210 L360.6 204"/>
<text x="90" y="20">Client</text>
<text x="370" y="20">Server</text>
<text x="230" y="64">1. SYN</text>
<text x="230" y="124">2. SYN-ACK</text>
<text x="230" y="184">3. ACK</text>
<text x="230" y="252">The connection is open</text>
</svg>
<figcaption>Three small segments with no data in them. Time runs from top to bottom.</figcaption>
</figure>

A **flag** is an on or off switch in the TCP header, and each one has a short name.

1. The client sends a segment with the **SYN** flag: "I want to talk, and I start counting my bytes at this number."
2. The server answers **SYN-ACK**: "Understood, and I start counting mine at that number."
3. The client sends **ACK**: "Understood." Now both sides know that the other one hears them.

After that, TCP numbers every byte it sends. The receiver acknowledges what arrived, and anything that is not acknowledged in time is sent again. The receiver uses the numbers to put the data back in order and to throw away duplicates. The program above TCP sees a clean stream of bytes, exactly as it was sent.

### UDP: postcards

**UDP** (User Datagram Protocol) works like sending postcards. You write the address and drop the card in the box. There is no call to set up, no confirmation, and no promise about the order. Each message, called a **datagram**, travels alone.

That sounds worse, but it is cheaper and faster, and sometimes a late packet is useless anyway. In a video call, a lost fraction of a second of sound is better than a pause while it is sent again.

| | TCP | UDP |
|---|---|---|
| Connection | Yes, opened with a handshake | No |
| Lost data | Sent again | Stays lost |
| Order | Kept | Not guaranteed |
| Cost | More packets, more waiting | Very small |
| Typical use | Web, email, SSH, file transfer | DNS lookups, video calls, online games |

## Try it

You will use `ss`, which shows the sockets on your machine, and `nc` (netcat), a small tool that opens a raw TCP or UDP connection and sends whatever you type.

<!-- lab: run
pkill -x nc
pkill -f http.server
-->

### 1. Look up the well-known ports

```bash
grep -E "^(ssh|domain|http|https)\s" /etc/services
```

```output
ssh             22/tcp                          # SSH Remote Login Protocol
domain          53/tcp                          # Domain Name Server
domain          53/udp
http            80/tcp          www             # WorldWideWeb HTTP
https           443/tcp                         # http protocol over TLS/SSL
https           443/udp                         # HTTP/3
```

`/etc/services` is a plain list of service names and their usual ports. The pattern keeps the lines that start with one of the four names. `domain` is the old name for DNS. Notice that some services exist for both TCP and UDP: the same port number in the two protocols is two different doors.

### 2. See what is listening on your machine

<!-- lab: nocheck -->
```bash
ss -tln
```

```output
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
LISTEN 0      4096   127.0.0.53%lo:53        0.0.0.0:*
LISTEN 0      4096         0.0.0.0:22        0.0.0.0:*
LISTEN 0      4096      127.0.0.54:53        0.0.0.0:*
LISTEN 0      4096            [::]:22           [::]:*
```

The options mean: `-t` TCP only, `-l` listening sockets only, `-n` show numbers, do not translate them into names. The column to read is `Local Address:Port`. On this machine an SSH server listens on port 22, and a local DNS helper listens on port 53. Your list will be different, and on a fresh WSL it may be almost empty.

The address in front of the port matters. `0.0.0.0` means "on every address of this machine", so other machines can connect. `127.0.0.53` is a loopback address, so only programs on this same machine can reach it.

### 3. Open a TCP port yourself

```bash
mkdir ~/netlab
cd ~/netlab
nc -l 5000 > received.txt &
```

<!-- lab: run
for i in $(seq 50); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

`nc -l 5000` listens on TCP port 5000 and writes what it receives to its output, here the file `received.txt`. The `&` runs it in the background.

<!-- lab: nocheck -->
```bash
ss -tlnp | grep 5000
```

```output
LISTEN 0      1            0.0.0.0:5000      0.0.0.0:*    users:(("nc",pid=2837,fd=3))
```

Your new listener is in the list. The extra `-p` shows which process owns the socket: `nc`, with its process ID.

### 4. Send something over TCP

```bash
echo "hello over TCP" | nc -v -N 127.0.0.1 5000
```

```output
Connection to 127.0.0.1 5000 port [tcp/*] succeeded!
```

<!-- lab: run
sleep 1
-->

Without `-l`, `nc` is a client: it connects to the address and port you give and sends what it reads from its input. `-v` makes it report the connection, and `-N` makes it close the connection when the input ends. The word `succeeded` means the three-way handshake worked.

```bash
cat received.txt
```

```output
hello over TCP
```

The text crossed a real TCP connection from one process to another. The listener stopped by itself when the client closed the connection.

### 5. Knock on a closed port

```bash
echo "anyone there?" | nc -v -N 127.0.0.1 5000
```

```output
nc: connect to 127.0.0.1 port 5000 (tcp) failed: Connection refused
```

Nothing listens on port 5000 any more. The machine answered the SYN with a refusal, and TCP reported it at once. This is the famous `Connection refused`: the machine is reachable, but no program is behind that port.

### 6. Send a postcard to a closed port

```bash
echo "hello over UDP" | nc -u -w 1 127.0.0.1 5001
```

`-u` switches `nc` to UDP, and `-w 1` makes it give up after one second. It printed nothing. Nobody listens on UDP port 5001, so the datagram was thrown away, and `nc` reported no problem. With UDP there is no handshake and no acknowledgement, so "sent" never means "received".

### 7. Receive a postcard

```bash
nc -u -l 5001 > postcard.txt &
```

<!-- lab: run
for i in $(seq 50); do ss -lun | grep -q ':5001 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
ss -uln | grep 5001
```

```output
UNCONN 0      0               0.0.0.0:5001       0.0.0.0:*
```

`-u` asks `ss` for UDP sockets. The spaces between the columns can differ on your screen, because `ss` sizes its columns to fit all the sockets of the machine. The state is `UNCONN`, "unconnected", because UDP has no connections to be in.

```bash
echo "hello over UDP" | nc -u -w 1 127.0.0.1 5001
cat postcard.txt
```

```output
hello over UDP
```

This time someone was listening, so the datagram arrived. The UDP listener does not stop by itself: with no connection, it cannot know that the sender is finished. Stop it:

```bash
pkill -x nc
```

`pkill` stops processes by name, and `-x` means the name must be exactly `nc`.

### 8. Watch the client's port change

Start the small Python web server from lesson 6.1 and ask curl which sockets it used.

```bash
python3 -m http.server 8000 > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
curl -s -o /dev/null -w "%{local_ip}:%{local_port} -> %{remote_ip}:%{remote_port}\n" http://127.0.0.1:8000/
curl -s -o /dev/null -w "%{local_ip}:%{local_port} -> %{remote_ip}:%{remote_port}\n" http://127.0.0.1:8000/
```

```output
127.0.0.1:50718 -> 127.0.0.1:8000
127.0.0.1:50734 -> 127.0.0.1:8000
```

`-s -o /dev/null` hides the page, and `-w` prints facts about the connection instead. The server side is always port 8000. The client side is an ephemeral port, and the operating system picked a different one for each connection. A TCP connection is identified by all four values together, which is how one server port can serve thousands of clients at once.

```bash
pkill -f http.server
```

## Exercise

1. Start a TCP listener on port 6000 that saves what it receives in `~/netlab/note.txt`.
2. Before you send anything, prove with `ss` that the port is listening.
3. Send the text `port 6000 works` to it and show the file.
4. Send the same text again. What happens, and why?

<details>
<summary>Show the solution</summary>

```bash
cd ~/netlab
nc -l 6000 > note.txt &
```

<!-- lab: run
for i in $(seq 50); do ss -ltn | grep -q ':6000 ' && break; sleep 0.2; done
-->

```bash
ss -tln | grep 6000
```

```output
LISTEN 0      1            0.0.0.0:6000      0.0.0.0:*
```

```bash
echo "port 6000 works" | nc -N 127.0.0.1 6000
```

<!-- lab: run
sleep 1
-->

```bash
cat note.txt
```

```output
port 6000 works
```

```bash
echo "port 6000 works" | nc -v -N 127.0.0.1 6000
```

```output
nc: connect to 127.0.0.1 port 6000 (tcp) failed: Connection refused
```

The second attempt is refused. `nc -l` accepts one connection and then exits, so after the first message nothing listens on port 6000 any more. The `-v` is what makes `nc` print the reason. Without it, the command just fails silently.

</details>

## Check yourself

**1. What is the difference between an IP address and a port?**

<details>
<summary>Answer</summary>

The IP address identifies the machine, or more exactly one of its network interfaces. The port identifies one program's endpoint on that machine. You need both to reach a service, and the pair is called a socket.

</details>

**2. What are the three steps of the TCP handshake, and who sends each one?**

<details>
<summary>Answer</summary>

The client sends SYN, the server answers SYN-ACK, and the client sends ACK. After that the connection is open in both directions.

</details>

**3. You send a UDP datagram to a port where nothing listens, and your program reports no error. Why?**

<details>
<summary>Answer</summary>

UDP has no handshake and no acknowledgements. Sending only means the datagram left. The sender is not told whether anyone received it.

</details>

**4. A video call and a file download: which one fits UDP better, and why?**

<details>
<summary>Answer</summary>

The video call. A lost piece of sound or picture is useless a second later, so sending it again only adds delay. A file must arrive complete and in order, which is exactly what TCP guarantees.

</details>

**5. `ss -tln` shows one service on `0.0.0.0:22` and another on `127.0.0.53:53`. Which one can other machines reach?**

<details>
<summary>Answer</summary>

The one on `0.0.0.0:22`. `0.0.0.0` means every address of the machine. The other one listens on a loopback address, which is reachable only from the machine itself.

</details>

## Common mistakes

- **Reading `Connection refused` as "the machine is down".** It is the opposite: the machine answered. Nothing listens on that port, or you have the wrong port.
- **Starting a second server on a busy port.** You get `Address already in use`. Find the owner with `ss -tlnp`, then stop it or pick another port.
- **Assuming TCP port 53 and UDP port 53 are the same thing.** Each protocol has its own set of 65536 ports. A firewall rule for one does not cover the other.
- **Trying to listen on a port below 1024 as a normal user.** The system answers `Permission denied`. Use a port above 1023 for your own tests.
- **Expecting UDP to tell you about failures.** If an application needs to know that a datagram arrived, the application itself has to send an answer back.

## Key terms

- **Port**: a number from 0 to 65535 that identifies one endpoint of communication on a machine.
- **Listen**: to wait for incoming traffic on a port. A server listens, a client connects.
- **Ephemeral port**: a temporary high port number that the operating system gives to the client side of a connection.
- **Socket**: the pair of an IP address and a port, such as `127.0.0.1:8000`.
- **TCP**: the transport protocol that opens a connection and delivers a stream of bytes completely and in order.
- **Three-way handshake**: the three segments that open a TCP connection: SYN, SYN-ACK, ACK.
- **Flag**: an on or off switch in the TCP header, such as SYN or ACK.
- **SYN**: the TCP flag that asks to open a connection.
- **ACK**: the TCP flag that confirms that data, or a SYN, was received.
- **UDP**: the transport protocol that sends separate datagrams with no connection and no guarantee of delivery or order.
- **Datagram**: one self-contained UDP message.

## Go further

- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293): the current TCP standard. Section 3.5 describes the handshake.
- [RFC 768: User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768): the whole UDP standard is three pages long, which says a lot about UDP.
- [IANA: Service Name and Transport Protocol Port Number Registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml): the official list of which service uses which port.
