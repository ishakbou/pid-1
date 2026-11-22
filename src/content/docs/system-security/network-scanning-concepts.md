---
title: Network scanning concepts
description: Learn what a port scan reveals, scan your own lab machine with nmap from inside and from a second network, and find the scan in the firewall log.
lesson: "11.6"
time: 25 min
sidebar:
  order: 6
---

<!-- lab: run
sudo ufw --force reset > /dev/null
sudo ufw default deny incoming > /dev/null
sudo ufw default allow outgoing > /dev/null
sudo ufw allow OpenSSH > /dev/null
sudo ufw --force enable > /dev/null
pkill -f http.server
mkdir -p ~/netlab
cat > ~/netlab/make-visitor.sh <<'EOF'
#!/bin/bash
ip netns del visitor 2>/dev/null
ip netns add visitor
ip link add veth-host type veth peer name veth-visitor
ip link set veth-visitor netns visitor
ip addr add 10.99.0.1/24 dev veth-host
ip link set veth-host up
ip netns exec visitor ip addr add 10.99.0.2/24 dev veth-visitor
ip netns exec visitor ip link set veth-visitor up
ip netns exec visitor ip link set lo up
EOF
sudo bash ~/netlab/make-visitor.sh
true
-->

Which doors of your machine can a stranger see? You could read every setting of every service, or you could simply walk around the building and try each door handle. A port scan does the second: it knocks on many ports and writes down how each one answers. Attackers do it first, so defenders do it before them, on their own machines.

## Goal

After this lesson you can:

- Explain what a port scan reveals and what the states open, closed and filtered mean.
- Scan your own lab machine with `nmap`, from inside and from a second network, and compare the results.
- Find the traces of a scan in the firewall log.

## Why it matters

A port scan is the outside view of your machine, the only view an attacker has at the start. It shows forgotten services and firewall mistakes that no checklist found: the test server you started last month, the database that listens on every address. Defenders scan their own networks on a schedule and compare the result with what should be there. And because attackers scan too, knowing what a scan looks like in your logs tells you when someone is looking at you.

## The idea

A **port scan** sends a connection attempt to many ports of a machine and sorts the ports by the answer. The most common tool is **nmap**, the Network Mapper, which is free and open source.

Remember the TCP handshake from Module 6: SYN, SYN-ACK, ACK. A scan only needs the first answer.

| State | What nmap sent and got back | What it means |
|---|---|---|
| open | SYN, and a SYN-ACK came back | A service is listening and reachable |
| closed | SYN, and a refusal (RST) came back | The machine is reachable, but nothing listens on this port |
| filtered | SYN, and nothing came back, even after a second try | Something, usually a firewall, dropped the packet |

Run as root, nmap does a **SYN scan**: it sends the SYN, reads the answer, and never finishes the handshake. Run as a normal user, it does a connect scan, which completes the handshake like any program. Both sort ports the same way.

It is like walking down a hotel corridor and knocking. A voice saying "come in" is open. A voice saying "nobody here" is closed. Silence is filtered: you cannot even tell whether the room exists. Notice that the knocking itself is heard. Each knock on a guarded door is noted by the guard, which is how scans get noticed.

:::caution[Your own lab only]
Scan only machines you own or have written permission to scan, as Module 9 explained. Scanning other people's machines is illegal in many countries, and it is always noticed. In this lesson you scan only your own machine and the `visitor` namespace that you built in lesson 11.3.
:::

## Try it

This lesson uses the firewall from lesson 11.3: deny incoming by default, SSH allowed. If you restarted your computer since then, build the visitor again with `sudo bash ~/netlab/make-visitor.sh`. The outputs come from the lab machine `lab`.

### 1. Install nmap

<!-- lab: nocheck -->
```bash
sudo apt install -y nmap
```

```output
Setting up nmap (7.94+git20230807.3be01efb1+dfsg-3build2) ...
Processing triggers for man-db (2.12.0-4build2) ...
```

These are the last lines that apt prints.

```bash
nmap --version | head -n 1
```

```output
Nmap version 7.94SVN ( https://nmap.org )
```

Your version may be newer. Everything in this lesson works the same way.

### 2. Start a forgotten server and note the time

```bash
cd ~/netlab
python3 -m http.server 8080 > server.log 2>&1 &
start=$(date '+%Y-%m-%d %H:%M:%S')
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8080 ' && break; sleep 0.2; done
-->

The test server plays the part of a service that somebody started and forgot. The saved time lets you find this lesson's log lines later, as in lesson 11.4.

### 3. Scan yourself from the inside

<!-- lab: nocheck -->
```bash
nmap localhost
```

```output
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-11-21 22:40 UTC
Nmap scan report for localhost (127.0.0.1)
Host is up (0.0065s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT     STATE SERVICE
22/tcp   open  ssh
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 2.09 seconds
```

Without options, nmap tries the 1,000 most common TCP ports. It found two open ones and summarised the 998 others as closed: `conn-refused` means the machine refused, which is a connect scan's way of seeing an RST. Look at the `SERVICE` column. It is only a guess from the port number: port 8080 is often used by web proxies, but here it is a Python web server. nmap does not ask the service unless you tell it to.

### 4. Compare the inside and the outside

Scan three ports, first from the machine itself:

```bash
nmap -p 22,80,8080 localhost | grep tcp
```

```output
22/tcp   open   ssh
80/tcp   closed http
8080/tcp open   http-proxy
```

`-p` picks the ports, and `grep tcp` keeps only the port lines. Now the same three ports from the visitor, which is how another machine on the network sees you:

```bash
sudo ip netns exec visitor nmap -p 22,80,8080 10.99.0.1 | grep tcp
```

```output
22/tcp   open     ssh
80/tcp   filtered http
8080/tcp filtered http-proxy
```

This takes several seconds, because nmap waits for answers that never come. Here is the whole lesson in two tables. From inside, loopback skips the firewall, as you saw in lesson 11.3, so you see what listens. From outside, the firewall hides both the closed port and the forgotten server. A visitor can no longer tell `80`, where nothing listens, from `8080`, where something does. That is deny by default doing its job.

### 5. Ask a service what it is

```bash
nmap -sV -p 22 localhost | grep open
```

```output
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.20 (Ubuntu Linux; protocol 2.0)
```

`-sV` means version detection: nmap connects and reads what the service says about itself. The SSH server announces its program, its version and even the Ubuntu package version. Attackers compare such strings with lists of known holes. Defenders use the same line to find machines that missed their updates. Your version may be newer.

### 6. Scan the 1,000 common ports from outside

<!-- lab: nocheck -->
```bash
sudo ip netns exec visitor nmap 10.99.0.1
```

```output
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-11-21 22:40 UTC
Nmap scan report for 10.99.0.1
Host is up (0.00062s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT   STATE SERVICE
22/tcp open  ssh
MAC Address: D6:2E:F4:EC:3B:5A (Unknown)

Nmap done: 1 IP address (1 host up) scanned in 19.08 seconds
```

This takes up to half a minute. The outside view of the whole machine is a single open port, SSH, which is the one you decided to allow. `no-response` is the filtered state: 999 knocks met silence. The `MAC Address` line appears because the visitor and your machine share a network, and nmap could read the hardware address of your virtual network card.

### 7. Find the scan in the firewall log

The firewall writes a line for blocked packets, and the kernel sends it to the journal:

<!-- lab: nocheck -->
```bash
sudo journalctl -k --since "$start" | grep 'UFW BLOCK' | tail -n 1
```

```output
Nov 21 22:48:08 lab kernel: [UFW BLOCK] IN=veth-host OUT= MAC=d6:2e:f4:ec:3b:5a:f2:66:9e:02:ef:a9:08:00 SRC=10.99.0.2 DST=10.99.0.1 LEN=44 TOS=0x00 PREC=0x00 TTL=54 ID=43909 PROTO=TCP SPT=44959 DPT=903 WINDOW=1024 RES=0x00 SYN URGP=0
```

`-k` keeps only kernel messages. The useful fields are `IN` (the network card it arrived on), `SRC` (who sent it), `DST` (to whom), `PROTO`, `DPT` (the destination port) and `SYN`, the first packet of a handshake. Nothing on this machine uses port 903: it is one of the thousand ports that the scan of step 6 tried. The same lines go to `/var/log/ufw.log`.

```bash
sudo journalctl -k --since "$start" | grep 'UFW BLOCK' | grep -o 'SRC=[0-9.]*' | sort -u
```

```output
SRC=10.99.0.2
```

`sort -u` sorts and keeps each line once. Every blocked packet came from one address. One source, many different destination ports, SYN packets only, all within seconds: that is what a scan looks like in a log.

<!-- lab: nocheck -->
```bash
sudo journalctl -k --since "$start" | grep -c 'UFW BLOCK'
```

```output
11
```

Only 11 lines, although the scans of steps 4 and 6 hit about a thousand blocked ports. ufw's default logging is limited to a burst of 10 lines, then about 3 per minute, so that a flood of packets cannot fill the disk. Your number may differ a little. A log samples a scan; it does not record every packet. Tools built for detection, which Module 13 introduces, count instead of logging each packet.

### 8. Stop the server

```bash
pkill -f http.server
```

## Exercise

You decide that the visitor, and only the visitor, may use the test server.

1. Start the test server again on port 8080.
2. Add the ufw rule from lesson 11.3 that allows port 8080 from `10.99.0.2` only.
3. Scan ports 22, 80 and 8080 from the visitor and compare with step 4.
4. Delete the rule and stop the server.

<details>
<summary>Show the solution</summary>

```bash
python3 -m http.server 8080 > server.log 2>&1 &
sudo ufw allow from 10.99.0.2 to any port 8080 proto tcp
```

```output
Rule added
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8080 ' && break; sleep 0.2; done
-->

```bash
sudo ip netns exec visitor nmap -p 22,80,8080 10.99.0.1 | grep tcp
```

```output
22/tcp   open     ssh
80/tcp   filtered http
8080/tcp open     http-proxy
```

Port 8080 is now open for the visitor. Port 80 stays filtered, because no rule allows it. A scan from any other address would still see 8080 as filtered. This is how you check a firewall rule from the outside: change it, scan, compare with what you expected.

```bash
sudo ufw delete allow from 10.99.0.2 to any port 8080 proto tcp
pkill -f http.server
```

```output
Rule deleted
```

</details>

## Check yourself

**1. What is the difference between a closed port and a filtered port?**

<details>
<summary>Answer</summary>

A closed port answers with a refusal (RST): the machine is reachable, but nothing listens there. A filtered port gives no answer at all, usually because a firewall dropped the packet, so the scanner cannot tell whether anything listens.

</details>

**2. Why did port 8080 show `open` from inside and `filtered` from the visitor?**

<details>
<summary>Answer</summary>

From inside, the traffic used the loopback interface, which ufw always allows, so nmap reached the server. From the visitor, the packets came in on `veth-host`, where the default deny rule dropped them.

</details>

**3. What does `-sV` add to a scan, and why does it matter to a defender?**

<details>
<summary>Answer</summary>

Version detection: nmap talks to the service and reports the program and version it announces. A defender uses it to find services that run old versions and need updates, before an attacker does the same.

</details>

**4. How does a port scan look in the firewall log?**

<details>
<summary>Answer</summary>

Many `[UFW BLOCK]` lines from one source address (`SRC`), to many different destination ports (`DPT`), all with the `SYN` flag, within a short time.

</details>

**5. The log shows only 11 lines for about a thousand blocked packets. Why?**

<details>
<summary>Answer</summary>

ufw limits its logging to a burst of 10 lines and then about 3 per minute, so a flood of packets cannot fill the disk. The log shows a sample of the scan, not every packet.

</details>

## Common mistakes

- **Scanning only from inside.** Loopback skips the firewall, so you see every listening service and learn nothing about the outside view. Scan from another machine or namespace too.
- **Trusting the SERVICE column.** It is a guess from the port number. Use `-sV` to ask the service itself.
- **Reading "filtered" as "safe".** A filtered port is hidden from this scanner, from this address. Another address that a rule allows may reach it.
- **Scanning a network you do not own "just to look".** It is noticed and may be a crime. Practice on your own lab, or on CTF platforms that invite it.
- **Scanning once and never again.** New services appear with new packages and new projects. Scan again after every change and compare with the list of what should be there.

## Key terms

- **Port scan**: sending connection attempts to many ports of a machine to find out which ones answer, and how.
- **nmap**: the Network Mapper, a free and open-source port scanner.
- **Open port**: a port where a service listens and answers.
- **Closed port**: a reachable port where nothing listens, so the machine refuses the connection.
- **Filtered port**: a port that gives no answer, usually because a firewall drops the packets.
- **SYN scan**: a scan that sends only the first packet of the TCP handshake and reads the answer, without finishing the connection.
- **Version detection**: asking each open service which program and version it runs, `nmap -sV`.

## Go further

- [Nmap Reference Guide](https://nmap.org/book/man.html): the official manual, including port states, scan types and version detection.
- [Nmap: Port Scanning Basics](https://nmap.org/book/man-port-scanning-basics.html): the official explanation of the six port states, of which this lesson used three.
- [picoCTF](https://picoctf.org/): free security challenges, many of which ask you to connect to a service and work out what it is. Follow its rules: attack the challenges, never the platform itself.
