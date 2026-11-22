// A few real lines from every module, shown on its card on the Home page instead of a picture.
// Each line is [prompt, text, kind]: kind "o" is output or a comment (dimmer), everything else is code.
const L = (p, t, k = 'c') => ({ p, t, k });

const CODE = {
  0: ['bash', [L('$ ', 'uname'), L('', 'Linux', 'o'), L('$ ', 'echo "I am ready"'), L('', 'I am ready', 'o')]],
  1: ['bash', [L('$ ', 'mkdir playground'), L('$ ', 'cd playground'), L('$ ', 'pwd'), L('', '/home/sam/playground', 'o')]],
  2: ['git', [L('$ ', 'git add notes.md'), L('$ ', 'git commit -m "Add notes"'), L('$ ', 'git log --oneline'), L('', '4f2a9c1 Add notes', 'o')]],
  3: ['python', [L('', 'def failed_logins(lines):'), L('', '    count = 0'), L('', '    for line in lines:'), L('', '        if "failed" in line:'), L('', '            count += 1'), L('', '    return count')]],
  4: ['python', [L('', 'blocked = set(load_blocklist(path))'), L('', ''), L('', 'for ip in ips:'), L('', '    if ip in blocked:'), L('', '        print(ip)'), L('', '# a set answers "in" in one step', 'o')]],
  5: ['bash', [L('$ ', 'echo $((2#01000001))'), L('', '65', 'o'), L('$ ', "printf '%x\\n' 65"), L('', '41', 'o')]],
  6: ['bash', [L('$ ', 'curl -I http://127.0.0.1:8000'), L('', 'HTTP/1.0 200 OK', 'o'), L('$ ', 'ping -c 1 127.0.0.1'), L('', '1 packets transmitted, 1 received', 'o')]],
  7: ['sql', [L('', 'SELECT username, COUNT(*) AS n'), L('', 'FROM logins'), L('', "WHERE result = 'failed'"), L('', 'GROUP BY username'), L('', 'ORDER BY n DESC;')]],
  8: ['html', [L('', '<form method="post" action="/login">'), L('', '  <input name="username">'), L('', '  <input name="password" type="password">'), L('', '  <button>Log in</button>'), L('', '</form>')]],
  9: ['threat model', [L('', 'asset          threat         risk', 'o'), L('', 'data/mylab.db  stolen copy    high'), L('', 'secret_key     leaked in git  high'), L('', 'sample logs    deleted        low')]],
  10: ['bash', [L('$ ', 'printf hello | sha256sum'), L('', '2cf24dba5fb0a30e26e83b2ac5b9e29e...', 'o'), L('$ ', 'printf Hello | sha256sum'), L('', '185f8db32271fe25f561a6fc938b2e26...', 'o')]],
  11: ['bash', [L('$ ', 'sudo ufw status'), L('', 'Status: active', 'o'), L('', 'To       Action   From', 'o'), L('', '22/tcp   ALLOW    Anywhere', 'o')]],
  12: ['python', [L('', '# never build SQL from user input', 'o'), L('', 'cur.execute('), L('', '    "SELECT id FROM users WHERE name = ?",'), L('', '    (name,),'), L('', ')')]],
  13: ['log', [L('', '09:40 login_failed user=root ip=10.0.0.7', 'o'), L('', '09:40 login_failed user=root ip=10.0.0.7', 'o'), L('', '09:41 login_failed user=root ip=10.0.0.7', 'o'), L('', 'ALERT 3 failed logins from 10.0.0.7')]],
  14: ['bash', [L('$ ', 'ssh bandit0@bandit.labs.overthewire.org -p 2220'), L('$ ', 'ls'), L('', 'readme', 'o'), L('$ ', 'cat readme')]],
  15: ['review', [L('', 'You: add a --status option.', 'o'), L('', 'AI:  here is the patch.', 'o'), L('$ ', 'git diff'), L('$ ', 'python3 -m pytest'), L('', '1 failed, 8 passed')]],
  16: ['README.md', [L('', '# mylab'), L('', ''), L('', 'A small notes app and a log analyzer,', 'o'), L('', 'built and secured step by step.', 'o'), L('', ''), L('', '## How to run it')]],
  17: ['bash', [L('$ ', 'python3 -m pytest'), L('$ ', 'git tag v1.0'), L('$ ', 'git push origin v1.0')]],
};

/** The label and the lines for the card of module `n`. */
export function moduleCode(n) {
  const [lang, lines] = CODE[n] || CODE[0];
  return { lang, lines };
}
