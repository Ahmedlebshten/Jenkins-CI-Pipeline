// DOM Elements
const shortenForm = document.getElementById("shortenForm");
const urlInput = document.getElementById("urlInput");
const shortenBtn = document.getElementById("shortenBtn");
const resultDiv = document.getElementById("result");
const shortUrlDisplay = document.getElementById("shortUrlDisplay");
const originalUrlDisplay = document.getElementById("originalUrlDisplay");
const copyBtn = document.getElementById("copyBtn");

// Form submission handler
shortenForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = urlInput.value.trim();

  if (!url) {
    showError("Please enter a URL");
    return;
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    showError("Please enter a valid URL (include http:// or https://)");
    return;
  }

  // Show loading state
  shortenBtn.classList.add("loading");
  shortenBtn.disabled = true;
  resultDiv.classList.remove("show");
  resultDiv.classList.add("hidden");

  try {
    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to shorten URL");
    }

    // Display result
    shortUrlDisplay.value = data.shortUrl;
    originalUrlDisplay.textContent = data.originalUrl;

    resultDiv.classList.remove("hidden");
    setTimeout(() => {
      resultDiv.classList.add("show");
    }, 10);

    // Reset copy button
    resetCopyButton();
  } catch (error) {
    showError(error.message);
  } finally {
    shortenBtn.classList.remove("loading");
    shortenBtn.disabled = false;
  }
});

// Copy to clipboard handler
copyBtn.addEventListener("click", async () => {
  const shortUrl = shortUrlDisplay.value;

  try {
    await navigator.clipboard.writeText(shortUrl);

    // Update button to show success
    const copyText = copyBtn.querySelector(".copy-text");
    copyText.textContent = "Copied!";
    copyBtn.classList.add("copied");

    // Reset after 2 seconds
    setTimeout(() => {
      resetCopyButton();
    }, 2000);
  } catch (error) {
    // Fallback for older browsers
    shortUrlDisplay.select();
    document.execCommand("copy");

    const copyText = copyBtn.querySelector(".copy-text");
    copyText.textContent = "Copied!";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      resetCopyButton();
    }, 2000);
  }
});

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
}

// Helper function to show error
function showError(message) {
  alert(message);
}

// Helper function to reset copy button
function resetCopyButton() {
  const copyText = copyBtn.querySelector(".copy-text");
  copyText.textContent = "Copy";
  copyBtn.classList.remove("copied");
}

// Auto-focus input on page load
window.addEventListener("load", () => {
  urlInput.focus();
});
