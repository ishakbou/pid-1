---
title: The OWASP Top 10 explained
description: What the OWASP Top 10 is, what each of its ten risks means in plain English, and how to use the list to name the flaws you find in a small practice app.
lesson: "12.1"
time: 20 min
sidebar:
  order: 1
---

Ask ten web developers what the most common security flaws are, and you get ten different lists. Ask them about "the OWASP Top 10", and most of them nod: it is the one list that almost everyone in the field knows. Job ads mention it, security tools label their findings with it, and interviews ask about it. In this lesson you learn to read it, and then you use it on a small shop with four flaws.

## Goal

After this lesson you can:

- Explain what the OWASP Top 10 is, and what it is not.
- Say in one plain sentence what each of the ten risks means.
- Find flaws in a small app with curl, and name their Top 10 category.

## Why it matters

When you report a flaw, people need to understand it fast. "A01, broken access control: any user can read any order" is understood at once by a developer, a manager and a scanner. The list also tells you where to look first: its categories are built from data about flaws found in a very large number of real applications, so they are the problems you are most likely to meet.

## The idea

**OWASP**, the Open Worldwide Application Security Project, is a non-profit foundation that publishes free material about software security: guides, cheat sheets, tools such as Juice Shop, and the **OWASP Top 10**, a ranked list of the ten most critical risks for web applications. A new edition comes out every few years. At the time of writing, the newest one is the Top 10:2025.

Each entry is a **category**, not a single bug. A category groups many specific weakness types, each of which has a number in **CWE** (Common Weakness Enumeration), a public catalogue of software weakness types. For example, CWE-89 is SQL injection, and it belongs to the category A05 Injection, together with XSS and command injection. The ranking mixes data about how often flaws were found with a survey of people who work in the field.

| ID | Category | In plain English |
|---|---|---|
| A01 | Broken Access Control | Users can reach data or functions that are not theirs |
| A02 | Security Misconfiguration | A setting is unsafe, missing or left at its default |
| A03 | Software Supply Chain Failures | A library, tool or update you depend on is flawed or tampered with |
| A04 | Cryptographic Failures | Data is not protected well: no encryption, weak algorithms, plain passwords |
| A05 | Injection | User input is read as code: SQL, HTML (XSS), shell commands |
| A06 | Insecure Design | The plan itself has no defense, so even perfect code is unsafe |
| A07 | Authentication Failures | Logins can be guessed, skipped or faked |
| A08 | Software or Data Integrity Failures | Code or data is trusted without checking that it was not changed |
| A09 | Security Logging and Alerting Failures | Attacks happen and nobody notices |
| A10 | Mishandling of Exceptional Conditions | Errors and unusual cases are handled badly, and leak or break things |

Think of the list as the "most common causes of fires" poster in a fire station. It does not tell you how to build a safe house, and a house can burn for a reason that is not on it. But if you check the ten causes on the poster, you have dealt with most of the real fires. For a full checklist, OWASP has a separate standard, the ASVS (Application Security Verification Standard).

Every category page on the OWASP site has the same parts: a description, how to prevent it, example attack scenarios, and the list of CWEs it groups. "How to prevent" is the part you will use most.

You have met several of these already. Your `mylab` stores salted, slow hashes since Module 10, which avoids an A04 failure. Its delete route checks the owner since Module 8, which avoids A01. This module covers A01, A02 and A05 in depth, and Module 13 covers A09.

## Try it

You run a tiny shop API built only from the Python standard library, on your own computer, and look for its flaws from the outside, with curl. Every flaw in it was put there on purpose.

### 1. Write the shop

```bash
mkdir -p ~/websec
cd ~/websec
```

```python title="shop.py"
"""A tiny shop API with flaws planted on purpose. For lesson 12.1 only, on 127.0.0.1."""
import json
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer

USERS = {"sam": "summer2026", "alex": "letmein"}
ORDERS = {
    1: {"customer": "sam", "item": "USB cable"},
    2: {"customer": "alex", "item": "Laptop stand"},
}


class Shop(BaseHTTPRequestHandler):
    def send(self, status, text):
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(text.encode())

    def do_GET(self):
        user = self.headers.get("X-User")  # who is asking?
        if user not in USERS:
            self.send(401, "log in first\n")
            return
        try:
            if self.path == "/users":
                self.send(200, json.dumps(USERS) + "\n")
            elif self.path.startswith("/orders/"):
                order = ORDERS[int(self.path.split("/")[2])]
                self.send(200, json.dumps(order) + "\n")
            else:
                self.send(404, "not found\n")
        except Exception:
            self.send(500, traceback.format_exc())

    def log_message(self, *args):
        pass  # keep the terminal quiet


HTTPServer(("127.0.0.1", 8080), Shop).serve_forever()
```

`BaseHTTPRequestHandler`, which you used for the server of the Module 6 project step, calls `do_GET` for every GET request. The shop decides who you are from a header called `X-User`, and answers in plain text.

```bash
python3 shop.py &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8080 ' && break; sleep 0.2; done
-->

### 2. Use it as intended

```bash
curl -s http://127.0.0.1:8080/orders/1
curl -s -H "X-User: sam" http://127.0.0.1:8080/orders/1
```

```output
log in first
{"customer": "sam", "item": "USB cable"}
```

`-H` adds a header to the request. Without `X-User`, the shop refuses; with it, sam sees his order. So far it looks fine.

### 3. Ask for someone else's order

```bash
curl -s -H "X-User: sam" http://127.0.0.1:8080/orders/2
```

```output
{"customer": "alex", "item": "Laptop stand"}
```

Order 2 is alex's, and the shop handed it to sam. It checked that sam is a known user, but never that the order is his. That is **A01 Broken Access Control**, and lesson 12.4 is about it.

### 4. Claim to be someone else

```bash
curl -s -H "X-User: alex" http://127.0.0.1:8080/orders/2
```

```output
{"customer": "alex", "item": "Laptop stand"}
```

Look at how the shop decided who you are. Nobody typed a password: the shop believed a header, and the client writes every header, as you saw in lesson 8.4. Anyone who sends `X-User: alex` is alex for the shop. A login that can be skipped by claiming a name is **A07 Authentication Failures**.

### 5. Find a page that is not linked anywhere

```bash
curl -s -H "X-User: alex" http://127.0.0.1:8080/users
```

```output
{"sam": "summer2026", "alex": "letmein"}
```

Nothing links to `/users`, but guessing common paths is the first thing an attacker tries. Two failures meet here. Any user may call the page, which is A01 again. And the passwords are stored as plain text, which is **A04 Cryptographic Failures**: if anyone ever reads this data, every account is lost, as in your `mylab` before Module 10.

### 6. Send something unexpected

```bash
curl -s -H "X-User: sam" http://127.0.0.1:8080/orders/abc | grep -E "File|Error"
```

```output
  File "/home/sam/websec/shop.py", line 29, in do_GET
ValueError: invalid literal for int() with base 10: 'abc'
```

The shop did not expect a word where a number belongs. It crashed, and then sent the whole Python traceback to the visitor: the path of the program on disk, the line number and the code. That is **A10 Mishandling of Exceptional Conditions**: the unusual case was not handled, and the error handling itself leaked information. Turning off detailed errors is also part of A02, as lesson 12.5 shows.

```bash
pkill -f shop.py
```

### 7. Write down what you found

A finding is only useful when someone else can act on it. Keep a short list, one line per flaw:

```text title="shop-findings.txt"
A01 Broken Access Control: any user can read any order (/orders/2 as sam)
A01 Broken Access Control: any user can read /users
A04 Cryptographic Failures: passwords stored in plain text (/users)
A07 Authentication Failures: identity taken from the X-User header, no password
A10 Mishandling of Exceptional Conditions: /orders/abc sends a full traceback
```

```bash
cut -d: -f1 shop-findings.txt | sort | uniq -c
```

```output
      2 A01 Broken Access Control
      1 A04 Cryptographic Failures
      1 A07 Authentication Failures
      1 A10 Mishandling of Exceptional Conditions
```

`cut -d: -f1` keeps the part before the first colon, and `sort | uniq -c` counts each category, as in Module 1. Five findings in four categories, from a program that fits on one screen. Real reports look like this: what, where, and how to see it again.

:::note[Only your own apps]
Everything you did here, such as guessing a path or changing a number in a URL, is an attack when you do it to a site that is not yours. Do it only on your own apps, on the lab machine, and on practice targets made for it, such as Juice Shop and PortSwigger's labs in lesson 12.6.
:::

## Exercise

Name the Top 10 category of each finding. Some could fit two categories; give the best one and say why.

1. A web shop's admin panel still accepts the login `admin` with the password `admin`.
2. A page builds an SQL query from the search box with an f-string.
3. A site loads a JavaScript library from another company's server, and that server was hacked and now serves a changed file.
4. A bank shows every customer's statement to anyone who changes the number in `/statements/1041`.
5. After 10,000 failed logins in one hour, nobody at the company knows.
6. A password reset sends the new password by email in plain text, and the app has no way to make a user change it.

<details>
<summary>Show the solution</summary>

1. **A02 Security Misconfiguration**: a default password that was never changed. It is also an authentication weakness (A07), but the cause is the default setting.
2. **A05 Injection**: user input becomes part of the SQL.
3. **A03 Software Supply Chain Failures**: something the site depends on was tampered with. A08 Software or Data Integrity Failures fits too, because the site ran code without checking that it was unchanged; OWASP's 2025 list puts dependencies like this under A03.
4. **A01 Broken Access Control**: an insecure direct object reference, the subject of lesson 12.4.
5. **A09 Security Logging and Alerting Failures**: the attack may be logged, but no alert reaches a person.
6. **A06 Insecure Design**: the reset process itself is unsafe, however well its code is written. Sending a password in plain text is also A04.

If you put one in a neighbouring category with a good reason, that is fine: the categories overlap, and the point is to describe the flaw so that others understand it.

</details>

## Check yourself

**1. Is the OWASP Top 10 a complete checklist for a secure web app?**

<details>
<summary>Answer</summary>

No. It is an awareness list of the most common and critical risk categories. An app can avoid all ten and still have other flaws. For a full checklist, OWASP publishes the ASVS.

</details>

**2. What is the difference between a Top 10 category and a CWE?**

<details>
<summary>Answer</summary>

A CWE is one specific type of weakness, such as CWE-89, SQL injection. A Top 10 category groups many related CWEs, such as A05 Injection.

</details>

**3. In which category is cross-site scripting?**

<details>
<summary>Answer</summary>

A05 Injection, because the user's text is read as HTML or JavaScript by the browser.

</details>

**4. The shop crashed on `/orders/abc` and sent its traceback. Name the category, and one thing it revealed.**

<details>
<summary>Answer</summary>

A10 Mishandling of Exceptional Conditions. It revealed the path of the program on disk (`/home/sam/websec/shop.py`), the line number and the code that failed.

</details>

**5. Which category is number one in the Top 10:2025?**

<details>
<summary>Answer</summary>

A01 Broken Access Control.

</details>

## Common mistakes

- **Treating the list as a ranking of bugs to fix in order.** It ranks categories across many apps. In your app, the worst risk is the one that would hurt it most, as your threat model from Module 9 says.
- **Learning only the names.** "A05" means nothing to a developer who has not seen it. Learn one concrete example for each category.
- **Quoting an old edition.** The numbers change between editions: injection was A03 in 2021 and is A05 in 2025. Say which edition you mean.
- **Believing a scanner that says "no OWASP Top 10 issues".** Tools find some kinds, such as missing headers, well, and others, such as broken access control or insecure design, badly. They need a person who understands the app.

## Key terms

- **OWASP**: the Open Worldwide Application Security Project, a non-profit foundation that publishes free software security material.
- **OWASP Top 10**: OWASP's ranked list of the ten most critical risk categories for web applications.
- **CWE**: Common Weakness Enumeration, a public catalogue that gives each type of software weakness a number.
- **Finding**: one flaw found in a review or a test, written down with what it is, where it is and how to see it.

## Go further

- [OWASP Top 10:2025](https://top10.owasp.org/2025/): the official list, with a page for each category, its causes and how to prevent it.
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/): the full checklist that goes beyond the ten categories.
- [MITRE: CWE](https://cwe.mitre.org/): the catalogue of weakness types, where you can look up any CWE number.
