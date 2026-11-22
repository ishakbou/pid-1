# Read by sam's login shell (after Alpine's /etc/profile). Makes the practice machine feel like the course's Ubuntu.
export PS1='\u@\h:\w\$ '
export TERM=xterm-256color
export EDITOR=nano
export PAGER=less
# Ubuntu gives each user a private group and the umask 002 (new folders drwxrwxr-x). Do the same here.
umask 002
# Ubuntu answers an unknown command with "name: command not found". Plain Bash would add "-bash: " in front.
command_not_found_handle() { printf '%s: command not found\n' "$1" >&2; return 127; }
# The page puts the size of its terminal window on the kernel command line, so programs such as nano and ls
# know how wide the screen is (a serial line cannot tell them).
for practice_arg in $(cat /proc/cmdline); do
  case $practice_arg in
    practice.cols=*) practice_cols=${practice_arg#*=} ;;
    practice.rows=*) practice_rows=${practice_arg#*=} ;;
  esac
done
[ -n "${practice_cols:-}" ] && [ -n "${practice_rows:-}" ] && stty cols "$practice_cols" rows "$practice_rows" 2>/dev/null
unset practice_arg practice_cols practice_rows
cd "$HOME"
