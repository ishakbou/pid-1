// Single source for the course structure: the home page, the menus, the numbers and the order
// of the lessons are all generated from this file.
//
// Lesson fields: [title, one-line summary, flags]
//   flags.project   this lesson is the module's project step
//   flags.changed   short planning note: how the lesson differs from the first outline
//   flags.slug      URL slug when the automatic one would be too long

const L = (title, summary, flags = {}) => ({ title, summary, ...flags });

export const parts = [
  {
    n: 1,
    title: 'Foundations',
    modules: [
      {
        n: 0, title: 'Start Here', slug: 'start-here', cheatSheet: 'Setup checklist',
        lessons: [
          L('How this course works', 'The lesson layout, the mylab project, and how your progress is saved.'),
          L('What you need', 'A computer, an internet connection and free tools only. What to do with an old or slow machine.'),
          L('Three ways to practice', 'The practice terminal in the page, GitHub Codespaces, or Linux on your own computer, and how to choose.'),
          L('Setting up your computer', 'Install WSL and Ubuntu on Windows, or prepare the terminal on macOS and Linux.'),
          L('Installing a code editor', 'Install VS Code, open a folder, and connect it to WSL.'),
          L('How to learn with AI without letting it think for you', 'Rules for using AI as a tutor and not as an answer machine.', { slug: 'learning-with-ai' }),
          L('Project step: check your setup', 'A short checklist that proves your terminal, your editor and your lab are ready.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 1, title: 'Linux & the Terminal', slug: 'linux', cheatSheet: 'Linux commands',
        lessons: [
          L('What the terminal is', 'Terminal, shell and command: what each word means and how to read a prompt.'),
          L('Files and navigation', 'Move around the file system and create, copy, move and delete files and folders.'),
          L('Viewing and editing files', 'Read files with cat, less, head and tail, and edit them with nano.'),
          L('Users and permissions', 'Read rwx permissions, change them with chmod and chown, and use sudo with care.'),
          L('Processes', 'See what is running with ps and top, and stop a program with kill.'),
          L('Installing software (apt)', 'Find, install, update and remove packages on Ubuntu.'),
          L('Pipes, redirection and grep', 'Chain commands together, save output to a file, and search text.'),
          L('Environment variables and PATH', 'How the shell finds programs and remembers settings.'),
          L('Your first Bash script', 'Write, run and debug a small script with variables, if and loops.'),
          L('Project step: start mylab', 'Create the mylab folder structure and two small helper scripts.', { project: true }),
        ],
      },
      {
        n: 2, title: 'Git & GitHub', slug: 'git', cheatSheet: 'Git',
        lessons: [
          L('What version control is', 'Why "report_final_v2_really_final" fails, and what commits and repositories are.'),
          L('Your first commits', 'git init, status, add, commit, log and diff on a real folder.'),
          L('Branches and merging', 'Work on a branch, merge it, and solve a merge conflict.'),
          L('Fixing mistakes (restore, revert, reset)', 'Undo changes safely at each stage, and know which command fits which mistake.', { slug: 'fixing-mistakes' }),
          L('Remotes, push and pull', 'Connect your computer to GitHub, then push, pull and clone.'),
          L('Pull requests and .gitignore', 'Propose a change with a pull request, and keep secrets and junk out of the repository.', { slug: 'pull-requests-and-gitignore' }),
          L('Publishing a site with GitHub Pages', 'Put a simple page online for free, straight from a repository.'),
          L('Project step: mylab on GitHub', 'Put mylab under git, write a first README, and publish the repository.', { project: true }),
        ],
      },
      {
        n: 3, title: 'Programming with Python', slug: 'python', cheatSheet: 'Python',
        lessons: [
          L('Variables and types', 'Run Python, store values, and work with numbers, strings and booleans.'),
          L('Conditions and loops', 'Make decisions with if, and repeat work with for and while.'),
          L('Functions', 'Package code into reusable functions with parameters and return values.'),
          L('Lists, dictionaries and sets', 'Store collections of data and pick the right one for the job.'),
          L('Working with files', 'Read and write text files, CSV and JSON.'),
          L('Errors and exceptions', 'Read a traceback, and handle errors with try and except.'),
          L('Classes and objects (OOP)', 'Group data and behavior into classes, and learn when a class is not needed.', { slug: 'classes-and-objects' }),
          L('Modules, pip and virtual environments', 'Split code into files, install packages, and keep each project isolated with venv.'),
          L('Testing and debugging', 'Write tests with pytest, and find bugs with print, the debugger and a calm method.'),
          L('Automating tasks with Python', 'Write command-line scripts that rename files, run other programs and take arguments.'),
          L('Project step: a log analyzer for mylab', 'Build a tool that reads a log file and reports the busiest IP addresses and the errors.', { project: true }),
        ],
      },
      {
        n: 4, title: 'Data Structures & Algorithms', slug: 'algorithms', cheatSheet: 'Big-O and data structures',
        lessons: [
          L('Big-O notation', 'Measure how the work grows when the input grows, with timings you run yourself.'),
          L('Arrays and lists', 'How a list sits in memory, and which operations are cheap or expensive.'),
          L('Stacks and queues', 'Last in first out, first in first out, with an undo history and a task queue as examples.'),
          L('Hash maps', 'Why dictionary lookups are fast, and what a collision is.'),
          L('Linked lists', 'Build a linked list by hand and compare it with an array.'),
          L('Recursion', 'Functions that call themselves, the call stack, and base cases.', { changed: 'moved before Trees, because walking a tree uses recursion' }),
          L('Trees', 'Binary trees, binary search trees, and three ways to walk a tree.'),
          L('Graphs', 'Model a network as nodes and edges, and explore it with BFS and DFS.'),
          L('Searching and sorting', 'Linear and binary search, then bubble, merge and quick sort, and what Python\'s own sort does.'),
          L('Project step: faster tools in mylab', 'Speed up the log analyzer with better data structures, and measure the gain.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 5, title: 'How Computers Work', slug: 'computers', cheatSheet: 'Number systems and units',
        lessons: [
          L('Binary, hexadecimal and text encoding', 'Count in binary and hex, and see how ASCII and UTF-8 turn bytes into text.'),
          L('Logic and Boolean algebra', 'AND, OR, NOT and XOR, truth tables, and bitwise operators in Python.'),
          L('CPU, memory and storage', 'What happens when a program runs: the fetch-execute cycle, and RAM versus disk.'),
          L('Operating systems', 'Processes, threads, memory and file systems: what the OS does for every program.'),
          L('Compiled vs interpreted languages', 'Compile a tiny C program, compare it with Python, and look at what a binary is.'),
          L('Virtual machines and containers', 'What each one isolates, and when to use which.'),
          L('What "the cloud" actually is', 'Other people\'s computers, rented by the minute: servers, regions and service models.', { slug: 'what-the-cloud-is' }),
          L('Project step: look inside mylab', 'Use hexdump, file and /proc to see your own files and processes the way the machine sees them.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 6, title: 'Networking', slug: 'networking', cheatSheet: 'Networking',
        lessons: [
          L('The OSI and TCP/IP models', 'Layers as a way to split a hard problem. Follow one web request down and up the stack.'),
          L('IP addresses and subnetting', 'Read IPv4 addresses and masks, work out a network range, and meet IPv6.'),
          L('TCP vs UDP and ports', 'Reliable versus fast delivery, the three-way handshake, and what a port number is for.'),
          L('DNS', 'How a name becomes an address, the main record types, and lookups with dig.'),
          L('HTTP and HTTPS', 'Requests, responses, methods, status codes and headers, seen with curl.'),
          L('DHCP, NAT and routing basics', 'How your laptop gets an address, and how packets leave your home network.'),
          L('Network tools', 'ping, traceroute, curl, dig and ss: what each one tells you and when to use it.'),
          L('Reading traffic with Wireshark', 'Capture your own traffic and read a TCP handshake and an HTTP request.'),
          L('Project step: a tiny web server in mylab', 'Serve a page from mylab with Python and watch the request arrive.', { project: true }),
        ],
      },
      {
        n: 7, title: 'Databases & SQL', slug: 'databases', cheatSheet: 'SQL',
        lessons: [
          L('Tables and relations', 'What a relational database is: rows, columns, primary keys and foreign keys.'),
          L('SELECT, INSERT, UPDATE, DELETE', 'The four statements that read and change data, practiced in SQLite.'),
          L('Filtering and sorting', 'WHERE, ORDER BY and LIMIT, and counting with GROUP BY.'),
          L('Joins', 'Combine rows from two tables, and tell an INNER join from a LEFT join.'),
          L('Indexes', 'Why some queries are slow, and how an index fixes that.'),
          L('Database design basics', 'Split data into tables without repeating it (normalization, in plain words).'),
          L('Using a database from Python', 'Query SQLite with the sqlite3 module, passing values the safe way.'),
          L('Project step: a database for mylab', 'Give mylab a SQLite database for notes and users.', { project: true }),
        ],
      },
      {
        n: 8, title: 'The Web', slug: 'web', cheatSheet: 'HTML, CSS and HTTP',
        lessons: [
          L('HTML basics', 'Structure a page with headings, links, lists, images and forms.'),
          L('CSS basics', 'Selectors, the box model, and a simple readable layout.'),
          L('JavaScript basics', 'Variables, functions, events, and changing the page.'),
          L('How browsers and servers talk', 'Follow a page load from URL to pixels with the browser\'s developer tools.'),
          L('APIs and JSON', 'Call an API with curl and fetch, and build a small JSON endpoint.'),
          L('Cookies and sessions', 'How a site remembers you between requests, and why that matters for security.'),
          L('Build and publish a portfolio page', 'Write a personal page and put it online with GitHub Pages.'),
          L('Project step: the mylab web app', 'Turn mylab into a small notes app with pages, a form, a login and the database from Module 7.', { project: true }),
        ],
      },
    ],
  },
  {
    n: 2,
    title: 'Cybersecurity',
    modules: [
      {
        n: 9, title: 'Security Fundamentals', slug: 'security-basics', cheatSheet: 'Security concepts',
        lessons: [
          L('Ethics and law first', 'What you may test, what gets people into trouble, and how permission works.'),
          L('The CIA triad', 'Confidentiality, integrity and availability, with one real failure of each.'),
          L('Threats, vulnerabilities and risk', 'Tell the three apart, and rank risks by likelihood and impact.'),
          L('Authentication vs authorization', 'Who you are versus what you may do: passwords, MFA and least privilege.'),
          L('Social engineering and phishing', 'How attackers trick people, and how to spot and report a phishing message.'),
          L('Types of malware and how defenders detect them', 'Viruses, worms, trojans, ransomware and spyware as concepts, plus signature and behavior detection.', { slug: 'malware-and-detection' }),
          L('The security mindset', 'Ask "how could this fail?" and think in assets, attackers and defenses.'),
          L('Project step: a threat model for mylab', 'List what mylab holds, who could attack it, and what you will fix in the next modules.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 10, title: 'Cryptography Basics', slug: 'cryptography', cheatSheet: 'Cryptography',
        lessons: [
          L('Encoding vs hashing vs encryption', 'Three things beginners mix up: Base64, SHA-256 and AES side by side.'),
          L('Symmetric vs asymmetric encryption', 'One shared key versus a key pair, and why real systems use both.'),
          L('Digital signatures and certificates', 'Prove who sent something, and see how certificate authorities build trust.'),
          L('How TLS works', 'What the handshake does to turn HTTP into HTTPS. Inspect a real certificate.'),
          L('Storing passwords safely', 'Salts and slow hashes, and why plain SHA-256 is not enough.'),
          L('Project step: safe passwords in mylab', 'Replace the plain-text passwords in mylab with salted, slow hashes.', { project: true }),
        ],
      },
      {
        n: 11, title: 'System & Network Security', slug: 'system-security', cheatSheet: 'Hardening checklist',
        lessons: [
          L('Securing a Linux system', 'Users, sudo, updates, and removing what you do not need.'),
          L('SSH and keys', 'Log in to another machine safely, use key pairs, and tighten the SSH server.'),
          L('Firewalls (ufw)', 'Allow and block traffic with simple rules, starting from "deny by default".'),
          L('Logs and what to look for', 'Where Linux keeps its logs, and what failed logins and odd activity look like.'),
          L('Windows and Active Directory basics', 'Domains, users, groups and policies as concepts, and why attackers aim at them.'),
          L('Network scanning concepts', 'What a port scan reveals, how defenders scan their own lab with nmap, and how scans get noticed.'),
          L('Project step: harden the machine that runs mylab', 'Apply a short hardening checklist to your lab machine and record the before and after.', { project: true }),
        ],
      },
      {
        n: 12, title: 'Web Security', slug: 'web-security', cheatSheet: 'Web flaws and their fixes',
        lessons: [
          L('The OWASP Top 10 explained', 'The most common web risks in plain English, and how to read the list.'),
          L('Injection', 'How SQL injection works against your own local copy of mylab, and how parameterized queries stop it.'),
          L('Cross-site scripting (XSS)', 'How untrusted text becomes code in a page, and how escaping and a content security policy prevent it.', { slug: 'xss' }),
          L('Broken access control', 'When users reach data that is not theirs, and why every request needs a permission check.'),
          L('Security misconfiguration', 'Debug mode, default passwords, missing headers and other doors left open.'),
          L('Practice in OWASP Juice Shop and PortSwigger Academy', 'Run Juice Shop on your own machine and choose your first labs.', { slug: 'practice-labs', changed: 'moved before the project step, so the project step stays last in every module' }),
          L('Project step: fix these flaws in your own mylab app', 'Find and fix injection, XSS and access control bugs in mylab, and add tests that prove it.', { project: true }),
        ],
      },
      {
        n: 13, title: 'Defense & Incident Response', slug: 'defense', cheatSheet: 'Incident response steps',
        lessons: [
          L('Blue team vs red team', 'Who does what in a security team, and where beginners usually start.'),
          L('Logging and monitoring', 'Decide what to log, write useful log lines, and watch them.'),
          L('SIEM concepts', 'How logs from many machines are collected, searched and turned into alerts.'),
          L('Incident response steps', 'Prepare, detect, contain, remove, recover, learn: walk through a small incident.'),
          L('Backups and recovery', 'The 3-2-1 rule, and why a backup you never restored is not a backup.'),
          L('Automating defense tasks with Python', 'Scripts that watch logs, check file integrity and report failed logins.'),
          L('Project step: logging and alerts for mylab', 'Add structured logs to mylab, and a script that flags repeated failed logins.', { project: true }),
        ],
      },
      {
        n: 14, title: 'Practice: Labs & CTFs', slug: 'labs-ctf', cheatSheet: 'CTF toolkit',
        lessons: [
          L('Build a home lab with virtual machines', 'Install a free hypervisor and create two virtual machines on an isolated network.'),
          L('OverTheWire Bandit', 'How to play, how to get unstuck, and what the first levels teach, without spoilers.'),
          L('picoCTF', 'The challenge categories, how to choose a challenge, and a method to solve it.'),
          L('Writing a good CTF write-up', 'Structure, screenshots, and explaining your reasoning, not only the answer.'),
          L('Project step: your first write-ups in mylab', 'Add a writeups folder to mylab with two write-ups in the standard format.', { project: true, changed: 'new' }),
        ],
      },
    ],
  },
  {
    n: 3,
    title: 'Career',
    modules: [
      {
        n: 15, title: 'Building with AI the Right Way', slug: 'ai', cheatSheet: 'Working with AI checklist',
        lessons: [
          L('Giving clear instructions', 'Context, goal, limits and examples: write requests that get useful answers.'),
          L('Reading and checking AI-written code', 'Read every line, run it, test it, and look for the usual mistakes.'),
          L('Debugging with AI', 'Give the error, the code and what you tried, then verify the fix yourself.'),
          L('When not to trust AI', 'Made-up facts, outdated advice, insecure code and private data.'),
          L('Project step: one AI-assisted feature, reviewed', 'Add one small feature to mylab with AI help, and write down how you checked it.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 16, title: 'Talking About Your Field', slug: 'communication', cheatSheet: 'README, CV and interview checklist',
        lessons: [
          L('Technical English for CS and security', 'The words and phrases you need to read documentation, ask questions and write reports.'),
          L('Explaining a project clearly', 'Problem, approach, result: explain your work in two minutes.'),
          L('Writing a good README', 'What a reader needs on the first screen, with a template.'),
          L('CV, LinkedIn and GitHub profile', 'Show real work honestly, and know what recruiters look at first.'),
          L('Interview basics', 'Common technical and behavior questions, and how to prepare without memorizing.'),
          L('Certification roadmap overview', 'Which certificates exist, which ones help a beginner, and which can wait.'),
          L('Project step: the mylab README and your profile', 'Rewrite the mylab README and pin the project on your GitHub profile.', { project: true, changed: 'new' }),
        ],
      },
      {
        n: 17, title: 'Final Projects', slug: 'final-projects', cheatSheet: 'Project launch checklist',
        lessons: [
          L('Polish mylab into a portfolio project', 'Clean the code, the tests and the README, and add screenshots and a short demo.', { project: true }),
          L('One security project with a write-up', 'Choose a project, for example a hardened home server, build it and document it.'),
          L('Publishing and presenting your work', 'Put it online, present it in five minutes, and ask for feedback.'),
        ],
      },
    ],
  },
];

// One plain line per module: what the reader gets from it.
export const moduleAbout = {
  0: 'Set up your computer and learn how the course works.',
  1: 'Work in the terminal: files, permissions, processes, pipes and a first script.',
  2: 'Track your work with commits and branches, and publish it on GitHub.',
  3: 'Write real programs: data, files, errors, tests and small automation tools.',
  4: 'Choose the right data structure and measure how fast your code runs.',
  5: 'Bits, the CPU, memory, operating systems, virtual machines and the cloud.',
  6: 'How data travels: IP, TCP, DNS and HTTP, and the tools to inspect them.',
  7: 'Store and query data with tables, joins and indexes, then use it from Python.',
  8: 'Build pages with HTML, CSS and JavaScript, and see how browsers and servers talk.',
  9: 'The ideas behind all security work, starting with ethics and law.',
  10: 'Hashing, encryption, signatures and TLS, and how to store passwords safely.',
  11: 'Harden a Linux machine: users, SSH, the firewall and logs.',
  12: 'Understand the common web flaws and fix them in your own app.',
  13: 'Detect problems, respond to an incident, and recover from it.',
  14: 'Build a home lab and practice legally on CTF platforms.',
  15: 'Use AI as a tool whose work you check, not a source you trust blindly.',
  16: 'Explain your work, write a README and a CV, and prepare for interviews.',
  17: 'Finish mylab and one security project, then publish and present them.',
};

export const sitePages = [
  ['', 'Home'],
  ['roadmap/', 'Roadmap'],
  ['glossary/', 'Glossary'],
  ['about/', 'About'],
  ['license/', 'License'],
  ['404', 'Page not found'],
];

export const slugify = (s) =>
  s.toLowerCase()
    .replace(/^project step: /, 'project-')
    .replace(/&/g, 'and')
    .replace(/["'’().,:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const lessonSlug = (lesson) =>
  lesson.project && !lesson.slug ? 'project' : (lesson.slug || slugify(lesson.title));

export const allModules = () => parts.flatMap((p) => p.modules.map((m) => ({ ...m, part: p })));

export const counts = () => {
  const mods = allModules();
  const lessons = mods.reduce((a, m) => a + m.lessons.length, 0);
  const cheats = mods.filter((m) => m.cheatSheet).length;
  return {
    modules: mods.length,
    lessons,
    overviews: mods.length,
    cheats,
    sitePages: sitePages.length,
    total: lessons + mods.length + cheats + sitePages.length,
  };
};
