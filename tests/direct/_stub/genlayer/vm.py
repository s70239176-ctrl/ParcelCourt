"""Offline stand-in for `genlayer.vm` (`gl.vm.UserError`)."""


class UserError(Exception):
    """Raised for expected, user-facing reverts (bad input, double
    adjudication, unknown claim/role) as opposed to internal bugs."""
