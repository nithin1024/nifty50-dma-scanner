from pathlib import Path

root = Path(__file__).resolve().parents[2]
candidates = [
    root / ".env",
    root / "backend" / ".env",
    root / "backend" / "data" / "upstox_token.json",
]
for path in candidates:
    print(path.name, "exists" if path.exists() else "missing", "bytes", path.stat().st_size if path.exists() else 0)
    if path.suffix == ".env" and path.exists():
        keys = []
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            keys.append(f"{key.strip()}={'set' if value.strip() else 'empty'}")
        print("KEYS", path.parent.name, keys)
    if path.name == "upstox_token.json" and path.exists():
        import json
        data = json.loads(path.read_text(encoding="utf-8"))
        print("TOKEN_JSON_KEYS", sorted(data.keys()), "access_token", "set" if data.get("access_token") else "empty")
