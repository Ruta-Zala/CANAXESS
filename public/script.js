const app = document.querySelector("#app");
const dialog = document.querySelector(".dialog-violations");
const dialogViolationsList = dialog.querySelector(".dialog-violations__list");
const dialogViolationsTitle = dialog.querySelector(".dialog-violations__title");
const form = document.querySelector("#audit-form");
const urlInputsContainer = document.querySelector("#url-inputs");
const submitButton = form.querySelector("button[type='submit']");

// Helper function to convert to sentence case
const toSentenceCase = (string) => {
  return string
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to replace hyphens with spaces
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

// Show loading state
const showLoading = () => {
  app.innerHTML = `
    <div class="loading" aria-live="polite">
      <span class="spinner"></span>
      <p>Running audit, please wait...</p>
    </div>
  `;
  submitButton.disabled = true;
  submitButton.textContent = "Auditing...";
};

// Hide loading state
const hideLoading = () => {
  submitButton.disabled = false;
  submitButton.textContent = "Run Audit";
};

// ---------------------- URL Input Handling ----------------------

let urlCount = 1;

// Function to create a new URL input group
function createUrlInput(id) {
  const urlInputGroup = document.createElement("div");
  urlInputGroup.className = "url-input-group";
  urlInputGroup.innerHTML = `
    <label for="url-${id}">Enter URL:</label>
    <input type="url" id="url-${id}" name="url-${id}" placeholder="https://example.com" aria-describedby="urls-help">
    <div class="url-actions"></div>
  `;
  return urlInputGroup;
}

// Refresh the action buttons (add/remove) based on number of fields
function updateUrlInputButtons() {
  const groups = urlInputsContainer.querySelectorAll(".url-input-group");
  groups.forEach((group, index) => {
    const actionsContainer = group.querySelector(".url-actions");
    actionsContainer.innerHTML = "";

    if (groups.length === 1) {
      // Only one field → Add button only
      actionsContainer.innerHTML = `
        <button type="button" class="add-url" aria-label="Add URL">＋</button>
      `;
    } else {
      // More than one field
      if (index === groups.length - 1) {
        // Last field → Remove + Add
        actionsContainer.innerHTML = `
          <button type="button" class="remove-url" aria-label="Remove URL">✕</button>
          <button type="button" class="add-url" aria-label="Add URL">＋</button>
        `;
      } else {
        // Middle fields → Remove only
        actionsContainer.innerHTML = `
          <button type="button" class="remove-url" aria-label="Remove URL">✕</button>
        `;
      }
    }
  });
}

// Initialize with one input
urlInputsContainer.innerHTML = "";
urlInputsContainer.appendChild(createUrlInput(0));
updateUrlInputButtons();

// Handle clicks on Add/Remove
urlInputsContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("add-url")) {
    urlInputsContainer.appendChild(createUrlInput(urlCount));
    urlCount++;
    updateUrlInputButtons();
  }
  if (event.target.classList.contains("remove-url")) {
    event.target.closest(".url-input-group").remove();
    updateUrlInputButtons();
  }
});

// ---------------------- Form Submit ----------------------

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showLoading();

  const urlInputs = urlInputsContainer.querySelectorAll("input[type='url']");
  const urls = Array.from(urlInputs)
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (!urls.length) {
    app.innerHTML =
      "<p class='error' role='alert'>Please enter at least one URL.</p>";
    hideLoading();
    return;
  }

  try {
    // Call audit API
    const response = await fetch("http://localhost:8080/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "test" },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const err = await response.json();
      app.innerHTML = `<p class='error' role='alert'>Error: ${
        err.error || response.statusText
      }</p>`;
      hideLoading();
      return;
    }

    const data = await response.json();
    renderReport(data);
    hideLoading();
  } catch (err) {
    app.innerHTML = `<p class='error' role='alert'>Request failed: ${err.message}</p>`;
    hideLoading();
  }
});

// ---------------------- Render Report ----------------------

function renderReport(data) {
  const numberOfURLsTested = data?.numberOfURLsTested;
  const allViolations = data?.violations;
  const summary = data?.summary;
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
  const uniqueURLsWithViolations = [...new Set(summary)];

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
    <section aria-labelledby="summary">
      <h2 id="summary">Summary</h2>
      <p>We tested <strong>${numberOfURLsTested} URLs</strong> and found <strong>${
    uniqueURLsWithViolations.length
  } URLs</strong> with accessibility violations <strong>(${(
    (uniqueURLsWithViolations.length / numberOfURLsTested) *
    100
  ).toFixed(2)}%</strong> of URLs).</p>
      <p>The total number of violations found was <strong>${numberOfViolations}</strong>.</p>
      <h3>URLs with Violations</h3>
      <ul class="url-list">
        ${uniqueURLsWithViolations
          .map(
            ({ url, totalViolations }) => `
          <li>
            <a href="${url}" target="_blank" rel="noopener">${url}</a>
            <div>Total Violations: ${totalViolations}</div>
          </li>
        `
          )
          .join("")}
      </ul>
    </section>

    <section aria-labelledby="sites">
      <h2 id="sites">Sites (Accessibility Violations)</h2>
      <div class="grid">
        ${uniqueURLsWithViolations
          .map(
            ({ url }) => `
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
                  <span class="impact impact--${
                    violation.impact
                  }">${toSentenceCase(violation.impact)}</span>
                  <ul>
                    <li>Instances: ${
                      violation.nodes.length
                    } - <button data-index="${violationVariables[
                    violation.id
                  ].findIndex((v) => v.url === url)}" data-type="${
                    violation.id
                  }" class="view-violations" type="button">View Details</button></li>
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
    </section>
    <section aria-labelledby="violations">
      <h2 id="violations">Accessibility Violations</h2>
      <div class="grid">
        ${violationTypes
          .map(
            (type) => `
          <article class="violations">
            <h3>${toSentenceCase(replaceHyphensWithSpaces(type))}</h3>
            <p><strong>${
              violationVariables[type].length
            } violations</strong> across <strong>${
              uniqueURLsWithViolations.length
            } URLs</strong>.</p>
            <p><span class="impact impact--${
              violationVariables[type][0]["impact"]
            }">${toSentenceCase(
              violationVariables[type][0]["impact"]
            )}</span></p>
            <p class="description">Description: ${
              violationVariables[type][0]["description"]
            }</p>
            <ol class="violations__list">
              ${violationVariables[type]
                .map(
                  (violation, index) => `
                <li>
                  <a href="${violation.url}" target="_blank" rel="noopener">${violation.url}</a>
                  <ul>
                    <li>Instances: ${violation.nodes.length} - <button data-index="${index}" data-type="${type}" class="view-violations" type="button">View Details</button></li>
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
    </section>
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
        <p><a href="${violation.url}" target="_blank" rel="noopener">${
        violation.url
      }</a></p>
        <p class="description">Summary: ${violationSummary}</p>
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
