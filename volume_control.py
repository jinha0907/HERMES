# volume_control.py
import subprocess
import re

_PREFERRED = ["Headphone", "Master", "Speaker", "PCM"]
_cached_ctl = None

def _run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def _list_scontrols():
    out = _run(["amixer", "scontrols"])
    if out.returncode != 0:
        return []
    lines = out.stdout.strip().splitlines()
    names = []
    for ln in lines:
        m = re.search(r"Simple mixer control '([^']+)'", ln)
        if m:
            names.append(m.group(1))
    return names

def _pick_control():
    names = _list_scontrols()
    if not names:
        return None
    for want in _PREFERRED:
        if want in names:
            return want
    return names[0]  # fallback

def set_system_volume(percent: int):
    global _cached_ctl
    percent = max(0, min(100, int(percent)))

    if _cached_ctl is None:
        _cached_ctl = _pick_control()

    if not _cached_ctl:
        return (False, None)

    cmd = ["amixer", "-q", "sset", _cached_ctl, f"{percent}%"]
    r = _run(cmd)
    if r.returncode == 0:
        return (True, _cached_ctl)

    _cached_ctl = None
    ctl = _pick_control()
    if not ctl:
        return (False, None)

    cmd = ["amixer", "-q", "sset", ctl, f"{percent}%"]
    r = _run(cmd)
    if r.returncode == 0:
        _cached_ctl = ctl
        return (True, ctl)

    return (False, ctl)
