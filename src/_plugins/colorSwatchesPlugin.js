import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

function extractColorVariables(cssContent) {
  const colorVars = {};

  const themeSectionMatch = cssContent.match(
    /@layer\s+theme\s*{[^{]*:root\s*,\s*:host\s*{([^}]+)}/,
  );

  if (!themeSectionMatch) {
    console.warn(
      "Could not find @layer theme { :root, :host { section in CSS for color variables.",
    );
    return colorVars;
  }

  const themeSection = themeSectionMatch[1];
  const regex = /--color-([^:]+):\s*([^;]+);/g;
  let match;

  while ((match = regex.exec(themeSection)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    colorVars[name] = value;
  }

  return colorVars;
}

function groupColorsByPrefix(colorVars) {
  const colorGroups = {};

  for (const [name, value] of Object.entries(colorVars)) {
    const groupMatch = name.match(/^([^-]+)(?:-|$)/);
    const groupName = groupMatch ? groupMatch[1] : "other";

    if (!colorGroups[groupName]) {
      colorGroups[groupName] = {};
    }

    colorGroups[groupName][name] = value;
  }

  return colorGroups;
}

function sortColorGroups(colorGroups) {
  const sortedGroups = {};
  const sortedGroupNames = Object.keys(colorGroups).sort();

  for (const groupName of sortedGroupNames) {
    const groupColors = colorGroups[groupName];
    const sortedColorNames = sortColorNames(Object.keys(groupColors));

    sortedGroups[groupName] = {};
    for (const name of sortedColorNames) {
      sortedGroups[groupName][name] = groupColors[name];
    }
  }

  return sortedGroups;
}

function sortColorNames(names) {
  return names.sort((a, b) => {
    const aSegments = a.split("-");
    const bSegments = b.split("-");
    const minSegments = Math.min(aSegments.length, bSegments.length);

    for (let i = 1; i < minSegments; i++) {
      const aSegment = aSegments[i];
      const bSegment = bSegments[i];
      const aIsNumeric = /^\d+$/.test(aSegment);
      const bIsNumeric = /^\d+$/.test(bSegment);

      if (aIsNumeric && bIsNumeric) {
        const diff = Number.parseInt(aSegment) - Number.parseInt(bSegment);
        if (diff !== 0) return diff;
      } else if (aIsNumeric && !bIsNumeric) {
        return 1;
      } else if (!aIsNumeric && bIsNumeric) {
        return -1;
      } else {
        const diff = aSegment.localeCompare(bSegment);
        if (diff !== 0) return diff;
      }
    }

    if (aSegments.length !== bSegments.length) {
      return aSegments.length - bSegments.length;
    }

    return a.localeCompare(b);
  });
}

function generateSwatchesHTML(colorGroups) {
  let swatchesHtml = "";
  const sortedGroupNames = Object.keys(colorGroups);

  for (const groupName of sortedGroupNames) {
    const groupColors = colorGroups[groupName];
    const colorCount = Object.keys(groupColors).length;

    swatchesHtml += `
        <h3 class="capitalize">${groupName} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${colorCount} colors)</span></h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-1">
      `;

    for (const [name, value] of Object.entries(groupColors)) {
      swatchesHtml += `
          <div class="color-swatch">
            <div class="size-16 rounded-md shadow-${name}-md" style="background-color: var(--color-${name})"></div>
            <div class="mt-2">
              <p class="font-mono text-sm truncate">${name.replace("tokyonight-", "")}</p>
            </div>
          </div>
        `;
    }

    swatchesHtml += `
        </div>
      `;
  }

  return swatchesHtml;
}

function replaceSwatchMarkers(content, swatchesHtml) {
  const startMarker = "<!-- color-swatches-start -->";
  const endMarker = "<!-- color-swatches-end -->";

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.warn("Color swatch markers not found in design system HTML.");
    return content;
  }

  return (
    content.substring(0, startIndex + startMarker.length) +
    swatchesHtml +
    content.substring(endIndex)
  );
}

function generateColorSwatches(content, page, options) {
  if (!page.outputPath || !page.outputPath.endsWith(options.pagePath)) {
    return content;
  }

  const cssPath = path.join(
    dirname(fileURLToPath(import.meta.url)),
    "../../dist/static/css/style.css",
  );
  if (!fs.existsSync(cssPath)) {
    return content;
  }

  try {
    const cssContent = fs.readFileSync(cssPath, "utf8");
    const colorVars = extractColorVariables(cssContent);
    const colorGroups = groupColorsByPrefix(colorVars);
    const sortedGroups = sortColorGroups(colorGroups);
    const swatchesHtml = generateSwatchesHTML(sortedGroups);
    const newContent = replaceSwatchMarkers(content, swatchesHtml);

    console.log(
      `Inserted ${Object.keys(colorVars).length} color swatches into design system, grouped into ${Object.keys(sortedGroups).length} categories.`,
    );

    return newContent;
  } catch (error) {
    console.error("Error generating color swatches:", error);
    return content;
  }
}

export default function colorSwatchesPlugin(eleventyConfig, options) {
  eleventyConfig.addTransform("generate-color-swatches", function (content) {
    return generateColorSwatches(content, this.page, options);
  });
}
