"""Production Process Supervisor: Hot-Reload Watcher & Self-Healing Auto-Restart Engine for Telegram Leader Bot."""

from __future__ import annotations

import os
import sys
import time
import subprocess
import signal
from pathlib import Path
from typing import Dict, Set

ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_DIR = ROOT_DIR / "agent"
SRC_DIR = AGENT_DIR / "src"
ENV_FILES = [ROOT_DIR / ".env", AGENT_DIR / ".env"]

WATCH_EXTENSIONS = {".py", ".env", ".json"}
WATCH_DIRS = [SRC_DIR, ROOT_DIR / "strategies", ROOT_DIR / "scripts"]


def get_files_mtime() -> Dict[Path, float]:
    """Collect modification timestamps of all tracked source and config files."""
    mtimes: Dict[Path, float] = {}
    
    # Check env files
    for env_file in ENV_FILES:
        if env_file.exists():
            try:
                mtimes[env_file] = env_file.stat().st_mtime
            except OSError:
                pass

    # Check watch directories
    for directory in WATCH_DIRS:
        if not directory.exists():
            continue
        for root, _, files in os.walk(directory):
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in WATCH_EXTENSIONS:
                    p = Path(root) / file
                    try:
                        mtimes[p] = p.stat().st_mtime
                    except OSError:
                        pass
    return mtimes


def run_supervised_bot():
    """Run Telegram Leader Bot under active supervision with Hot-Reload and Crash Recovery."""
    print("=" * 65)
    print("🏛️  VIBE-TRADING SUPERVISOR (HOT-RELOAD & AUTO-HEALING ONLINE)")
    print("=" * 65)
    print("• Chế độ Tự nạp lại (Hot-Reload) : ĐANG BẬT (Theo dõi agent/src, .env)")
    print("• Chế độ Tự hồi sinh (Auto-Heal) : ĐANG BẬT (Tự khởi động lại nếu lỗi)")
    print("• Bấm Ctrl + C trong cửa sổ này để tắt hẳn Supervisor.")
    print("=" * 65)

    python_executable = sys.executable
    last_mtimes = get_files_mtime()

    child_proc: subprocess.Popen | None = None

    def start_child():
        env = os.environ.copy()
        env["PYTHONPATH"] = str(AGENT_DIR)
        return subprocess.Popen(
            [python_executable, "-m", "src.agents.telegram_leader"],
            cwd=str(ROOT_DIR),
            env=env
        )

    try:
        child_proc = start_child()

        while True:
            time.sleep(1.0)

            # 1. Check if child process crashed or exited
            retcode = child_proc.poll()
            if retcode is not None:
                print("\n" + "─" * 65)
                print(f"⚠️ [AUTO-HEAL] Bot đã dừng với mã thoát: {retcode}")
                print("⏳ Đang tự động hồi sinh Bot sau 3 giây...")
                print("─" * 65)
                time.sleep(3.0)
                child_proc = start_child()
                last_mtimes = get_files_mtime()
                continue

            # 2. Check for file modifications (Hot-Reload)
            current_mtimes = get_files_mtime()
            changed_files = []

            for p, mtime in current_mtimes.items():
                if p not in last_mtimes or mtime > last_mtimes[p]:
                    changed_files.append(p.name)

            if changed_files:
                print("\n" + "─" * 65)
                print(f"🔄 [HOT-RELOAD] Phát hiện thay đổi: {', '.join(changed_files)}")
                print("⚡ Đang tự động nạp lại mã nguồn mới...")
                print("─" * 65)

                try:
                    child_proc.terminate()
                    child_proc.wait(timeout=5.0)
                except Exception:
                    child_proc.kill()

                time.sleep(0.5)
                child_proc = start_child()
                last_mtimes = current_mtimes

    except KeyboardInterrupt:
        print("\n🛑 Nhận lệnh tắt Supervisor (Ctrl+C). Đang đóng Bot an toàn...")
        if child_proc:
            try:
                child_proc.terminate()
                child_proc.wait(timeout=3.0)
            except Exception:
                child_proc.kill()
        print("✅ Đã tắt hoàn tất.")


if __name__ == "__main__":
    run_supervised_bot()
