"""
Lightweight in-memory TTL cache for expensive read endpoints.

Usage:
    from services.cache import ttl_cache, invalidate

    # Decorator – caches return value for *ttl* seconds.
    @ttl_cache(ttl=30)
    def get_overview(db):
        ...

    # Invalidate a specific key or all keys matching a prefix.
    invalidate("get_overview")          # exact function cache
    invalidate("budget_*")              # prefix match (not regex)
    invalidate()                        # flush everything
"""
from __future__ import annotations

import time
import threading
import functools
import hashlib
import json
import logging
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_store: dict[str, tuple[float, Any]] = {}   # key → (expires_at, value)


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def ttl_cache(ttl: int = 30, prefix: str = ""):
    """Decorator that caches the return value for *ttl* seconds.

    The cache key is built from the function name plus a hash of the
    *serialisable* non-db arguments.  The first argument named ``db``
    (SQLAlchemy Session) is always excluded from the key.
    """

    def decorator(fn: Callable) -> Callable:
        _prefix = prefix or fn.__qualname__

        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Build cache key – exclude db session
            import inspect
            sig = inspect.signature(fn)
            params = list(sig.parameters.keys())

            key_parts: list[str] = [_prefix]
            for i, (pname, val) in enumerate(zip(params, args)):
                if pname == "db":
                    continue
                try:
                    key_parts.append(f"{pname}={json.dumps(val, sort_keys=True, default=str)}")
                except TypeError:
                    key_parts.append(f"{pname}=<unhashable>")
            for k, v in sorted(kwargs.items()):
                if k == "db":
                    continue
                try:
                    key_parts.append(f"{k}={json.dumps(v, sort_keys=True, default=str)}")
                except TypeError:
                    key_parts.append(f"{k}=<unhashable>")

            raw_key = "|".join(key_parts)
            cache_key = f"{_prefix}:{hashlib.md5(raw_key.encode()).hexdigest()}"

            now = time.time()
            with _lock:
                entry = _store.get(cache_key)
                if entry and entry[0] > now:
                    return entry[1]

            result = fn(*args, **kwargs)

            with _lock:
                _store[cache_key] = (time.time() + ttl, result)

            return result

        # Expose a manual invalidation helper on the wrapped function
        wrapper.invalidate = lambda: invalidate(_prefix)  # type: ignore[attr-defined]
        return wrapper

    return decorator


def invalidate(prefix: Optional[str] = None) -> int:
    """Remove cache entries.

    - ``invalidate()`` → flush everything
    - ``invalidate("get_overview")`` → remove entries whose key starts with
      the given prefix.

    Returns the number of removed entries.
    """
    with _lock:
        if prefix is None:
            n = len(_store)
            _store.clear()
            logger.debug("Cache: flushed all %d entries", n)
            return n

        to_remove = [k for k in _store if k.startswith(prefix)]
        for k in to_remove:
            del _store[k]
        if to_remove:
            logger.debug("Cache: invalidated %d entries for prefix=%s", len(to_remove), prefix)
        return len(to_remove)


def cache_stats() -> dict:
    """Return basic cache statistics (useful for /health or admin endpoints)."""
    now = time.time()
    with _lock:
        total = len(_store)
        expired = sum(1 for _, (exp, _) in _store.items() if exp <= now)
    return {"total_entries": total, "expired_pending_cleanup": expired}
