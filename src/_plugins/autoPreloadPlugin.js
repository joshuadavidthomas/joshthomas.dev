// https://github.com/nhoizey/eleventy-plugin-auto-preload
// MIT License
//
// Copyright (c) 2022 Nicolas Hoizey
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { parseHTML } from "linkedom";

export default async (eleventyConfig) => {
  eleventyConfig.addTransform("autopreload", async (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) {
      return content;
    }

    const { document } = parseHTML(content);

    // Find first non SVG image with fetchpriority="high"
    const image = document.querySelector(
      'img:not([src$=svg])[fetchpriority="high"]',
    );
    if (!image) {
      return content;
    }

    // Prepare a new link for preload
    const link = document.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute("as", "image");
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("crossorigin", "anonymous");

    // Check if this is a responsive images
    const srcset = image.getAttribute("srcset");
    const sizes = image.getAttribute("sizes");

    if (srcset && sizes) {
      // imagesrcset & imagesizes attributes for responsive images
      // https://web.dev/preload-responsive-images/
      link.setAttribute("imagesrcset", srcset);
      link.setAttribute("imagesizes", sizes);
    } else {
      // Check if there's at least a src
      const src = image.getAttribute("src");
      if (!src) {
        return content;
      }

      // href atribute for non responsive image
      link.setAttribute("href", src);
    }

    const title = document.querySelector("title");
    title.insertAdjacentElement("afterend", link);

    return document.toString();
  });
};
