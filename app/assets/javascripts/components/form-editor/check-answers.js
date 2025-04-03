class CheckAnswers {
  constructor() {
    this.container = document.getElementById("check-answers-container");
    this.summaryListsContainer = document.getElementById(
      "summary-lists-container"
    );
    this.formPages = [];
    this.formAnswers = {};
    this.initialize();
  }

  initialize() {
    // Get form pages and answers from session storage
    const pagesData = sessionStorage.getItem("formPages");
    const answersData = sessionStorage.getItem("formAnswers");

    if (pagesData) {
      try {
        this.formPages = JSON.parse(pagesData);
        this.formAnswers = answersData ? JSON.parse(answersData) : {};
        console.log("Loaded form pages:", this.formPages);
        console.log("Loaded form answers:", this.formAnswers);
        this.renderPage();
      } catch (error) {
        console.error("Error parsing form data:", error);
        this.showError("Error loading form data");
      }
    } else {
      this.showError("No form data found");
    }
  }

  renderPage() {
    if (!this.container) return;

    // Add notification banner
    const notificationBanner = this.createNotificationBanner();
    this.container.insertBefore(notificationBanner, this.container.firstChild);

    // Add back link
    const backLink = document.createElement("a");
    backLink.href = "javascript:window.history.back()";
    backLink.className = "govuk-back-link govuk-!-margin-bottom-4";
    backLink.textContent = "Back";
    this.container.insertBefore(backLink, notificationBanner);

    // Render summary lists for each page
    this.formPages.forEach((page, index) => {
      if (page.questions && page.questions.length > 0) {
        // Create a summary list for each question instead of grouping by page
        page.questions.forEach((question) => {
          const summaryList = this.createSummaryList([question], index);
          this.summaryListsContainer.appendChild(summaryList);
        });
      }
    });
  }

  createNotificationBanner() {
    const notificationBanner = document.createElement("div");
    notificationBanner.className = "govuk-notification-banner";
    notificationBanner.setAttribute("role", "region");
    notificationBanner.setAttribute(
      "aria-labelledby",
      "govuk-notification-banner-title"
    );
    notificationBanner.setAttribute("data-module", "govuk-notification-banner");
    notificationBanner.setAttribute("data-govuk-notification-banner-init", "");

    const notificationBannerHeader = document.createElement("div");
    notificationBannerHeader.className = "govuk-notification-banner__header";

    const notificationBannerTitle = document.createElement("h2");
    notificationBannerTitle.className = "govuk-notification-banner__title";
    notificationBannerTitle.setAttribute(
      "id",
      "govuk-notification-banner-title"
    );
    notificationBannerTitle.textContent = "Important";

    const notificationBannerContent = document.createElement("div");
    notificationBannerContent.className = "govuk-notification-banner__content";

    const notificationBannerHeading = document.createElement("p");
    notificationBannerHeading.className =
      "govuk-notification-banner__heading govuk-!-margin-bottom-0";
    notificationBannerHeading.textContent =
      "This is a preview of a draft form page you are editing";

    const notificationBannerLinkContainer = document.createElement("p");
    notificationBannerLinkContainer.className =
      "govuk-notification-banner__heading govuk-!-margin-top-1 js-preview-banner-close";

    const notificationBannerLink = document.createElement("a");
    notificationBannerLink.className = "govuk-link--no-visited-state";
    notificationBannerLink.href = "/form-editor/listing";
    notificationBannerLink.textContent = "Go back to the editor";

    const notificationBannerText = document.createElement("p");
    notificationBannerText.className = "govuk-body govuk-!-margin-top-2";
    notificationBannerText.textContent =
      "It depends on answers from earlier pages in the form. In the live version, users will need to complete those questions first.";

    notificationBannerHeader.appendChild(notificationBannerTitle);
    notificationBannerLinkContainer.appendChild(notificationBannerLink);
    notificationBannerContent.appendChild(notificationBannerHeading);
    notificationBannerContent.appendChild(notificationBannerLinkContainer);
    notificationBannerContent.appendChild(notificationBannerText);
    notificationBanner.appendChild(notificationBannerHeader);
    notificationBanner.appendChild(notificationBannerContent);

    return notificationBanner;
  }

  createSummaryList(questions, pageIndex) {
    const dl = document.createElement("dl");
    dl.className = "govuk-summary-list";

    questions.forEach((question) => {
      const row = document.createElement("div");
      row.className = "govuk-summary-list__row";

      const key = document.createElement("dt");
      key.className = "govuk-summary-list__key";
      key.textContent = question.label;

      const value = document.createElement("dd");
      value.className = "govuk-summary-list__value";

      // Get the answer for this question if it exists
      const questionId = `question-${question.questionId}`;
      const answer = this.formAnswers[questionId];

      // Handle different question types
      let displayAnswer = "[No answer provided]";
      if (answer) {
        if (question.type === "date") {
          // Combine date parts if they exist
          const day = this.formAnswers[`${questionId}-day`];
          const month = this.formAnswers[`${questionId}-month`];
          const year = this.formAnswers[`${questionId}-year`];
          if (day && month && year) {
            displayAnswer = `${day} ${month} ${year}`;
          }
        } else if (question.type === "list" && question.options) {
          // Look up the label for the selected option
          const selectedOption = question.options.find(
            (opt) => opt.value === answer
          );
          displayAnswer = selectedOption ? selectedOption.label : answer;
        } else {
          displayAnswer = answer;
        }
      }
      value.textContent = displayAnswer;

      const actions = document.createElement("dd");
      actions.className = "govuk-summary-list__actions";

      const changeLink = document.createElement("a");
      changeLink.className = "govuk-link";
      changeLink.href = "#";
      changeLink.textContent = "Change";
      changeLink.setAttribute(
        "aria-label",
        `Change ${question.label.toLowerCase()}`
      );
      changeLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.goToPage(pageIndex);
      });

      actions.appendChild(changeLink);
      row.appendChild(key);
      row.appendChild(value);
      row.appendChild(actions);
      dl.appendChild(row);
    });

    return dl;
  }

  goToPage(pageIndex) {
    // Store the target page index in session storage
    sessionStorage.setItem("currentPageIndex", pageIndex);
    // Navigate back to the form preview
    window.location.href = "/form-editor/preview";
  }

  showError(message) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="govuk-error-summary" role="alert" tabindex="-1">
        <h2 class="govuk-error-summary__title">
          There is a problem
        </h2>
        <div class="govuk-error-summary__body">
          <p>${message}</p>
        </div>
      </div>
    `;
  }
}

// Initialize the check answers page when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CheckAnswers();
});
