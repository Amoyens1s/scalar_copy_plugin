(function () {
  "use strict";

  // Copy text to clipboard
  function copyText(text) {
    // Use modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("Copy successful!");
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          fallbackCopyText(text);
        });
    } else {
      // Fallback method
      fallbackCopyText(text);
    }
  }

  // Fallback copy method
  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        console.log("Copy successful!");
      } else {
        console.error("Copy failed!");
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }

    document.body.removeChild(textArea);
  }

  // Convert object to JSON string
  function getJSONCode(json, md = false) {
    if (!md) {
      return JSON.stringify(json, null, 4);
    } else {
      return "```json\n" + JSON.stringify(json, null, 4) + "\n```\n";
    }
  }

  // Concatenate markdown strings
  function jointMarkdown(markdown, str, prefix, suffix = "", indent = "") {
    if (indent === 1) {
      indent = "  ";
    } else if (indent === 2) {
      indent = "    ";
    } else if (indent === 3) {
      indent = "      ";
    } else if (indent === 4) {
      indent = "        ";
    } else if (indent === 5) {
      indent = "          ";
    } else if (indent === 6) {
      indent = "            ";
    }
    if (prefix) {
      markdown += indent + prefix + str + suffix;
    } else {
      markdown += indent + str + suffix;
    }
    return markdown;
  }

  // Convert markdown to html
  function markdownHtml(markdown) {
    // Simple markdown conversion implementation
    if (typeof window.markdownit !== "undefined") {
      const md = window.markdownit({
        html: true,
      });
      return md.render(markdown);
    }

    // Simple fallback implementation
    let html = markdown;
    // Handle headings
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    // Handle bold text
    html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>");
    // Handle code blocks
    html = html.replace(
      /```json([\s\S]*?)```/gim,
      '<pre><code class="language-json">$1</code></pre>'
    );
    html = html.replace(/`(.*?)`/gim, "<code>$1</code>");
    // Handle tables
    html = html.replace(/\|(.*)\|/gim, "<td>$1</td>");
    // Handle line breaks
    html = html.replace(/\n/gim, "<br>");
    return html;
  }

  // Render markdown
  function renderMarkdown(markdown, dom) {
    const html = markdownHtml(markdown);
    if (dom) {
      dom.innerHTML = html;
    } else {
      return html;
    }
  }

  // Parameters table markdown
  function parametersTableMd(parameters) {
    const head = `| Parameter | Description | Type | Default | Example | Required |`;
    const body = `| --- | --- | --- | --- | --- | --- |`;
    const rows = [];
    parameters.forEach((item) => {
      rows.push(
        `| ${item.name} | ${item?.description || ""} | ${item.schema.type} | ${
          item.schema?.default || ""
        } | ${item.schema?.example || ""} | ${item.required ? "Yes" : "No"} |`
      );
    });
    return [head, body, ...rows].join("\n");
  }

  // Properties table markdown
  function propertiesTableMd(properties, required) {
    const head = `| Parameter | Description | Type | Default | Example | Required |`;
    const body = `| --- | --- | --- | --- | --- | --- |`;
    const rows = [];
    for (let key in properties) {
      const isRequired = required?.includes(key);
      rows.push(
        `| ${key} | ${properties[key].description} | ${
          properties[key].type
        } | ${properties[key]?.default || ""} | ${properties[key].example} | ${
          isRequired ? "Yes" : "No"
        } |`
      );
    }
    return `${head}\n${body}\n${rows.join("\n")}\n`;
  }

  // Convert properties to JSON
  function propertiesToJson(properties) {
    const obj = {};
    for (let key in properties) {
      obj[key] = properties[key]?.example || properties[key].type;
    }
    return getJSONCode(obj, true);
  }

  // Get DTO
  function getDto(dto, openApi) {
    const dtoArr = openApi.components.schemas;
    return dtoArr[dto];
  }

  // Generate markdown
  function generaterMarkdown(api, apiMethod, url, openApi) {
    let markdown = "";
    // Title
    markdown = jointMarkdown(markdown, api.summary, "### ", "\n");

    const path = "**Endpoint**" + "`" + apiMethod + " " + url + "`";
    markdown = jointMarkdown(markdown, path, "", "\n\n");

    // post || put
    if ((apiMethod === "post" || apiMethod === "put") && api?.requestBody) {
      // Request
      if (api?.parameters && api.parameters.length) {
        markdown = jointMarkdown(markdown, "Request Parameters", "#### ", "\n");
        const paramsTable = parametersTableMd(api.parameters);
        markdown = jointMarkdown(markdown, paramsTable, "", "\n");
      }

      // Request body
      markdown = jointMarkdown(markdown, "Request Body", "#### ", "\n");

      const contentArr = Object.keys(api.requestBody.content);
      const ContentType = "**Content-Type**: " + "`" + contentArr[0] + "`";
      markdown = jointMarkdown(markdown, ContentType, "", "\n");

      if (api.requestBody.content[contentArr[0]]?.schema?.$ref) {
        const dtoStr = api.requestBody.content[contentArr[0]].schema.$ref
          .split("/")
          .at(-1);
        const dtoData = getDto(dtoStr, openApi);

        // Parameters table
        if (dtoData?.properties) {
          const paramsTable = propertiesTableMd(
            dtoData.properties,
            dtoData.required
          );
          markdown = jointMarkdown(markdown, paramsTable, "", "\n");
        }
      }

      // Response
      markdown = jointMarkdown(markdown, "Response", "#### ", "\n");

      for (const status in api.responses) {
        const statusStr = status + " - " + api.responses[status].description;
        markdown = jointMarkdown(markdown, statusStr, "##### ", "\n");

        if (api.responses[status]?.content) {
          const contentArr = Object.keys(api.responses[status].content);
          const ContentType = "**Content-Type**: " + "`" + contentArr[0] + "`";
          markdown = jointMarkdown(markdown, ContentType, "", "\n\n");

          markdown = jointMarkdown(markdown, "**响应体**", "", "\n");
          const responseBody =
            api.responses[status].content[contentArr[0]].schema;
          if (responseBody?.properties) {
            const responseJson = propertiesToJson(responseBody.properties);
            markdown = jointMarkdown(markdown, responseJson, "", "\n");
          } else if (responseBody?.$ref) {
            const dtoStr = responseBody.$ref.split("/").at(-1);
            const dtoData = getDto(dtoStr, openApi);
            const responseJson = propertiesToJson(dtoData.properties);
            markdown = jointMarkdown(markdown, responseJson, "", "\n");
          }
        } else {
          // Handle responses without content
          markdown = jointMarkdown(markdown, "No Response Body", "", "\n");
        }
      }
    } else {
      // Request
      if (api?.parameters && api.parameters.length) {
        const paramsTable = parametersTableMd(api.parameters);
        markdown = jointMarkdown(markdown, paramsTable, "", "\n");
      }

      // Response body
      for (const status in api.responses) {
        const statusStr = status + " - " + api.responses[status].description;
        markdown = jointMarkdown(markdown, statusStr, "##### ", "\n");

        if (api.responses[status]?.content) {
          const contentArr = Object.keys(api.responses[status].content);
          const ContentType = "**Content-Type**: " + "`" + contentArr[0] + "`";
          markdown = jointMarkdown(markdown, ContentType, "", "\n\n");

          markdown = jointMarkdown(markdown, "**响应体**", "", "\n");
          const responseBody =
            api.responses[status].content[contentArr[0]].schema;
          if (responseBody?.properties) {
            const responseJson = propertiesToJson(responseBody.properties);
            markdown = jointMarkdown(markdown, responseJson, "", "\n");
          } else if (responseBody?.$ref) {
            const dtoStr = responseBody.$ref.split("/").at(-1);
            const dtoData = getDto(dtoStr, openApi);
            const responseJson = propertiesToJson(dtoData.properties);
            markdown = jointMarkdown(markdown, responseJson, "", "\n");
          }
        } else {
          // Handle responses without content (such as 401, 404 status codes)
          if (status === "200") {
            markdown = jointMarkdown(markdown, "**响应体**", "", "\n");
            markdown = jointMarkdown(
              markdown,
              "No Response Body Content",
              "",
              "\n"
            );
          }
        }
      }
    }

    return markdown;
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Create copy button (shadcn ui style)
  function createCopyButton(text, title) {
    const button = document.createElement("button");
    button.textContent = title;
    button.style.cssText = `
      background-color: #f8fafc;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    `;

    // Hover effect
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#f1f5f9";
      button.style.borderColor = "#cbd5e1";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#f8fafc";
      button.style.borderColor = "#e2e8f0";
    });

    // Click effect
    button.addEventListener("click", () => {
      copyText(text);
      const originalText = button.textContent;
      const originalBg = button.style.backgroundColor;
      button.textContent = "✓ Copied";
      button.style.backgroundColor = "#dcfce7";
      button.style.borderColor = "#bbf7d0";

      // Restore original state after 2 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = originalBg;
        button.style.borderColor = "#e2e8f0";
      }, 2000);
    });

    return button;
  }

  // Get OpenAPI data
  function getOpenApiData() {
    const script = document.getElementById("api-reference");
    if (script) {
      try {
        return JSON.parse(script.textContent);
      } catch (e) {
        console.error("解析 OpenAPI 数据失败:", e);
      }
    }
    return null;
  }

  // Add copy buttons to interfaces
  function addCopyButtons(openApi) {
    // Find all interface sections
    const sections = document.querySelectorAll('section[id^="tag/"]');

    sections.forEach((section) => {
      const sectionId = section.id;
      // Extract tag and path information from section id
      const match = sectionId.match(/tag\/([^\/]+)\/(.+)/);
      if (match) {
        const tag = match[1];
        const pathInfo = match[2]; // method/path
        const [method, ...pathParts] = pathInfo.split("/");
        const path = "/" + pathParts.join("/");

        // Find corresponding OpenAPI data
        if (
          openApi &&
          openApi.paths &&
          openApi.paths[path] &&
          openApi.paths[path][method]
        ) {
          const api = openApi.paths[path][method];

          // Generate markdown
          const markdown = generaterMarkdown(api, method, path, openApi);

          // Find h3 heading element
          const heading = section.querySelector("h3.section-header-label");
          if (heading && !heading.querySelector(".copy-markdown-button")) {
            // Create copy button
            const copyButton = createCopyButton(markdown, "Copy Markdown");
            copyButton.classList.add("copy-markdown-button");

            // Add button next to heading
            heading.parentNode.style.display = "flex";
            heading.parentNode.style.alignItems = "center";
            heading.parentNode.style.gap = "12px";
            copyButton.style.marginLeft = "auto";
            heading.parentNode.appendChild(copyButton);
          }
        }
      }
    });
  }

  // Initialize plugin
  function init() {
    // Get OpenAPI data
    const openApi = getOpenApiData();
    if (!openApi) {
      console.error("OpenAPI data not found");
      return;
    }

    // Initial button addition
    addCopyButtons(openApi);

    // Create debounce function
    const debouncedAddButtons = debounce(() => {
      addCopyButtons(openApi);
    }, 100);

    // Listen for DOM changes, re-add buttons when URL changes
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new interface section is added
              if (
                (node.matches && node.matches('section[id^="tag/"]')) ||
                (node.querySelector &&
                  node.querySelector('section[id^="tag/"]'))
              ) {
                shouldUpdate = true;
              }
            }
          });
        }
      });

      if (shouldUpdate) {
        debouncedAddButtons();
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Listen for hashchange event (URL changes)
    window.addEventListener("hashchange", debouncedAddButtons);
  }

  // Initialize after page load completes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
