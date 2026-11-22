---
title: DNS
description: Follow the steps that turn a name such as example.com into an IP address, learn the main DNS record types, and look them up yourself with dig.
lesson: "6.4"
time: 20 min
sidebar:
  order: 4
---

You have visited thousands of websites and have probably never typed an IP address. Packets only travel to numbers, so something translates every name into an address before the first packet leaves, usually in a few milliseconds. When that something breaks, people say "the internet is down", even though every cable and every server works fine.

## Goal

After this lesson you can:

- Describe the steps that turn a name into an IP address.
- Read the common record types: A, AAAA, CNAME, MX, NS and TXT.
- Look up records with `dig` and understand the answer.

## Why it matters

Almost every network action starts with a name lookup, so a DNS problem looks like a problem with everything. Knowing how to check a name by hand saves hours of guessing. DNS also matters for security: whoever controls the answer controls where your traffic goes, and many attacks and many defences work at exactly this step. And the day you put your own project online, you will have to create DNS records yourself.

## The idea

**DNS**, the Domain Name System, is the directory of the internet: you give it a name, it gives you an address. It is like the contact list of your phone, where you tap a name and the phone dials the number. The big difference is that there is no single list. The directory is cut into pieces, and each owner of a name manages their own piece.

### Reading a name

A **domain name** is read from right to left, from the general to the specific:

```text
www . example . com .
 |       |       |  |
 |       |       |  root (usually not written)
 |       |       top-level domain (TLD)
 |       the domain someone registered
 a name inside that domain
```

### Who answers

Four kinds of servers take part in a lookup.

- The **resolver** does the work for you. Your computer sends it one question and waits for the final answer. Your internet provider runs one, and there are public ones.
- The **root servers** know only who is responsible for each top-level domain, such as `com` or `org`.
- The **TLD servers** know, for every domain under them, which name servers hold its records.
- The **authoritative name servers** of a domain hold the real records. Their answer is the official one.

<figure class="diagram">
<svg viewBox="0 0 560 250" role="img" aria-labelledby="dns-title dns-desc">
<title id="dns-title">A DNS lookup for www.example.com</title>
<desc id="dns-desc">On the left a box named Your computer is joined by a highlighted line to a box in the middle named Resolver. The line is labelled 1 and 5. From the resolver three lines go to three boxes on the right. The line labelled 2 goes to the Root server, the line labelled 3 goes to the .com server, and the line labelled 4 goes to the example.com name server.</desc>
<path class="d-line" d="M345 110 L410 44 M345 122 H410 M345 134 L410 200"/>
<path class="d-line d-hot" d="M150 122 H215"/>
<rect class="d-box d-hot" x="20" y="100" width="130" height="44"/>
<rect class="d-box d-hot" x="215" y="100" width="130" height="44"/>
<rect class="d-box" x="410" y="20" width="140" height="44"/>
<rect class="d-box" x="410" y="100" width="140" height="44"/>
<rect class="d-box" x="410" y="180" width="140" height="44"/>
<text x="85" y="127">Your computer</text>
<text x="280" y="127">Resolver</text>
<text x="480" y="47">Root server</text>
<text x="480" y="127">.com server</text>
<text x="480" y="207">example.com server</text>
<text x="182" y="112">1, 5</text>
<text x="368" y="68">2</text>
<text x="378" y="114">3</text>
<text x="368" y="184">4</text>
</svg>
<figcaption>Your computer asks one question. The resolver asks three more on its behalf.</figcaption>
</figure>

Here is the lookup for `www.example.com`:

1. Your computer asks the resolver: "What is the address of `www.example.com`?"
2. The resolver asks a root server, which answers: "I do not know, but here are the servers for `com`."
3. The resolver asks a `com` server, which answers: "Here are the name servers of `example.com`."
4. The resolver asks one of those. It is authoritative, so it gives the address.
5. The resolver sends the address back to your computer.

That would be slow if it happened every time, so every answer comes with a **TTL** (time to live): the number of seconds it may be kept in a **cache**, a local store of recent answers. The resolver, your operating system and your browser all cache. Most lookups are answered from memory and never reach step 2.

A normal lookup is one small question and one small answer, so DNS uses UDP, on port 53.

### Records

What a name server stores are **records**. Each record has a name, a type and a value.

| Type | What the value is | Example |
|---|---|---|
| A | The IPv4 address of the name | `example.com` → `104.20.23.154` |
| AAAA | The IPv6 address of the name | `example.com` → `2606:4700:10::6814:179a` |
| CNAME | Another name: "this name is an alias of that one" | `www.python.org` → `dualstack.python.map.fastly.net` |
| MX | The mail server that accepts email for the domain | `python.org` → `mail.python.org` |
| NS | The authoritative name servers of the domain | `example.com` → `hera.ns.cloudflare.com` |
| TXT | Free text, used to prove ownership and to publish mail rules | `"v=spf1 -all"` |

## Try it

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
pkill -f http.server
sudo sed -i '/mylab.test/d; /notes.test/d' /etc/hosts
-->

`dig` asks DNS questions and shows the full answer. If your system says `command not found`, install it with `sudo apt install -y bind9-dnsutils`. The addresses and TTL values below change over time, so yours will differ.

### 1. Ask your first question

<!-- lab: nocheck -->
```bash
dig example.com
```

```output
; <<>> DiG 9.18.39-0ubuntu0.24.04.8-Ubuntu <<>> example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4442
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;example.com.                   IN      A

;; ANSWER SECTION:
example.com.            40      IN      A       172.66.147.243
example.com.            40      IN      A       104.20.23.154

;; Query time: 12 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)
;; WHEN: Sat Nov 21 18:47:30 UTC 2026
;; MSG SIZE  rcvd: 72
```

It looks like a lot, so read it in this order:

- `status: NOERROR` in the header: the question was answered without a problem.
- `QUESTION SECTION`: what was asked. `A` is the record type, and it is the default.
- `ANSWER SECTION`: one line per record. From left to right: the name, the TTL in seconds, `IN` for "internet", the type, and the value.
- `SERVER`: who answered. `127.0.0.53` is a small resolver that Ubuntu runs on your own machine. It passes the question on to the resolver of your network.

This name has two A records. That is normal: big sites publish several addresses, and clients pick one.

### 2. Keep only the answer

<!-- lab: nocheck -->
```bash
dig +short example.com
```

```output
104.20.23.154
172.66.147.243
```

`+short` prints only the values. Use it when you just want the address, and the long form when something is wrong and you need the details.

### 3. Ask for other record types

Put the type after the name.

<!-- lab: nocheck -->
```bash
dig +short example.com AAAA
```

```output
2606:4700:10::6814:179a
2606:4700:10::ac42:93f3
```

The AAAA records are the IPv6 addresses of the same name. If a line such as `communications error ... timed out` appears before the answer, one question was lost on the way and `dig` simply asked again. DNS questions travel over UDP, and lesson 6.3 showed that UDP makes no promises.

<!-- lab: nocheck -->
```bash
dig +short example.com NS
```

```output
hera.ns.cloudflare.com.
elliott.ns.cloudflare.com.
```

These are the authoritative name servers of `example.com`: the machines that hold its real records. A name written with a dot at the end is complete, down to the root.

<!-- lab: nocheck -->
```bash
dig +short python.org MX
```

```output
50 mail.python.org.
```

Mail for an address such as `someone@python.org` goes to this server. The number in front is a priority: when a domain has several mail servers, the lowest number is tried first.

<!-- lab: nocheck -->
```bash
dig +short example.com TXT
```

```output
"v=spf1 -all"
"_k2n1y4vw3qtb4skdx9e7dxt97qrmmq9"
```

TXT records hold free text. The line that starts with `v=spf1` is a mail rule: it lists who may send email in the name of the domain. Here, `-all` means "nobody". The other line is a verification code: by publishing it, the owner proved to some service that the domain is theirs.

### 4. Follow an alias

<!-- lab: nocheck -->
```bash
dig +noall +answer www.python.org
```

```output
www.python.org.         507373  IN      CNAME   dualstack.python.map.fastly.net.
dualstack.python.map.fastly.net. 13 IN  A       151.101.0.223
dualstack.python.map.fastly.net. 13 IN  A       151.101.64.223
dualstack.python.map.fastly.net. 13 IN  A       151.101.128.223
dualstack.python.map.fastly.net. 13 IN  A       151.101.192.223
```

`+noall +answer` prints only the answer section, with all its columns. The first line is a CNAME record: `www.python.org` is only an alias. The resolver followed it for you and added the A records of the real name. Website owners use this to point their name at a company that hosts the site.

### 5. Watch the cache count down

<!-- lab: nocheck -->
```bash
dig +noall +answer example.com
sleep 3
dig +noall +answer example.com
```

```output
example.com.            38      IN      A       172.66.147.243
example.com.            38      IN      A       104.20.23.154
example.com.            34      IN      A       172.66.147.243
example.com.            34      IN      A       104.20.23.154
```

Look at the second column. The TTL went down by a few seconds between the two questions, because both answers came from a cache that is counting down. When it reaches 0, the next question triggers a fresh lookup.

### 6. Ask for a name that does not exist

<!-- lab: nocheck -->
```bash
dig no-such-machine.test | grep status
```

```output
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 795
```

`NXDOMAIN` means "non-existent domain". DNS worked, and its answer is that the name does not exist. This is the lookup failure behind `Could not resolve host` in lesson 6.1.

### 7. Override DNS on your own machine

Before your computer asks any resolver, it reads a small local file.

```bash
grep localhost /etc/hosts
```

```output
127.0.0.1 localhost
::1 ip6-localhost ip6-loopback
```

`/etc/hosts` is a list of addresses and names. This is why `localhost` works with no network at all. Add a name of your own:

```bash
echo "127.0.0.1 mylab.test" | sudo tee -a /etc/hosts
```

```output
127.0.0.1 mylab.test
```

`sudo tee -a` appends the line to a file that only root may change. Now ask the system the way a normal program does:

```bash
getent hosts mylab.test
```

```output
127.0.0.1       mylab.test
```

`getent hosts` uses the same lookup as browsers, `curl` and `ping`: the hosts file first, then DNS. Now ask a real DNS server. First find out which resolver your machine uses:

<!-- lab: nocheck -->
```bash
resolvectl dns
```

```output
Global:
Link 2 (enp0s2): 10.0.2.3
```

Here it is `10.0.2.3`, the resolver of this machine's network. Yours is different. If `resolvectl` is missing, as on some WSL setups, look at the `nameserver` line of `/etc/resolv.conf`. Put your own address after the `@`:

```bash
dig +short @10.0.2.3 mylab.test
```

`@` tells `dig` which server to ask. This time it prints nothing. `dig` never reads the hosts file: it only sends a question to a DNS server, and that server has never heard of `mylab.test`. The name exists in one file on your machine and nowhere else.

:::note[Without the @]
A plain `dig mylab.test` asks the small helper at `127.0.0.53` that you saw in step 1. On Ubuntu that helper reads `/etc/hosts` too, so after a second or two it answers with the name as an alias of `localhost`. The helper is part of your own machine, not of DNS on the internet.
:::

Clean up by deleting the line you added:

```bash
sudo sed -i '/mylab.test/d' /etc/hosts
```

`sed -i '/text/d' file` deletes every line of the file that contains the text.

:::caution[The hosts file wins]
An entry in `/etc/hosts` overrides DNS for every program on the machine. That is handy for testing, and it is also a classic malware trick: add one line and send a victim's banking site to another address. If a name behaves strangely on one computer only, look at this file.
:::

## Exercise

1. Find the IPv4 addresses of `python.org` and the name servers that are authoritative for it.
2. `docs.python.org` is an alias. Of which name?
3. Make the name `notes.test` point to your own machine. Start the Python web server from lesson 6.1 in `~/netlab` on port 8000, and request `http://notes.test:8000/` with `curl -I`. Then stop the server and remove the name again.

<details>
<summary>Show the solution</summary>

<!-- lab: nocheck -->
```bash
dig +short python.org
dig +short python.org NS
```

```output
151.101.192.223
151.101.64.223
151.101.0.223
151.101.128.223
ns-2046.awsdns-63.co.uk.
ns-1134.awsdns-13.org.
ns-484.awsdns-60.com.
ns-981.awsdns-58.net.
```

The first four lines are the A records, the next four are the NS records.

<!-- lab: nocheck -->
```bash
dig +short docs.python.org CNAME
```

```output
dualstack.python.map.fastly.net.
```

For the last task:

```bash
echo "127.0.0.1 notes.test" | sudo tee -a /etc/hosts
mkdir -p ~/netlab
cd ~/netlab
python3 -m http.server 8000 > server.log 2>&1 &
```

```output
127.0.0.1 notes.test
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
curl -I http://notes.test:8000/
```

```output
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.12.3
Date: Sat, 21 Nov 2026 18:47:44 GMT
Content-type: text/html; charset=utf-8
Content-Length: 232
```

```bash
pkill -f http.server
sudo sed -i '/notes.test/d' /etc/hosts
```

`curl -I` asks only for the first lines of the answer. `200 OK` proves that the name led to your own server. The name exists only on your machine: nobody else in the world can resolve `notes.test`.

</details>

## Check yourself

**1. What is the job of the resolver?**

<details>
<summary>Answer</summary>

It receives one question from your computer and does the whole lookup for it: it asks a root server, a TLD server and an authoritative name server, then returns the final answer. It also caches answers so that it does not have to ask again.

</details>

**2. What does the TTL of a record tell you?**

<details>
<summary>Answer</summary>

How many seconds the answer may be kept in a cache before it has to be looked up again.

</details>

**3. Which record type would you look up to find the mail server of a domain? And its IPv6 address?**

<details>
<summary>Answer</summary>

MX for the mail server, AAAA for the IPv6 address.

</details>

**4. `getent hosts mylab.test` gives an address, but `dig +short @10.0.2.3 mylab.test` prints nothing. How is that possible?**

<details>
<summary>Answer</summary>

The name is in `/etc/hosts`. `getent hosts` reads that file first, as normal programs do. `dig` only asks the DNS server you name after `@`, and that server does not know the name.

</details>

**5. A lookup returns `status: NXDOMAIN`. Is DNS broken?**

<details>
<summary>Answer</summary>

No. DNS answered correctly, and the answer is that the name does not exist. Check the spelling of the name.

</details>

## Common mistakes

- **Blaming the website when the name is wrong.** `Could not resolve host` means no address was found. No server was contacted. Check the name with `dig +short` first.
- **Changing a record and expecting the world to see it at once.** Caches keep the old answer until its TTL runs out. Wait, or lower the TTL before a planned change.
- **Trusting `dig` to show what your programs see.** `dig` never reads `/etc/hosts` itself, and its answer depends on which server it asks. Use `getent hosts name` to see what a normal program gets.
- **Forgetting to remove test lines from `/etc/hosts`.** Months later the name mysteriously points to the wrong place. Clean up right after the test.
- **Mixing up CNAME and A.** An A record holds an address. A CNAME holds another name, which then has to be looked up too.

## Key terms

- **DNS**: the Domain Name System, the distributed directory that turns names into IP addresses and other records.
- **Domain name**: a name such as `www.example.com`, read from right to left: root, top-level domain, domain, then names inside it.
- **Resolver**: the server that performs the whole lookup on behalf of your computer and caches the results.
- **Authoritative name server**: a server that holds the official records of a domain.
- **Record**: one entry in DNS, with a name, a type and a value.
- **A record**: maps a name to an IPv4 address. An AAAA record maps a name to an IPv6 address.
- **CNAME record**: says that a name is an alias of another name.
- **MX record**: names the mail server that accepts email for a domain.
- **NS record**: names an authoritative name server of a domain.
- **TXT record**: holds free text, often used to prove ownership of a domain or to publish mail rules.
- **TTL**: time to live, the number of seconds a DNS answer may be cached.
- **Cache**: a local store of recent answers, used to avoid asking the same question again.
- **NXDOMAIN**: the DNS answer that means the name does not exist.

## Go further

- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034): the original design of DNS. Sections 2 and 3 are readable and still accurate.
- [IANA: Root Servers](https://www.iana.org/domains/root/servers): the list of the 13 root server names and who runs them.
- [dig manual page](https://manpages.ubuntu.com/manpages/noble/man1/dig.1.html): every option of `dig`, including `+trace`, which shows each step of a lookup from the root down.
