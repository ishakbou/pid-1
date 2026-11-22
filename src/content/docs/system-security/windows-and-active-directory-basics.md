---
title: Windows and Active Directory basics
description: Understand domains, domain controllers, users, groups and Group Policy as concepts, and see with a small Python model why attackers aim at group membership.
lesson: "11.5"
time: 20 min
sidebar:
  order: 5
---

So far you have hardened one Linux machine. Now picture a company with 3,000 Windows laptops, 200 servers and 3,000 employees who change desks, join, leave and forget their passwords. Nobody creates 3,000 accounts on 3,200 machines by hand. Almost every company of that size runs a central directory instead, and on Windows that directory is called Active Directory. Whoever controls it controls every one of those machines.

## Goal

After this lesson you can:

- Explain what a domain, a domain controller, users, groups and Group Policy are.
- Explain why attackers aim at Active Directory, and especially at admin groups.
- Find everyone who really is an admin when groups are nested, with a short Python program.

## Why it matters

Many of the large ransomware attacks of recent years followed the same path: one employee's account was stolen, the attackers moved from machine to machine, took over the directory, and then used it to send their program to every computer at once. As a defender in almost any company, you will meet Active Directory, even if you work on Linux. Knowing how it is built tells you where the dangerous mistakes hide.

## The idea

**Active Directory** (AD) is Microsoft's directory service: a central database of the users, computers and groups of an organisation, plus the rules that apply to them. The organisation's computers, users and rules together form a **domain**, which has a name such as `corp.example.com`.

The database lives on special servers called **domain controllers**. When you log in to a company laptop, the laptop does not check your password itself. It asks a domain controller. That is why you can sit at any desk in the building and log in with the same name and password.

Think of a large hotel. The front desk (the domain controller) keeps the list of guests and staff, and programs every key card. Each door (each computer) only asks one question: "is this card valid for me right now?". A guest who changes rooms does not need new locks, only a new card. And someone who steals the machine that programs the cards can open every door in the hotel.

The main parts, with their closest match on the Linux machine you know:

| Active Directory | What it is | Closest Linux idea |
|---|---|---|
| Domain user | An account that works on every computer of the domain | A user in `/etc/passwd`, but on all machines at once |
| Group | A named set of users and other groups, used to give rights | A group such as `sudo` |
| Domain Admins | The group whose members control the whole domain | Being root on every machine |
| Organizational unit (OU) | A folder in the directory, for example "Laptops" or "Finance" | No real match |
| Group Policy | Settings pushed from the domain to many computers | Running the same hardening checklist on every machine |

**Group Policy** is how one administrator sets the password rules, turns on the firewall, or blocks USB sticks on 3,000 laptops at once. A set of these settings is a Group Policy Object (GPO), linked to an OU, so it applies to every computer and user inside that folder.

To log in, Windows domains mainly use **Kerberos**. You prove your password once to the domain controller, which gives you a **ticket**, a signed proof with a time limit. Your laptop then shows the ticket to file servers and other services, so you do not type your password again. It works like a festival wristband: checked once at the entrance, then shown at each stage. An older method called NTLM is still found in many networks and is weaker.

### Why attackers aim at it

Everything important is in one place, so the attacker's goal is usually simple: become a member of Domain Admins, or steal the account of someone who is. Common ideas, from a defender's view:

- **Password spraying**: trying one common password, such as the season and the year, against every account. Each account sees only one failure, so it never reaches the lockout limit.
- **Stolen credentials on a workstation**: when an admin logs in to an ordinary laptop, traces of their login stay in that laptop's memory. An attacker who controls the laptop can try to reuse them.
- **Hidden paths through groups**: groups can contain groups. A help-desk group placed inside an admin group, years ago, for one task, quietly makes every help-desk member an admin. Attackers map these paths with tools, and so should defenders.

Defenders answer with the ideas of this module: separate admin accounts used only on admin machines, least privilege, MFA, a different local administrator password on every computer, Group Policy that enforces the hardening, and logs that are watched.

## Try it

There is no Windows domain in this course's lab, and building one needs Windows Server. Instead, you model the most important part, groups inside groups, in Python, on your Linux machine. The outputs come from the user `sam`.

### 1. Look at your own groups

```bash
id
```

```output
uid=1000(sam) gid=1000(sam) groups=1000(sam)
```

On Linux, `id` lists your groups. On the lab machine `sam` has only its own group. On your Ubuntu you will see more, such as `adm` and `sudo`. On a Windows domain computer, the command `whoami /groups` does the same job and lists the domain groups too. The question a defender asks is the same everywhere: which of these groups give power?

### 2. Build a small domain in Python

```bash
mkdir ~/adlab
cd ~/adlab
```

```python title="ad_model.py"
# A tiny model of the groups in an Active Directory domain (lesson 11.5).
# A group can contain users and other groups, as in a real domain.

users = {
    "alice": "IT administrator",
    "bob": "Help desk",
    "carol": "Accountant",
    "intern": "Summer intern",
}

groups = {
    "Domain Admins": ["alice", "Server Admins"],
    "Server Admins": ["Help Desk"],
    "Help Desk": ["bob", "intern"],
    "Finance": ["carol"],
}


def members(group):
    """Return every user in a group, following groups inside groups."""
    found = set()
    for name in groups[group]:
        if name in groups:
            found |= members(name)
        else:
            found.add(name)
    return found


direct = [name for name in groups["Domain Admins"] if name in users]
print("Users listed directly in Domain Admins:", direct)
print("Users who really are Domain Admins:")
for name in sorted(members("Domain Admins")):
    print(" ", name, "-", users[name])
```

Save this as `~/adlab/ad_model.py`. `groups` maps each group to its members, and a member can be a user or another group. `members` is a recursive function, as in Module 4: when it meets a group inside the group, it calls itself on that group. `|=` adds the users it found to the set.

```bash
python3 ad_model.py
```

```output
Users listed directly in Domain Admins: ['alice']
Users who really are Domain Admins:
  alice - IT administrator
  bob - Help desk
  intern - Summer intern
```

Someone who looks only at the members listed in Domain Admins sees `alice` and a group with a reassuring name. Following the groups shows the truth: the summer intern controls the whole domain. Real domains have thousands of groups, which is why both attackers and defenders use programs to follow these links.

### 3. Show the path

Knowing that the intern is an admin is half the answer. To fix it, you need to know which link to cut. This function finds the chain of groups:

```python title="ad_path.py"
from ad_model import groups


def path(user, group):
    """Return the chain of groups from a user up to a group, or None."""
    if user in groups[group]:
        return [user, group]
    for name in groups[group]:
        if name in groups:
            chain = path(user, name)
            if chain:
                return chain + [group]
    return None


print(" -> ".join(path("intern", "Domain Admins")))
print(path("carol", "Domain Admins"))
```

Save it as a second file, `~/adlab/ad_path.py`. `from ad_model import groups` reuses the dictionary from the first file, as you did with modules in Module 3. Importing a file also runs it, so its output appears first. `path` works like `members`: if the user is listed directly, the chain is just the user and the group; otherwise it tries each group inside the group and, if one leads to the user, adds the current group at the end.

```bash
python3 ad_path.py
```

```output
Users listed directly in Domain Admins: ['alice']
Users who really are Domain Admins:
  alice - IT administrator
  bob - Help desk
  intern - Summer intern
intern -> Help Desk -> Server Admins -> Domain Admins
None
```

The last two lines are the new ones. The intern reaches Domain Admins in three steps, and the weak link is clear: `Help Desk` should not be inside `Server Admins`. `carol` has no path, so the function returns `None`. In a real domain, a defender removes the link, gives the help desk only the narrow rights it needs, such as resetting passwords, and checks again.

### 4. Know what the Windows side looks like

You cannot run these here, but you will see them on Windows computers in a domain. Each one only reads information.

| Command (on Windows) | What it shows |
|---|---|
| `whoami /groups` | The groups of the logged-in user, including domain groups |
| `net user /domain` | The user accounts of the domain |
| `net group "Domain Admins" /domain` | The user accounts listed directly in Domain Admins, without following groups inside it |
| `gpresult /r` | The Group Policy Objects applied to this computer and user |

And these Windows event numbers are the AD versions of the log lines from lesson 11.4. Windows writes them to its Security log, and every security team watches them:

| Event ID | Meaning |
|---|---|
| 4624 | An account logged on successfully |
| 4625 | An account failed to log on |
| 4720 | A user account was created |
| 4728 | A member was added to a security-enabled global group, such as Domain Admins |
| 4740 | An account was locked out |

:::note[Practice legally]
Active Directory attacks are practiced only in labs built for it: your own Windows Server virtual machines, or training platforms that provide a domain. Never run tools that list a company's directory on a network that is not yours, even if your account can read it. Reading is allowed by the system, not by your employer or the law.
:::

## Exercise

A defender also wants the other direction: given a user, which groups is she really in?

1. Write a function `groups_of(user)` in a new file `~/adlab/ad_groups.py` that returns every group the user belongs to, directly or through other groups.
2. Print the result, sorted, for `intern` and for `carol`.

Hint: a user is in a group if `members(group)` contains the user.

<details>
<summary>Show the solution</summary>

```python title="ad_groups.py"
from ad_model import groups, members


def groups_of(user):
    """Return every group that contains the user, directly or through other groups."""
    return {group for group in groups if user in members(group)}


print("intern:", sorted(groups_of("intern")))
print("carol:", sorted(groups_of("carol")))
```

```bash
python3 ad_groups.py | tail -n 2
```

```output
intern: ['Domain Admins', 'Help Desk', 'Server Admins']
carol: ['Finance']
```

The set comprehension asks `members` about every group and keeps those that contain the user. `tail -n 2` hides the lines printed by `ad_model.py` when it is imported. The intern is in three groups, although her account was added to only one: this list, not the direct one, says what she can do.

</details>

## Check yourself

**1. What is a domain controller, and why is it the most valuable machine in a Windows network?**

<details>
<summary>Answer</summary>

It is the server that stores the Active Directory database and checks logins for the whole domain. Whoever controls it can create accounts, change any password and push programs or settings to every computer, so controlling it means controlling the whole network.

</details>

**2. What does Group Policy let an administrator do?**

<details>
<summary>Answer</summary>

Push settings, such as password rules, firewall settings or blocked USB sticks, from the domain to many computers and users at once. The settings are grouped in Group Policy Objects linked to organizational units.

</details>

**3. Why does password spraying avoid account lockouts?**

<details>
<summary>Answer</summary>

It tries one password against many accounts instead of many passwords against one account. Each account sees only one or two failures, which stays below the lockout limit.

</details>

**4. `net group "Domain Admins" /domain` lists only `alice`. Can you conclude that only Alice is an admin?**

<details>
<summary>Answer</summary>

No. The command shows the users listed directly and does not follow groups inside the group. Domain Admins may also contain groups, and their members, and the members of the groups inside them, are admins too. You must follow the nested groups, as `members` does in `ad_model.py`.

</details>

**5. Which Windows event ID would you watch to notice someone being added to Domain Admins?**

<details>
<summary>Answer</summary>

4728: a member was added to a security-enabled global group. Domain Admins is such a group.

</details>

## Common mistakes

- **Reading only the direct members of a group.** Nested groups hide the real list. Follow every group inside the group, with a program when there are many.
- **Using the admin account for everyday work.** Admins should have two accounts: a normal one for email and the web, and an admin one used only on admin machines.
- **Adding a group to an admin group "for one task".** Like temporary `sudo` in lesson 11.1, it stays. Give the narrow right that the task needs and remove it afterwards.
- **Thinking AD is a Windows-only topic.** Linux servers, cloud services and email often log in against the same directory. A stolen domain account can open them too.
- **Exploring a real company domain because your account can.** Being able to read the directory is not permission to map it. Practice in your own lab.

## Key terms

- **Active Directory**: Microsoft's directory service, a central database of an organisation's users, computers and groups and the rules for them.
- **Domain**: a group of computers, users and rules managed together by Active Directory, with a name such as `corp.example.com`.
- **Domain controller**: a server that stores the Active Directory database and checks logins for the domain.
- **Organizational unit**: a folder inside Active Directory used to group users or computers and apply rules to them.
- **Group Policy**: the Active Directory feature that pushes settings to many computers and users at once.
- **Kerberos**: the login protocol of Windows domains, which gives a user a time-limited ticket after one password check.
- **Ticket**: in Kerberos, a signed proof of identity with a time limit, shown to services instead of a password.
- **Password spraying**: trying one common password against many accounts, to stay below each account's lockout limit.

## Go further

- [Microsoft Learn: Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview): Microsoft's own introduction to domains, domain controllers and the directory.
- [Microsoft Learn: Best practices for securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory): how Microsoft advises defending a domain: fewer privileged accounts, secure admin machines, protected domain controllers and monitoring.
- [MITRE ATT&CK: Password Spraying](https://attack.mitre.org/techniques/T1110/003/): how this attack is described in the reference that security teams use, with ways to detect and prevent it.
