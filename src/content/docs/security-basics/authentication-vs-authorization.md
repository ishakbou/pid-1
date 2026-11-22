---
title: Authentication vs authorization
description: Separate proving who you are from deciding what you may do, and learn how passwords, multi-factor authentication and least privilege fit together.
lesson: "9.4"
time: 20 min
sidebar:
  order: 4
---

Log in to Linux with the right password, then ask to read the file where passwords are kept. The answer is `Permission denied`. Nothing is broken. The system knows exactly who you are, and it still says no. Two separate questions were asked, and you passed only the first.

## Goal

After this lesson you can:

- Explain the difference between authentication and authorization, with an example of each failing.
- Choose strong passwords and say what makes a login multi-factor.
- Apply least privilege to users, roles and files.

## Why it matters

Many real break-ins need no clever trick. Either someone logged in with a password that was guessed or leaked (authentication failed), or a normal user could reach something meant for admins (authorization failed). When you build or test an app, you check the two separately, because a perfect login page does not help if every logged-in user can open every page.

## The idea

**Authentication** answers "who are you?". You make a claim (a username) and you prove it (a password, for example).

**Authorization** answers "what may you do?". It happens after authentication, and it happens again for every action.

A hotel shows both. At the front desk you show your passport and your booking. That is authentication, and it happens once. You get a key card. The card opens your room and the gym, and it does not open the other rooms or the staff office. That is authorization, and the door checks it every single time.

The two words look alike, so people shorten them to **authn** and **authz**.

| | Authentication | Authorization |
|---|---|---|
| Question | Who are you? | What may you do? |
| When | At login | On every action |
| Typical tools | Passwords, codes, security keys | Permissions, roles, ownership |
| On the web, when it fails | Status `401` | Status `403` |

You met status codes in [lesson 6.5](../networking/http-and-https/). `401` means "I do not know who you are, log in first". `403` means "I understood the request, and you may not do this".

### Proving who you are

There are three kinds of proof, called **factors**:

- Something you **know**: a password, a PIN.
- Something you **have**: your phone, a bank card, a security key.
- Something you **are**: a fingerprint, your face.

**Multi-factor authentication** (MFA) asks for two or more factors of different kinds. A password plus a code from an app on your phone is MFA. A password plus a "secret question" is not: both are things you know, and both can be stolen in the same way.

MFA matters because passwords leak. With MFA, a stolen password alone no longer opens the account. Codes from an app are better than codes sent by SMS, and a physical security key is the strongest common choice.

### Passwords that hold

Three habits do most of the work:

1. **Long.** Length makes guessing harder much faster than symbols do. Four or five random words make a good password.
2. **Unique.** Sites get breached, and attackers then try each leaked email and password pair on other sites. This is called **credential stuffing**. A password used in one place can only be lost in one place.
3. **In a password manager.** Nobody can remember fifty long, unique passwords. A **password manager** stores them, encrypted, behind one strong password.

### Giving out as little as possible

The rule for authorization is **least privilege**: every user and every program gets only the access it needs for its job, and nothing more. A backup program needs to read your files, not to delete them. A person who writes blog posts does not need to manage users.

Least privilege limits damage. When an account is stolen or a program has a bug, the attacker gets what that account could do, and no more.

## Try it

Wherever you see `sam` in an output, your screen shows your own username.

### 1. See who the system thinks you are

```bash
mkdir ~/access
cd ~/access
whoami
id
```

```output
sam
uid=1000(sam) gid=1000(sam) groups=1000(sam)
```

You authenticated when you logged in, and this is the result: a user name, a user number and a list of groups. Your `groups` list is probably longer. Every later decision uses this identity.

### 2. Run into authorization

```bash
cat /etc/shadow
```

```output
cat: /etc/shadow: Permission denied
```

`/etc/shadow` holds the stored passwords of all users, in a scrambled form that [Module 10](../cryptography/) explains. Linux did not ask who you are again. It already knows, and that is exactly why it refuses.

```bash
stat -c '%A %U %G %n' /etc/shadow
```

```output
-rw-r----- root shadow /etc/shadow
```

Here is the rule that was applied. `%U` and `%G` print the owner and the group. The owner `root` may read and write, the group `shadow` may read, and everyone else gets `---`: nothing. You are "everyone else". That is least privilege in one line.

### 3. Count the guesses

```python
print(26 ** 8)
print(62 ** 8)
print(26 ** 16)
```

```output
208827064576
218340105584896
43608742899428874059776
```

Each line counts how many passwords exist of one shape. The first: 8 lowercase letters, about 209 billion. The second: 8 characters from lowercase, uppercase and digits, which is about a thousand times more. The third: 16 lowercase letters, which is about 200 million times more than the second. Doubling the length beat adding character types by a very wide margin.

### 4. Model a login and a permission check

This small program keeps the two questions in two functions.

```python title="access.py"
USERS = {
    "amina": {"password": "seven green bikes fly", "role": "admin"},
    "karim": {"password": "sunny-day-42", "role": "reader"},
}

PERMISSIONS = {
    "admin": {"read notes", "delete notes"},
    "reader": {"read notes"},
}


def authenticate(name, password):
    user = USERS.get(name)
    return user is not None and user["password"] == password


def authorize(name, action):
    role = USERS[name]["role"]
    return action in PERMISSIONS[role]


def request(name, password, action):
    if not authenticate(name, password):
        return "401: who are you?"
    if not authorize(name, action):
        return "403: I know who you are, and the answer is no"
    return "200: done"


print(request("karim", "wrong guess", "read notes"))
print(request("karim", "sunny-day-42", "read notes"))
print(request("karim", "sunny-day-42", "delete notes"))
print(request("amina", "seven green bikes fly", "delete notes"))
```

```bash
python3 access.py
```

```output
401: who are you?
200: done
403: I know who you are, and the answer is no
200: done
```

Line one fails at authentication: wrong password, so the program never looks at permissions. Line three passes authentication and fails at authorization: Karim is who he says he is, and a reader may not delete. Users do not get permissions directly. Each user has a **role**, and the role has the permissions, which keeps the rules short and easy to check.

:::caution[Only a model]
This program compares passwords stored as plain text, which a real app must never do. [Module 10](../cryptography/) shows the right way, and you will apply it to `mylab`.
:::

## Exercise

Apply least privilege to three files. Work in `~/access`.

1. Create three empty files: `diary.txt`, `shared.txt` and `run.sh`.
2. Give each one the smallest permissions that still let it do its job:
   - `diary.txt`: only you read and write it.
   - `shared.txt`: you read and write it, your group reads it, others get nothing.
   - `run.sh`: only you read, write and run it.
3. Show the three results with one `stat` command.

<details>
<summary>Show the solution</summary>

```bash
touch diary.txt shared.txt run.sh
chmod 600 diary.txt
chmod 640 shared.txt
chmod 700 run.sh
stat -c '%A %n' diary.txt shared.txt run.sh
```

```output
-rw------- diary.txt
-rw-r----- shared.txt
-rwx------ run.sh
```

Each digit is one group of three: owner, group, others. Read is 4, write is 2, run is 1, so 6 is read and write, 7 is all three, and 0 is nothing. `shared.txt` now has the same permissions as `/etc/shadow`.

</details>

## Check yourself

**1. A site asks for your password and then for the name of your first pet. Is that multi-factor authentication?**

<details>
<summary>Answer</summary>

No. Both are things you know. MFA needs factors of different kinds, such as something you know plus something you have.

</details>

**2. You are logged in to a web app and you open another user's invoice by changing a number in the address. Which check is missing?**

<details>
<summary>Answer</summary>

Authorization. The app knew who you were (authentication worked) but did not check whether you may see that invoice. The correct answer would have been a `403`.

</details>

**3. Why is one strong password used on every site a bad idea?**

<details>
<summary>Answer</summary>

Because of credential stuffing. When one site is breached, attackers try the leaked email and password on other sites. A unique password per site limits the loss to that one site.

</details>

**4. A program that makes backups runs as a user who can read, change and delete every file. What principle does this break, and what should the program be allowed to do?**

<details>
<summary>Answer</summary>

Least privilege. The program only needs to read the files it backs up and to write into the backup folder. If it had a bug or was taken over, it could not then delete or change the originals.

</details>

## Common mistakes

- **Checking permissions only at login.** Authorization must be checked on every action, on the server. Hiding a button is not a permission check.
- **Thinking a strong login protects everything behind it.** Authentication says who came in. It says nothing about which rooms they may enter.
- **Making passwords complicated and short.** `P@ss1!` is short and follows a pattern attackers know. A long password of random words is stronger and easier to type.
- **Giving admin rights "to save time".** Extra rights are rarely removed later. Start with the smallest role and add when a real need appears.
- **Reading `401` as "forbidden".** `401` means not authenticated. `403` is the one that means you may not.

## Key terms

- **Authentication** (authn): checking that someone is who they claim to be.
- **Authorization** (authz): deciding what an authenticated user is allowed to do.
- **Factor**: one kind of proof of identity: something you know, something you have or something you are.
- **Multi-factor authentication** (MFA): a login that asks for two or more factors of different kinds.
- **Credential stuffing**: trying email and password pairs leaked from one site on other sites.
- **Password manager**: a program that stores many long, unique passwords, encrypted, behind one strong password.
- **Least privilege**: giving every user and program only the access needed for its job.
- **Role**: a named set of permissions, such as admin or reader, that is given to users.

## Go further

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): what a login system should and should not do.
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): least privilege and permission checks, written for developers.
- [MDN: 403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403): the exact meaning of the status code, and how it differs from `401`.
