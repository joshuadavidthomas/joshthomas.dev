from __future__ import annotations

from typing import Any
from typing import Callable

from django.db.backends.base.base import BaseDatabaseWrapper

from .exceptions import WritesAttemptedError


def install_hook(connection: BaseDatabaseWrapper, **kwargs: object) -> None:
    if connection.alias == "yamdl":
        return
    if blocker not in connection.execute_wrappers:
        connection.execute_wrappers.insert(0, blocker)


def blocker(
    execute: Callable[[str, str, bool, dict[str, Any]], Any],
    sql: str,
    params: str,
    many: bool,
    context: dict[str, Any],
) -> Any:
    should_block = not sql.lstrip(" \n(").startswith(
        (
            "EXPLAIN ",
            "PRAGMA ",
            "ROLLBACK TO SAVEPOINT ",
            "RELEASE SAVEPOINT ",
            "SAVEPOINT ",
            "SELECT ",
            "SET ",
        )
    ) and sql not in ("BEGIN", "COMMIT", "ROLLBACK")

    if should_block:
        raise WritesAttemptedError

    return execute(sql, params, many, context)
