"""Offline stand-in for `genlayer.storage` (`gl.storage.TreeMap` / `DynArray`)."""

from __future__ import annotations

from typing import Generic, TypeVar

_K = TypeVar("_K")
_V = TypeVar("_V")


class TreeMap(Generic[_K, _V], dict):
    """Ordered on-chain map stand-in. Real TreeMap iterates in key order;
    Python dicts preserve insertion order, which is good enough for the
    ascending claim-id inserts used here."""

    def items(self):
        return sorted(dict.items(self), key=lambda kv: kv[0])


class DynArray(list):
    """Dynamic array stand-in."""


def allow(cls):
    """@gl.storage.allow marks a class as valid for use as a TreeMap/DynArray
    value type in real GenLayer storage (plain, undecorated classes are
    rejected by GenVM's real storage builder with "class is not marked for
    usage within storage, please annotate it with @allow" — see
    contracts/parcel_court.py's Claim/EvidenceRow, and genlayer-py PR #96's
    v0.2->v0.3 migration notes: "@allow_storage -> @gl.storage.allow").
    No-op passthrough here: this stub doesn't model GenVM's storage layout,
    it just needs Claim/EvidenceRow to behave like ordinary dataclasses."""
    return cls


__all__ = ["TreeMap", "DynArray", "allow"]
