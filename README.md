# PID 1: CS & security foundations

A free course on the practical basics of computer science and cybersecurity, from your first terminal command to a finished portfolio project.

**Read it here: https://ishakbou.github.io/pid-1/**

PID 1 is the first program a Linux system starts. Every other program grows from it. This course is meant to be that first step.

## Who it is for

Computer science and cybersecurity students, in any year, and people who learn alone. You do not need any experience with the terminal, with git or with programming. Start at Module 0 and go to Module 17.

## What it covers

18 modules in three parts. Every lesson has the same nine parts: Goal, Why it matters, The idea, Try it, Exercise, Check yourself, Common mistakes, Key terms, Go further. Every command in a lesson was run on Ubuntu, and the output you see is the real output.

| Part | Modules |
|---|---|
| 1. Foundations | 0 Start Here, 1 Linux & the Terminal, 2 Git & GitHub, 3 Programming with Python, 4 Data Structures & Algorithms, 5 How Computers Work, 6 Networking, 7 Databases & SQL, 8 The Web |
| 2. Cybersecurity | 9 Security Fundamentals, 10 Cryptography Basics, 11 System & Network Security, 12 Web Security, 13 Defense & Incident Response, 14 Practice: Labs & CTFs |
| 3. Career | 15 Building with AI the Right Way, 16 Talking About Your Field, 17 Final Projects |

Through the whole course you build and secure one project, a repository called `mylab`. Every module also has an overview with a mind map and a printable cheat sheet.

Security is taught from the defender's point of view. Practice only on systems you own or have written permission to test.

## Practice

You can run the commands of the course in three places:

- the practice terminal inside the lesson pages (the first Linux lessons),
- GitHub Codespaces, a full Ubuntu in your browser with every tool of the course already installed,
- Linux on your own computer (WSL on Windows, the terminal on macOS, or your Linux).

[![Open the lab in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ishakbou/pid-1)

The lab is described in [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json). Codespaces is free within GitHub's monthly included usage.

## Found a mistake?

Tell me on Telegram: [@isko_ooo](https://t.me/isko_ooo). Say which lesson it is and what is wrong. You can also open an issue with the "Report a mistake" template. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Run the site on your computer

You need Node.js 22.23.4 or newer (24 LTS works).

```bash
npm install
npm run dev       # http://localhost:4322/pid-1/
npm run build     # the finished site in dist/
npm run preview   # serve dist/
```

The lessons are Markdown files in `src/content/docs/`. The order and the numbers of the lessons come from `phase0/curriculum.mjs`.

## Credits and licence

Created by **Ishak Boukhalfa**: [Telegram](https://t.me/isko_ooo), [LinkedIn](https://www.linkedin.com/in/ishak-boukhalfa-07a43737b/).

- The lessons (text, diagrams, exercises, cheat sheets) are licensed [CC BY-NC-SA 4.0](LICENSE-CONTENT): share and adapt them with credit, not for sale, under the same licence.
- The code (the site and the code examples) is licensed [MIT](LICENSE).

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). Fonts: Red Hat Display, Red Hat Text and Red Hat Mono (SIL Open Font License 1.1).
