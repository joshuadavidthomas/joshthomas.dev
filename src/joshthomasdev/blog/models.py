from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.utils.text import slugify

from joshthomasdev.core.markdown import md
from joshthomasdev.core.models import TimeStamped

from .managers import EntryQuerySet


class Post(TimeStamped, models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=75, blank=True, unique=True)
    tags = models.ManyToManyField("blog.Tag", blank=True)
    published_at = models.DateTimeField(
        blank=True, null=True, help_text="Date and time to publish the entry"
    )

    class Meta:
        abstract = True

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            if self._meta.model.objects.filter(slug=self.slug).exists():  # type: ignore[attr-defined]
                self.slug += f"-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)


class Entry(models.Model):
    __yamdl__ = True

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=75, blank=True, unique=True)
    summary = models.TextField(blank=True)
    content = models.TextField()
    published_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    objects = EntryQuerySet.as_manager()

    class Meta:
        verbose_name_plural = "entries"

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        if self.published_at:
            url = f"/blog/{self.published_at.year}/{self.slug}/"
        else:
            url = f"/blog/drafts/{self.slug}/"
        return url

    @mark_safe
    def render_summary(self):
        return md.render(self.summary)

    @mark_safe
    def render_content(self):
        return md.render(self.content)


class Link(Post):
    url = models.URLField()
    via_title = models.CharField(max_length=255, blank=True)
    via_url = models.URLField(blank=True)
    comments = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return self.url

    @mark_safe
    def render_comments(self):
        return md.render(self.comments)


class Tag(TimeStamped, models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(blank=True, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
