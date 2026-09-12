import importlib
import importlib.util
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_STUB_DIR = os.path.join(_HERE, "_stub")


def _real_genlayer_usable() -> bool:
    """Whether a real, usable `genlayer` package (the one contracts actually
    `import genlayer as gl` against, exposing `gl.contract.Contract`) is
    importable.

    NOTE: `pip install genlayer` resolves to PyPI's `genlayer==0.0.1`, a
    placeholder package GenLayer Labs uploaded once to reserve the name —
    it has no `contract`, no `Contract`, nothing (see
    https://pypi.org/project/genlayer/). Contracts only get a real,
    functional `genlayer` when executed inside GenVM (i.e. via GenLayer
    Studio / `gltest`), never from a bare local `import genlayer`. So
    checking `find_spec("genlayer") is not None` isn't enough — that
    placeholder always satisfies it. We have to actually try the import and
    check `genlayer.contract.Contract` is present and usable.
    """
    if importlib.util.find_spec("genlayer") is None:
        return False
    try:
        module = importlib.import_module("genlayer")
        return hasattr(module, "contract") and hasattr(module.contract, "Contract")
    except ImportError:
        return False


# Fall back to the offline stub unless a real, usable `genlayer` (with an
# actual `contract.Contract`) is on the path. This makes `pytest tests/direct`
# runnable with zero network access / zero GenVM for CI/sandbox purposes.
if not _real_genlayer_usable():
    # _real_genlayer_usable() may have already imported (and cached) the
    # unusable/placeholder `genlayer` module. If we don't evict it from
    # sys.modules, later `import genlayer as gl` calls will keep hitting
    # that cached, gl-less module regardless of sys.path order.
    for name in [m for m in sys.modules if m == "genlayer" or m.startswith("genlayer.")]:
        del sys.modules[name]
    sys.path.insert(0, _STUB_DIR)

# contracts/ needs to be importable as `parcel_court`.
_CONTRACTS_DIR = os.path.abspath(os.path.join(_HERE, "..", "..", "contracts"))
sys.path.insert(0, _CONTRACTS_DIR)
