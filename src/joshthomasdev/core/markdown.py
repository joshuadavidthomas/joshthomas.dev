from __future__ import annotations

from markdown_it import MarkdownIt
from mdit_py_plugins.admon import admon_plugin
from mdit_py_plugins.anchors import anchors_plugin
from mdit_py_plugins.footnote import footnote_plugin
from mdit_py_plugins.front_matter import front_matter_plugin
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name


def highlight_code(code, name, attrs):
    lexer = get_lexer_by_name(name)
    formatter = HtmlFormatter()
    return highlight(code, lexer, formatter)


md = (
    MarkdownIt(
        "commonmark",
        {"html": True, "highlight": highlight_code},
    )
    .use(admon_plugin)
    .use(
        anchors_plugin,
        max_level=4,
        permalink=True,
        permalinkSymbol="#",
    )
    .use(footnote_plugin)
    .use(front_matter_plugin)
    .enable(["table"])
)
