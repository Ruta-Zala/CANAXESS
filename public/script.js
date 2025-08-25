const app = document.querySelector("#app");
const dialog = document.querySelector(".dialog-violations");
const dialogViolationsList = dialog.querySelector(".dialog-violations__list");
const dialogViolationsTitle = dialog.querySelector(".dialog-violations__title");
const form = document.querySelector("#audit-form");
const urlsInput = document.querySelector("#urls");

// Helper function to convert to sentence case
const toSentenceCase = (string) => {
  return string
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const replaceHyphensWithSpaces = (string) => string.replace(/-/g, " ");

// Helper function to escape HTML
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 🔹 Listen for form submit
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  app.innerHTML = "<p>Running audit, please wait...</p>";

  const urls = urlsInput.value
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (!urls.length) {
    app.innerHTML = "<p>Please enter at least one URL.</p>";
    return;
  }

  try {
    // 🔹 Call audit API
    const response = await fetch("http://localhost:8080/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "test" },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const err = await response.json();
      app.innerHTML = `<p>Error: ${err.error || response.statusText}</p>`;
      return;
    }

    const data = await response.json();
    renderReport(data);
  } catch (err) {
    app.innerHTML = `<p>Request failed: ${err.message}</p>`;
  }
});

function renderReport(data) {
  const numberOfURLsTested = data?.numberOfURLsTested;
  const allViolations = data?.violations;
  const numberOfViolations = allViolations.length;

  // Group violations by type
  const violationsByType = allViolations.reduce((acc, violation) => {
    if (!acc[violation.id]) {
      acc[violation.id] = [];
    }
    acc[violation.id].push(violation);
    return acc;
  }, {});

  // Create variables for each violation type dynamically
  const violationTypes = Object.keys(violationsByType);
  const violationVariables = violationTypes.reduce((acc, type) => {
    acc[type] = violationsByType[type];
    return acc;
  }, {});

  // Get unique URLs with violations
  const uniqueURLsWithViolations = [
    ...new Set(allViolations.map((violation) => violation.url)),
  ];

  // Count the number of issues for each impact level
  const impactCounts = allViolations.reduce((acc, violation) => {
    const impact = violation.impact || "unknown";
    if (!acc[impact]) {
      acc[impact] = 0;
    }
    acc[impact] += 1;
    return acc;
  }, {});

  // Set the content of the app element
  app.innerHTML = `
    <h2 id="summary">Summary</h2>
    <h3>URLs with violations</h3>
    <p>We tested <strong>${numberOfURLsTested} URLs</strong> and found <strong>${
    uniqueURLsWithViolations.length
  } URLs</strong> with accessibility violations <strong>(${(
    (uniqueURLsWithViolations.length / numberOfURLsTested) *
    100
  ).toFixed(2)}%</strong> of URLs).</p>
    <p>The total number of violations found was <strong>${numberOfViolations}</strong></p>

    <h3>Issues by Impact</h3>
    <ul>
      ${Object.entries(impactCounts)
        .map(
          ([impact, count]) => `
        <li>${toSentenceCase(impact)}: ${count}</li>
      `
        )
        .join("")}
    </ul>

    <h3>Issues by Type</h3>
    <ul>
      ${violationTypes
        .map(
          (type) => `
        <li>
          ${violationVariables[type].length} ${replaceHyphensWithSpaces(
            toSentenceCase(type)
          )}
        </li>
      `
        )
        .join("")}
    </ul>

    <h3>URLs with Violations</h3>
    <ul>
      ${uniqueURLsWithViolations
        .map(
          (url) => `
        <li>
          <a href="${url}">${url}</a>
        </li>
      `
        )
        .join("")}
    </ul>

    <h2 id="violations">Accessibility Violations</h2>
    <div class="grid">
    ${violationTypes
      .map(
        (type) => `
      <article class="violations">
        <h3>${toSentenceCase(replaceHyphensWithSpaces(type))}</h3>
        <p>There are <strong>${
          violationVariables[type].length
        } ${type} violations</strong> across <strong>${
          uniqueURLsWithViolations.length
        } URLs</strong>.</p>
        <p>Impact: <span class="impact impact--${
          violationVariables[type][0]["impact"]
        }">${toSentenceCase(violationVariables[type][0]["impact"])}</span></p>
        <p>Description: ${violationVariables[type][0]["description"]}</p>
        <ol class="violations__list">
          ${violationVariables[type]
            .map(
              (violation, index) => `
            <li>
              <a href="${violation.url}">${violation.url}</a>
              <ul>
                <li>Instances: ${violation.nodes.length} - <button data-index="${index}" data-type="${type}" class="view-violations" type="button">View All</button></li>
              </ul>
            </li>
          `
            )
            .join("")}
        </ol>
      </article>
    `
      )
      .join("")}
    </div>
    <h2 id="sites">Sites (Accessibility Violations)</h2>
    <div class="grid">
    ${uniqueURLsWithViolations
      .map(
        (url) => `
      <article class="violations">
        <h3>${url.replace("https://", "")}</h3>
        <ol class="violations__list">
          ${allViolations
            .filter((violation) => violation.url === url)
            .map(
              (violation) => `
            <li>
              <span>${toSentenceCase(
                replaceHyphensWithSpaces(violation.id)
              )}</span>
              <span class="impact impact--${violation.impact}">${toSentenceCase(
                violation.impact
              )}</span>
              <ul>
                <li>Instances: ${
                  violation.nodes.length
                } - <button data-index="${violationVariables[
                violation.id
              ].findIndex((v) => v.url === url)}" data-type="${
                violation.id
              }" class="view-violations" type="button">View All</button></li>
              </ul>
            </li>
          `
            )
            .join("")}
        </ol>
      </article>
    `
      )
      .join("")}
    </div>
  `;

  // Event listener for the view violations buttons
  document.querySelectorAll(".view-violations").forEach((button) => {
    button.addEventListener("click", (event) => {
      const type = event.target.getAttribute("data-type");
      const index = event.target.getAttribute("data-index");
      const violation = violationVariables[type][index];
      const numberOfInstances = violation.nodes.length;
      const violationSummary = violation.nodes[0]["failureSummary"];
      dialogViolationsList.innerHTML = "";
      dialogViolationsTitle.innerHTML = "";

      dialogViolationsTitle.innerHTML = `
        <h2>${numberOfInstances} ${toSentenceCase(
        replaceHyphensWithSpaces(type)
      )} Violations</h2>
        <p>URL: <a href="${violation.url}">${violation.url}</a></p>
        <p>Summary: ${violationSummary}</p>
      `;

      violation.nodes.forEach((node) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <ul>
            <li><strong>HTML:</strong> <code>${escapeHtml(
              node.html
            )}</code></li>
            <li><strong>Target:</strong> ${node.target.join(" > ")}</li>
          </ul>
        `;
        dialogViolationsList.appendChild(listItem);
      });

      dialog.showModal();
    });
  });

  // Event listener for the close dialog button
  dialog
    .querySelector(".dialog-violations__close")
    .addEventListener("click", () => {
      document.querySelector(".dialog-violations").close();
    });
}
