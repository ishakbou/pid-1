---
title: "Module 6: Networking"
description: How data travels from one program to another across networks, through IP, TCP, DNS and HTTP, and the tools to watch it happen.
module: 6
sidebar:
  order: 0
  label: Overview
---

Every time you open a web page, your computer finds an address for a name, opens a connection, sends a few lines of text and reads the answer, often through a dozen machines owned by different companies. This module takes that trip apart, one layer at a time. You will not just read about packets: you will start servers on your own machine, talk to them by hand, and record the packets to read them one by one.

## What you will learn

- Why networking is split into layers, and what each layer of the TCP/IP model does.
- How to read an IPv4 address with its mask, work out a network range, and recognise IPv6.
- What ports are, how TCP opens a connection, and when UDP is the better choice.
- How DNS turns a name into an address, and how to look up records with `dig`.
- How HTTP requests and responses are built, and what HTTPS adds.
- How your machine gets its settings from DHCP, and how routing and NAT get packets out of your home.
- Which tool answers which question: `ping`, `traceroute`, `dig`, `ss`, `nc` and `curl`.
- How to capture your own traffic and read it in Wireshark or `tshark`.

## Before you start

You need the terminal skills of [Module 1](../linux/): moving around, `sudo`, installing packages with apt, pipes and `grep`, and running a command in the background with `&`. Some steps use short Python programs, so [Module 3](../python/) should be behind you. Binary and hexadecimal from [Module 5](../computers/) help in lesson 6.2, where IP addresses are taken apart bit by bit.

Every command in this module runs on your own machine and talks only to your own machine, except a few name lookups and one optional `traceroute`. You need Ubuntu (on WSL, in Codespaces or installed) with an internet connection for installing a few packages.

## Time

9 lessons, about 3 hours 30 minutes of reading and practice.

## Module map

```mindmap
Networking
  Layers
    TCP/IP model
    OSI numbers
    encapsulation
  Addresses and routes
    IPv4 and masks
    IPv6
    DHCP
    routing table
    NAT
  Transport
    ports
    TCP handshake
    UDP datagrams
  Services
    DNS records
    HTTP requests
    status codes
    HTTPS
  Seeing traffic
    ping and traceroute
    ss and nc
    curl and dig
    Wireshark captures
    mylab server
```

## Lessons

1. 6.1 [The OSI and TCP/IP models](../networking/the-osi-and-tcp-ip-models/): layers as a way to split a hard problem. Follow one web request down and up the stack.
2. 6.2 [IP addresses and subnetting](../networking/ip-addresses-and-subnetting/): read IPv4 addresses and masks, work out a network range, and meet IPv6.
3. 6.3 [TCP vs UDP and ports](../networking/tcp-vs-udp-and-ports/): reliable versus fast delivery, the three-way handshake, and what a port number is for.
4. 6.4 [DNS](../networking/dns/): how a name becomes an address, the main record types, and lookups with dig.
5. 6.5 [HTTP and HTTPS](../networking/http-and-https/): requests, responses, methods, status codes and headers, seen with curl.
6. 6.6 [DHCP, NAT and routing basics](../networking/dhcp-nat-and-routing-basics/): how your laptop gets an address, and how packets leave your home network.
7. 6.7 [Network tools](../networking/network-tools/): ping, traceroute, curl, dig and ss: what each one tells you and when to use it.
8. 6.8 [Reading traffic with Wireshark](../networking/reading-traffic-with-wireshark/): capture your own traffic and read a TCP handshake and an HTTP request.
9. 6.9 [Project step: a tiny web server in mylab](../networking/project/): serve a page from mylab with Python and watch the request arrive.

## Project step

Until now `mylab` held scripts, notes and tools that you run yourself. In this step it gets its first program that other programs talk to: `app/server.py`, a small web server built only from the Python standard library. It answers a page, a `/health` check and a 404 for everything else, listens on `127.0.0.1` only, and writes one log line per request, so you can watch each request arrive. You commit it to the repository, and Modules 7 and 8 build the database and the full web app next to it.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Networking](../networking/cheat-sheet/).
