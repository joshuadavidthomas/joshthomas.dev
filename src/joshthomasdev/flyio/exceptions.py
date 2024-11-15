from __future__ import annotations


class WritesAttemptedError(Exception):
    """Raised when anything other than reads are attempted.

    When running on Fly.io with LiteFS, only the primary app instance
    can attempt writes. This exception is raised when any machine
    besides the primary attempts a write, and assists in forwarding
    the write to the primary instance using Fly's replay header.
    """
