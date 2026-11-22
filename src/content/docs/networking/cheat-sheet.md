---
title: "Cheat sheet: Networking"
description: The layers, addresses, ports, DNS records, HTTP codes and network tools of Module 6 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The layers

| TCP/IP layer | OSI number | Job | Address | Examples |
|---|---|---|---|---|
| Application | 7 (also 5, 6) | What the programs say | Names | HTTP, DNS, SSH |
| Transport | 4 | Right program, in order | Port | TCP, UDP |
| Internet | 3 | Right machine, across networks | IP address | IP, ICMP |
| Link | 2 (also 1) | Next device on the same network | MAC address | Ethernet, Wi-Fi |

Going down, each layer adds its header (encapsulation): frame ( packet ( segment ( data ) ) ).

## IPv4 addresses

| Prefix | Mask | Addresses | Usable hosts |
|---|---|---|---|
| `/8` | `255.0.0.0` | 16,777,216 | 16,777,214 |
| `/16` | `255.255.0.0` | 65,536 | 65,534 |
| `/24` | `255.255.255.0` | 256 | 254 |
| `/26` | `255.255.255.192` | 64 | 62 |
| `/28` | `255.255.255.240` | 16 | 14 |
| `/30` | `255.255.255.252` | 4 | 2 |

- Network address: all host bits 0. Broadcast address: all host bits 1. Usable: everything in between.
- Longer prefix, smaller network.
- Private: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. Loopback: `127.0.0.0/8`. Examples only: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`.
- IPv6: 128 bits, eight groups of hex digits. Drop leading zeros, one run of zero groups becomes `::`. Loopback `::1`, link-local `fe80::`.
- Python: `net = ipaddress.ip_interface("192.168.1.37/26").network`, then `net.netmask`, `net.broadcast_address`, `net.num_addresses`. Private or not: `ipaddress.ip_address("10.0.2.15").is_private`.

## Ports and transport

| Port | Service |
|---|---|
| 22/tcp | SSH |
| 53/udp and tcp | DNS |
| 80/tcp | HTTP |
| 443/tcp | HTTPS |

| | TCP | UDP |
|---|---|---|
| Connection | Handshake: SYN, SYN-ACK, ACK | None |
| Lost data | Sent again | Stays lost |
| Order | Kept | Not guaranteed |
| Use | Web, SSH, files | DNS lookups, calls, games |

Ports below 1024 need root (Linux default). Clients get an ephemeral port. `0.0.0.0` = every address of the machine, `127.0.0.1` = this machine only.

## DNS

| Record | Value |
|---|---|
| A / AAAA | IPv4 / IPv6 address |
| CNAME | Another name (alias) |
| MX | Mail server, with a priority |
| NS | Authoritative name servers |
| TXT | Free text (ownership proofs, mail rules) |

| Command | Shows |
|---|---|
| `dig name` | The full answer, with status, TTL and server |
| `dig +short name TYPE` | Only the values |
| `dig +noall +answer name` | Only the answer lines |
| `dig +short @SERVER name` | The answer of one chosen server |
| `getent hosts name` | What normal programs get (`/etc/hosts` first) |

`NXDOMAIN` = the name does not exist. TTL = seconds an answer may be cached.

## HTTP

| Code | Meaning | Examples |
|---|---|---|
| 2xx | Worked | 200 OK, 201 Created |
| 3xx | Look elsewhere (`Location`) | 301, 302 |
| 4xx | Client mistake | 400, 401, 403, 404 |
| 5xx | Server failed | 500, 501, 503 |

Methods: GET (fetch), HEAD (headers only), POST (send data), PUT (store), DELETE (remove). HTTPS = HTTP inside TLS, port 443.

| curl option | Does |
|---|---|
| `-i` / `-I` | Show headers / send HEAD |
| `-v` | Show the connection and both sides |
| `-L` | Follow redirects |
| `-d "a=b"` | Send a POST body |
| `-A "name"` | Set the User-Agent |
| `-s -o /dev/null -w "%{http_code}\n"` | Print only the status code |
| `-w "%{time_namelookup} %{time_connect} %{time_total}\n"` | Where the time goes |

Test server: `python3 -m http.server 8000 --bind 127.0.0.1 &`. Stop: `pkill -f http.server`.

## Your machine's settings

| Command | Shows |
|---|---|
| `ip -br link` | Interfaces and MAC addresses |
| `ip -br addr` | IP addresses and prefixes |
| `ip route` | Routing table, `default via` = gateway |
| `ip route get ADDRESS` | Which rule a packet would use |
| `ip neigh` | Neighbours and their MAC addresses |
| `resolvectl dns` | DNS resolver |
| `cat /proc/sys/net/ipv4/ip_forward` | `1` = this machine routes |

DHCP gives four settings: address, prefix, gateway, DNS. `169.254.x.x` = DHCP failed. NAT: the router swaps the private source address and port for its public address and a port it chooses, and remembers the pair.

## Troubleshooting, bottom up

| Question | Command |
|---|---|
| Address and route? | `ip -br addr`, `ip route` |
| Machine reachable? | `ping -c 3 ADDRESS` (no reply is not proof of "down") |
| Which path? | `traceroute -n HOST` (`* * *` = silent router) |
| Name resolves? | `getent hosts NAME`, `dig +short NAME` |
| Who listens? | `ss -tlnp` (TCP), `ss -uln` (UDP), `ss -tn` (open connections) |
| Port open? | `nc -zv HOST PORT` |
| Service answers? | `curl -i URL` |

| Error | Layer |
|---|---|
| `Could not resolve host`, `Name or service not known` | Name lookup |
| `Connection refused` | Transport: nothing listens on that port |
| `Address already in use` | Transport: another program owns the port |
| `404`, `501` | Application |

## Capturing traffic

| Command | Does |
|---|---|
| `sudo -v` then `sudo dumpcap -i lo -f "tcp port 8000" -w - > web.pcap 2> capture.log &` | Capture to a file you own |
| `sudo pkill -INT -x dumpcap` | Stop the capture cleanly |
| `tshark -r web.pcap` | The packet list |
| `tshark -r web.pcap -Y FILTER` | Only packets that match a display filter |
| `tshark -r web.pcap -T fields -e FIELD` | Only chosen fields |
| `tshark -r web.pcap -q -z follow,tcp,ascii,0` | The whole conversation as text |

| Capture filter (before) | Display filter (after) |
|---|---|
| `tcp port 8000` | `tcp.port == 8000` |
| `host 127.0.0.1` | `tcp.flags.syn == 1`, `http.request`, `urlencoded-form` |

Capture only your own traffic, on networks you own or may watch. Delete capture files when done.
