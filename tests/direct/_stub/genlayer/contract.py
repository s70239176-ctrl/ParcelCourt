"""Offline stand-in for `genlayer.contract` (`gl.contract.Contract`)."""

from __future__ import annotations

from typing import Any

from .storage import DynArray, TreeMap
from .types import Address, u256


def _default_for_annotation(annotation) -> Any:
    """Storage fields are declared as class-level type annotations
    (`claims: gl.storage.TreeMap[u256, dict]`) rather than assigned in real
    GenLayer contracts — the runtime allocates them. This stub mimics that
    by zero-valuing known container/scalar types before the subclass's own
    __init__ body runs."""
    origin = getattr(annotation, "__origin__", annotation)
    if origin in (TreeMap, dict):
        return TreeMap()
    if origin in (DynArray, list):
        return DynArray()
    if origin is u256 or annotation is u256:
        return u256(0)
    if annotation is str:
        return ""
    if annotation is Address:
        return Address("0x0")
    if annotation is bool:
        return False
    return None


class Contract:
    """Stand-in for gl.contract.Contract. Populates typed storage fields
    (declared as class annotations, GenLayer-style) with zero values before
    the subclass's __init__ body runs, so `self.claims[...] = ...` etc. work
    — WITHOUT requiring the subclass to call super().__init__() (real
    GenLayer contracts never do; the runtime handles this itself)."""

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        original_init = cls.__dict__.get("__init__")
        if original_init is None:
            return

        def wrapped_init(self, *args, **kwargs):
            for klass in reversed(type(self).__mro__):
                for name, annotation in getattr(klass, "__annotations__", {}).items():
                    if not hasattr(self, name):
                        setattr(self, name, _default_for_annotation(annotation))
            original_init(self, *args, **kwargs)

        cls.__init__ = wrapped_init
