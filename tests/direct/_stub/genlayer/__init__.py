"""Minimal offline stand-in for the real `genlayer` SDK, used ONLY so that
`pytest tests/direct` can run in environments without network access to
install the actual package.

Mirrors the API shape confirmed against two contracts verified live on
GenLayer Studio (llm_erc20.py, football_prediction_market.py) plus
cross-checked docs/examples: `import genlayer as gl` +
`from genlayer.types import *`, `gl.contract.Contract`,
`gl.storage.TreeMap` / `DynArray`, `gl.public.view` / `write`, `gl.message`,
`gl.vm.UserError`, `gl.nondet.web.render(url, mode=...)`,
`gl.nondet.exec_prompt`, `gl.eq_principle.strict_eq` /
`prompt_non_comparative`.

This is NOT a GenLayer simulator. It does not model consensus, validators,
leader/validator equivalence checks, or gas. For anything beyond
single-process unit tests (the real equivalence behavior, actual LLM calls,
actual chain state), install the real `genlayer-test` package and run
`gltest tests/integration` against a live Studio/testnet deployment.

conftest.py only adds this stub to sys.path when a real, usable `genlayer`
(with an actual `gl.contract.Contract`) isn't importable, so a real install
always takes precedence.
"""

from __future__ import annotations

import threading
from typing import Any, Callable

from . import contract, storage, types, vm
from .contract import Contract
from .storage import DynArray, TreeMap
from .types import Address, u256
from .vm import UserError


class _Message:
    """Per-call sender context. Tests set gl.message.sender_address before
    each write to simulate different callers."""

    def __init__(self):
        self._local = threading.local()

    @property
    def sender_address(self):
        return getattr(self._local, "sender_address", Address("0x0"))

    @sender_address.setter
    def sender_address(self, value):
        self._local.sender_address = Address(value)

    @property
    def block_timestamp(self):
        return getattr(self._local, "block_timestamp", 0)

    @block_timestamp.setter
    def block_timestamp(self, value):
        self._local.block_timestamp = value


message = _Message()


class _Public:
    """@gl.public.view / @gl.public.write are no-ops here — real GenLayer
    uses them to mark ABI-visible methods and whether they're allowed to
    mutate state. Tests call methods directly."""

    @staticmethod
    def view(fn: Callable) -> Callable:
        fn.__gl_visibility__ = "view"
        return fn

    @staticmethod
    def write(fn: Callable) -> Callable:
        fn.__gl_visibility__ = "write"
        return fn


public = _Public()


class _Web:
    """gl.nondet.web.render(url, mode=...) stand-in. Tests monkeypatch
    `gl.nondet.web._hook` to a callable(url) -> str|dict; a dict is
    auto-JSON-encoded, mirroring "the page's raw text happens to be JSON"."""

    def __init__(self):
        self._hook: Callable[[str], Any] | None = None

    def render(self, url: str, mode: str = "text") -> str:
        if self._hook is None:
            raise RuntimeError(
                f"no web hook registered for offline test run (requested {url}); "
                "set gl.nondet.web._hook in the test"
            )
        result = self._hook(url)
        if isinstance(result, (dict, list)):
            import json

            return json.dumps(result)
        return result


class _Nondet:
    def __init__(self):
        self.web = _Web()
        self._llm_hook: Callable[[str], str] | None = None

    def exec_prompt(self, prompt: str) -> str:
        if self._llm_hook is None:
            raise RuntimeError(
                "no LLM hook registered for offline test run; "
                "set gl.nondet._llm_hook in the test"
            )
        return self._llm_hook(prompt)


nondet = _Nondet()


class _EqPrinciple:
    """In real GenLayer these run the wrapped closure on every validator and
    only accept the result once validators agree under the given equivalence
    rule. Single-process tests just call the closure once — the whole point
    of these tests is checking *what* gets fed to the closure, not the
    consensus mechanics."""

    @staticmethod
    def strict_eq(fn: Callable[[], Any]) -> Any:
        return fn()

    @staticmethod
    def prompt_non_comparative(fn: Callable[[], Any], *, task: str, criteria: str) -> Any:
        return fn()

    @staticmethod
    def prompt_comparative(fn: Callable[[], Any], *, task: str) -> Any:
        return fn()


eq_principle = _EqPrinciple()

__all__ = [
    "contract",
    "storage",
    "types",
    "vm",
    "Contract",
    "TreeMap",
    "DynArray",
    "Address",
    "u256",
    "UserError",
    "message",
    "public",
    "nondet",
    "eq_principle",
]
