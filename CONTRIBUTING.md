# Contributing

Thank you for helping. The most useful help is a report of a mistake: a wrong command, an output that does not match, a link that is broken, or a sentence that is hard to understand.

## Report a mistake

The fastest way: write to me on Telegram, [@isko_ooo](https://t.me/isko_ooo).

Or open an issue with the **Report a mistake** template. Please give:

1. The link to the page, for example `https://ishakbou.github.io/pid-1/linux/files-and-navigation/`.
2. What is wrong. Copy the sentence, the command or the output.
3. What you expected, and the system you used (Ubuntu, WSL, macOS, Codespaces, the practice terminal).
4. A fix, if you have one.

## Suggest a fix

Small fixes (a typo, a broken link) are welcome as a pull request.

- The lessons are in `src/content/docs/<module>/`. Every lesson has the same format. Use an existing lesson as your model, for example `src/content/docs/linux/files-and-navigation.md`.
- Every command and every output in a lesson must be real: run it on Ubuntu before you change it.
- Keep the style: plain English, short sentences, no marketing words, no emoji.
- Run `npm run build` before you open the pull request. The build checks every internal link.

For bigger changes (a new lesson, a different order), please ask first on Telegram.

## Licence of your contribution

By contributing you agree that your changes to the lessons are published under CC BY-NC-SA 4.0 and your changes to the code under MIT, like the rest of the course.

## Security topics

The security modules teach defence. Do not send exploit code for real products, malware, or anything aimed at real systems or people: it will not be accepted.
