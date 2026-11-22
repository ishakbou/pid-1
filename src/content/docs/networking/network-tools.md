---
title: Network tools
description: Use ping, traceroute, dig, ss, nc and curl to find out, layer by layer, where a network problem is.
lesson: "6.7"
time: 25 min
sidebar:
  order: 7
---

A friend sends you a message: "My web server does not work." That sentence could mean a dead cable, a wrong address, a broken name, a program that never started, or a page with a typo in it. Each of those lives on a different layer, and each has a tool that can see it. This lesson gives you the toolbox and an order to use it in.

## Goal

After this lesson you can:

- Say which question each of `ping`, `traceroute`, `dig`, `ss`, `nc` and `curl` answers.
- Read the important parts of their output.
- Track down a network problem from the bottom layer up.

## Why it matters

Guessing is slow. When you know which tool checks which layer, "it does not work" turns into a few short questions with clear answers: can I reach the machine, does the name resolve, is anything listening, does the program answer? The same tools are the first ones a system administrator or a security analyst reaches for, on every kind of system.

## The idea

Every tool in this lesson asks one question about one layer. Here they are, from the bottom of the stack to the top:

| Question | Tool | Layer |
|---|---|---|
| Do I have an address and a route? | `ip addr`, `ip route` | Link and internet |
| Can I reach that machine at all? | `ping` | Internet |
| Which routers does the path go through, and where does it stop? | `traceroute` | Internet |
| Does the name turn into an address? | `getent hosts`, `dig` | Application (DNS) |
| Is a program listening, and which connections are open? | `ss` | Transport |
| Can I open a connection to that port? | `nc -z` | Transport |
| Does the service answer correctly, and how fast? | `curl` | Application |

You met `ip`, `dig`, `ss`, `nc` and `curl` earlier in this module. Two tools are new, and both use a helper protocol of the internet layer called **ICMP** (Internet Control Message Protocol). ICMP carries short reports and tests between machines, such as "here is my answer to your test" or "I had to drop your packet".

`ping` sends an ICMP **echo request** to a machine, and the machine answers with an **echo reply**. It is like calling "Are you there?" across a dark room and listening for "Yes". You learn whether the machine is reachable and how long the answer took. One warning: many servers and firewalls ignore pings on purpose. No answer means "no reply", not always "the machine is down".

`traceroute` shows the routers on the way, and it uses a trick. Every IP packet carries a counter called the **TTL field** (time to live). Each router that passes the packet on lowers it by one, and a router that brings it to zero drops the packet and sends an ICMP "time exceeded" report back to the sender. The counter exists so that a packet caught in a loop dies instead of travelling forever. `traceroute` sends probes with a TTL of 1, then 2, then 3, and so on. The probe with TTL 1 dies at the first router, the one with TTL 2 at the second, and each report tells `traceroute` who stood at that hop.

The order matters as much as the tools. Work from the bottom up. If `ping` cannot reach the machine, there is no point reading HTTP headers. If the name does not resolve, nothing above it will work either.

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
-->

The outputs come from a small virtual machine, so its gateway is `10.0.2.2` and its own address is `10.0.2.15`. Your addresses and all the times in milliseconds will be different.

### 1. Ping your own machine

<!-- lab: nocheck -->
```bash
ping -c 3 127.0.0.1
```

```output
PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.738 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.844 ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.806 ms

--- 127.0.0.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2006ms
rtt min/avg/max/mdev = 0.738/0.796/0.844/0.043 ms
```

`-c 3` means "send three requests, then stop". Each line is one reply. `icmp_seq` numbers the requests, so a gap in the numbers shows a lost packet. `ttl` is what was left of the TTL counter when the reply arrived. `time` is the **round-trip time**: from sending the request to receiving the reply.

The last two lines are the summary: how many replies came back, and the shortest, average and longest round trip. This first test only proves that your own network stack works.

### 2. Ping your gateway

<!-- lab: nocheck -->
```bash
ip route | grep default
```

```output
default via 10.0.2.2 dev enp0s2 proto dhcp src 10.0.2.15 metric 100
```

You read this line in lesson 6.6: the gateway is `10.0.2.2`. Use the address from your own output in the next command.

<!-- lab: nocheck -->
```bash
ping -c 3 10.0.2.2
```

```output
PING 10.0.2.2 (10.0.2.2) 56(84) bytes of data.
64 bytes from 10.0.2.2: icmp_seq=1 ttl=255 time=0.780 ms
64 bytes from 10.0.2.2: icmp_seq=2 ttl=255 time=0.576 ms
64 bytes from 10.0.2.2: icmp_seq=3 ttl=255 time=0.691 ms

--- 10.0.2.2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 0.576/0.682/0.780/0.083 ms
```

The gateway answers, so your machine can reach the first router on the way out. Every system picks its own starting value for the TTL counter: Linux uses 64, and this gateway uses 255.

### 3. Ping an address where nobody lives

<!-- lab: nocheck -->
```bash
ping -c 2 -W 1 10.0.2.99
```

```output
PING 10.0.2.99 (10.0.2.99) 56(84) bytes of data.

--- 10.0.2.99 ping statistics ---
2 packets transmitted, 0 received, 100% packet loss, time 1002ms

```

`-W 1` means "wait at most one second for each reply". No machine uses this address, so no reply came back. On a real network you may also see lines that say `Destination Host Unreachable`.

`ping` also reports the result in its **exit code**, the number a command hands back to the shell when it ends. `$?` holds the exit code of the last command, and `-q` (quiet) keeps only the summary.

```bash
ping -c 1 -q 127.0.0.1 > /dev/null; echo "exit code: $?"
ping -c 2 -W 1 -q 10.0.2.99 > /dev/null; echo "exit code: $?"
```

```output
exit code: 0
exit code: 1
```

`0` means success, anything else means failure. That makes `ping` easy to use in a script: "if the gateway does not answer, print a warning".

A name that does not resolve fails before any ping is sent:

```bash
ping -c 1 no-such-machine.test
```

```output
ping: no-such-machine.test: Name or service not known
```

The error tells you the layer: this is a name problem, not a reachability problem.

### 4. Trace the path

`traceroute` is not always installed. Install it with apt, as in lesson 1.6. It prints the usual installation lines.

```bash
sudo apt install -y traceroute
```

<!-- lab: nocheck -->
```bash
traceroute -n 127.0.0.1
```

```output
traceroute to 127.0.0.1 (127.0.0.1), 30 hops max, 60 byte packets
 1  127.0.0.1  0.855 ms  0.181 ms  0.103 ms
```

`-n` shows addresses only, without looking up a name for each one, which is faster. One line per hop, and three times per line, because `traceroute` sends three probes for every TTL value. Your own machine is one hop away from itself, so the list ends at once.

Now try it on your own computer against a real site:

<!-- lab: skip -->
```bash
traceroute -n example.com
```

You get one line per router, often between 8 and 20 of them. The first line is your home router (on WSL it is Windows itself, which passes your packets on), the next few belong to your internet provider, and the last one is the server. A line of three stars, `* * *`, is a router that did not send a report back. That is common and harmless, as long as later lines still appear. If the list stops at some hop and only stars follow, the path breaks around there.

### 5. Check the name

```bash
getent hosts localhost
```

```output
::1             localhost
```

`getent hosts` asks exactly the way a normal program does: the hosts file first, then DNS (lesson 6.4). Here `localhost` became the IPv6 loopback address `::1`. Some systems print `127.0.0.1` instead: both are loopback addresses. For the details of a DNS answer, use `dig`.

```bash
getent hosts no-such-machine.test; echo "exit code: $?"
```

```output
exit code: 2
```

Nothing found: no output, and the exit code `2`, which `getent` uses for "not found".

### 6. List sockets with ss

Start a test server, this time with `--bind 127.0.0.1`, which tells it to listen on the loopback address only.

```bash
mkdir ~/netlab
cd ~/netlab
python3 -m http.server 8000 --bind 127.0.0.1 > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
ss -tlnp | grep 8000
```

```output
LISTEN 0      5          127.0.0.1:8000      0.0.0.0:*    users:(("python3",pid=2803,fd=3))
```

The server is listening on `127.0.0.1:8000`, and `-p` shows that the process is `python3`. This is the first thing to check when a service "does not answer": is it running, on which port, and on which address?

<!-- lab: nocheck -->
```bash
ss -tn
```

```output
State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
ESTAB 0      0          10.0.2.15:22       10.0.2.2:63901
```

Without `-l`, `ss` shows connections that are open right now. `ESTAB` means established: the handshake is done. This machine is reached over SSH, so there is one connection to port 22. On your own computer you may see none, or many if a browser is open.

### 7. Test a port with nc

```bash
nc -zv 127.0.0.1 8000
nc -zv 127.0.0.1 8001
```

```output
Connection to 127.0.0.1 8000 port [tcp/*] succeeded!
nc: connect to 127.0.0.1 port 8001 (tcp) failed: Connection refused
```

`-z` means "only check the connection, send no data". It answers the transport layer question without speaking HTTP: the handshake works on port 8000, and nothing listens on port 8001.

### 8. Ask the service with curl

<!-- lab: nocheck -->
```bash
curl -s -o /dev/null -w "dns %{time_namelookup}  connect %{time_connect}  total %{time_total}\n" http://localhost:8000/
```

```output
dns 0.000896  connect 0.007042  total 0.022339
```

The `-w` values are seconds since curl started: when the name was resolved, when the TCP connection was open, and when the whole answer had arrived. When a site feels slow, these three numbers tell you where the time goes. A big `dns` number points at name lookup. A big gap between `connect` and `total` points at the server program itself.

Now ask the same server through the machine's network address instead of the loopback address. Use your own address from `ip -4 -br addr`.

<!-- lab: nocheck -->
```bash
curl http://10.0.2.15:8000/
```

```output
curl: (7) Failed to connect to 10.0.2.15 port 8000 after 1 ms: Couldn't connect to server
```

Refused, although the server is running. It listens on `127.0.0.1` only, as `ss` showed in step 6, so nothing listens on `10.0.2.15:8000`. Other machines would get the same refusal. That is a good default for a test server, and a classic cause of "it works on my machine".

### 9. Stop the server

```bash
pkill -f http.server
```

## Exercise

A friend started a web server with the command below and says that `curl http://localhost:8080/` does not work. Start the server the same way, then find the problem with the tools from this lesson, one layer at a time.

```bash
cd ~/netlab
python3 -m http.server 8081 --bind 127.0.0.1 > friend.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8081 ' && break; sleep 0.2; done
-->

1. Run your friend's `curl` command. On which layer is the error?
2. Does the name `localhost` resolve?
3. Which port does the server really listen on, and on which address?
4. Prove that the server works by printing only the status code of `/`.
5. Could a classmate on the same Wi-Fi reach this server? Why?
6. Stop the server.

<details>
<summary>Show the solution</summary>

<!-- lab: nocheck -->
```bash
curl http://localhost:8080/
```

```output
curl: (7) Failed to connect to localhost port 8080 after 0 ms: Couldn't connect to server
```

Task 1: `Failed to connect` is a transport layer error: the connection was refused, so HTTP never started.

```bash
getent hosts localhost
```

```output
::1             localhost
```

Task 2: yes. The name is fine, so the problem is above the name lookup.

<!-- lab: nocheck -->
```bash
ss -tlnp | grep python3
```

```output
LISTEN 0      5          127.0.0.1:8081      0.0.0.0:*    users:(("python3",pid=3160,fd=3))
```

Task 3: port 8081, on `127.0.0.1` only. Your friend typed the wrong port.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/
```

```output
200
```

Task 4: with the right port, the server answers `200`.

Task 5: no. The server listens on the loopback address, which only this machine can reach. To accept other machines it would have to listen on `0.0.0.0` or on the machine's network address.

```bash
pkill -f http.server
```

Task 6: done.

</details>

## Check yourself

**1. `ping` to a web server gets no reply, but the site opens fine in your browser. How is that possible?**

<details>
<summary>Answer</summary>

Many servers and firewalls ignore ICMP echo requests on purpose. The machine is reachable over TCP on port 443, it just does not answer pings. No reply from `ping` does not prove that a machine is down.

</details>

**2. How does `traceroute` find out which routers are on the path?**

<details>
<summary>Answer</summary>

It sends probes with a TTL of 1, 2, 3 and so on. Each router lowers the TTL by one, and the router that brings it to zero drops the probe and sends back an ICMP "time exceeded" report. The sender of each report is the router at that hop.

</details>

**3. Which tool shows you which programs are listening on which ports of your machine?**

<details>
<summary>Answer</summary>

`ss -tlnp`: TCP (`-t`), listening sockets (`-l`), numbers instead of names (`-n`), and the process that owns each socket (`-p`).

</details>

**4. `ss` shows a server on `127.0.0.1:8000`. Can another computer connect to it?**

<details>
<summary>Answer</summary>

No. `127.0.0.1` is the loopback address, reachable only from the same machine. Another computer gets `Connection refused`.

</details>

**5. A colleague reads HTTP headers for an hour, and then you find that `ping` to the gateway fails. What went wrong with the method?**

<details>
<summary>Answer</summary>

They started at the top of the stack. Work from the bottom up: address and route, then reachability, then the name, then the port, then the application. A broken lower layer makes everything above it fail.

</details>

## Common mistakes

- **Running `ping` without `-c` and wondering why it never ends.** On Linux it runs until you press Ctrl+C. Add `-c 3`.
- **Taking "no ping reply" as "the machine is down".** Check the service itself with `nc -zv` or `curl` before you decide.
- **Panicking about `* * *` in a traceroute.** Many routers do not send reports. It only matters when every line after a certain hop is stars.
- **Forgetting that `curl` does not show the status code.** A page that loads can still be a 404 or 500. Print the code with `-w "%{http_code}\n"`.
- **Testing from the server and concluding that others can connect.** A test on `localhost` only proves that the program works locally. Check the listening address with `ss -tlnp`.

## Key terms

- **ICMP**: Internet Control Message Protocol, the helper protocol of the internet layer that carries test messages and error reports.
- **Echo request**: the ICMP message that `ping` sends. The target answers with an echo reply.
- **Round-trip time**: the time from sending a request until its reply arrives, shown by `ping` in milliseconds.
- **TTL field**: a counter in every IP packet that each router lowers by one. At zero the packet is dropped. Not the same as the TTL of a DNS answer.
- **Exit code**: the number a command hands back to the shell when it ends. `0` means success. The shell keeps it in `$?`.

## Go further

- [ping(8) manual page](https://manpages.ubuntu.com/manpages/noble/man8/ping.8.html): every option of `ping`, including how to change the size and interval of the requests.
- [ss(8) manual page](https://manpages.ubuntu.com/manpages/noble/man8/ss.8.html): the reference for `ss`, with filters for states, ports and addresses.
- [RFC 792: Internet Control Message Protocol](https://www.rfc-editor.org/rfc/rfc792): the original ICMP standard. The pages on "Echo" and "Time Exceeded" describe what `ping` and `traceroute` rely on.
