from __future__ import annotations

from django import forms
from django.utils.html import html_safe


@html_safe
class EasyMDEJSCDN:
    def __str__(self):
        return '<script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>'


@html_safe
class EasyMDECSSCDN:
    def __str__(self):
        return '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css">'


class EasyMDEWidget(forms.Widget):
    class Media:
        js = [EasyMDEJSCDN()]
        css = {"all": [EasyMDECSSCDN()]}

    template_name = "widgets/easymde_widget.html"

    def __init__(self, attrs=None, width=None, height=None):
        self.width = width
        self.height = height

        super().__init__(attrs=attrs)

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)

        context["widget"]["width"] = self.width
        context["widget"]["height"] = self.height

        return context
