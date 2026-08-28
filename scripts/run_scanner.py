import os
import sys
import importlib.util

# Add agent directory to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
agent_dir = os.path.join(project_root, "agent")
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)

# Load realtime_leading_scanner directly
scanner_path = os.path.join(agent_dir, "src", "trading", "realtime_leading_scanner.py")
spec = importlib.util.spec_from_file_location("realtime_leading_scanner", scanner_path)
scanner_mod = importlib.util.module_from_spec(spec)
sys.modules["realtime_leading_scanner"] = scanner_mod
spec.loader.exec_module(scanner_mod)

if __name__ == "__main__":
    scanner_mod.main()
