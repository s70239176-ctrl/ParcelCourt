"""Offline stand-in for `genlayer.types` (`from genlayer.types import *`)."""

from __future__ import annotations


class Address(str):
    """String-like address. Real GenLayer addresses are 0x-hex; for tests we
    accept any string so fixtures can use readable names like 'seller-1'."""

    def __new__(cls, value):
        return str.__new__(cls, str(value))

    @property
    def as_hex(self) -> str:
        return str(self)


class u256(int):
    """Unsigned 256-bit int stand-in — plain Python int is plenty for tests."""

    def __new__(cls, value=0):
        return int.__new__(cls, int(value))


__all__ = ["Address", "u256"]
