//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require("govuk-prototype-kit");
const router = govukPrototypeKit.requests.setupRouter();
const terms = require("./data/dictionary.json");

// Add middleware to make terms available to all templates
router.use((req, res, next) => {
  res.locals.commonTerms = terms;
  next();
});

// import lists stuff

router.get("/form-editor/new-list", (req, res) => {
  res.render("form-editor/lists/new");
});
router.post("/form-editor/new-list", require("./routes/lists.js").post);
router.get("/form-editor/list-manager", require("./routes/lists.js").get);
router.get(
  "/form-editor/edit-list/:name",
  require("./routes/lists.js").editGet
);
router.post(
  "/form-editor/update-list/:name",
  require("./routes/lists.js").editPost
);
router.post(
  "/form-editor/delete-list/:name",
  require("./routes/lists.js").delete
);

// New route to get predefined lists from the lists.js file
router.get("/form-editor/api/lists", require("./routes/lists.js").getListsAPI);

// New route to get a specific list by name
router.get(
  "/form-editor/api/list/:name",
  require("./routes/lists.js").getListAPI
);

// Preview lists
router.get(
  "/form-editor/view-list/:name",
  require("./routes/lists.js").viewGet
);

module.exports = router;

// routes.js
const express = require("express");

// **** LISTING AND SETUP ROUTES ****************************************************
//--------------------------------------
// 2. GET /form-editor/listing
//    Show the initial listing page
//--------------------------------------
router.get("/form-editor/listing", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const formData = req.session.data || {};

  // Ensure each question inside each page has its own options array
  formPages.forEach((page) => {
    page.questions.forEach((question) => {
      if (question.subType === "radios" || question.subType === "checkboxes") {
        question.options = question.options || [];
      }
    });
  });

  console.log(
    "✅ Passing formPages with radio and checkbox options:",
    formPages
  );

  res.render("form-editor/listing/index", {
    formPages,
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
  });
});

//--------------------------------------
// 3. GET /questiontype
//    Show the page type selection form
//--------------------------------------
router.get("/form-editor/page-type.html", function (req, res) {
  const formData = req.session.data || {};
  res.render("form-editor/page-type.html", {
    commonTerms: terms,
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
  });
});

// **** CREATE A NEW PAGE (QUESTION OR GUIDANCE) ****************************************************

//--------------------------------------
// 4. POST /question-number
//    Handle user's choice: question page or guidance page
//--------------------------------------
router.post("/question-number", function (req, res) {
  // E.g. 'oncenf' means "Question page", 'guidance' means "Guidance page"
  const pageType = req.session.data["questionnumber"];

  // Make sure we have an array to store pages
  if (!req.session.data["formPages"]) {
    req.session.data["formPages"] = [];
  }

  // Create a new page object
  const newPage = {
    pageId: Date.now(), // unique ID
    pageType: pageType === "guidance" ? "guidance" : "question",
    pageHeading: "",
    questions: [],
    hasGuidance: false,
    guidanceTextarea: "",
    allowMultipleResponses: false,
    setName: "",
    minResponseCount: "",
    maxResponseCount: "",
  };

  // Push it into formPages
  const formPages = req.session.data["formPages"];
  formPages.push(newPage);

  // Keep track of which page index we're editing
  // (the newly added page is always at formPages.length - 1)
  req.session.data["currentPageIndex"] = formPages.length - 1;

  // Decide where to go next
  if (pageType === "oncenf") {
    // If user chose "question" page
    return res.redirect("/form-editor/information-type-nf.html");
  } else if (pageType === "guidance") {
    // If user chose "guidance" page
    return res.redirect(
      "/form-editor/question-type/guidance-configuration.html"
    );
  } else {
    // If user somehow chose nothing, redirect back or show an error
    return res.redirect("/form-editor/page-type.html");
  }
});

// **** Choose Question Type / Subtype ****************************************************

//--------------------------------------
// 5. POST /information-type-answer-nf
//    Handle user picking the specific question type (e.g. "text", "date")
//--------------------------------------
router.post("/information-type-answer-nf", function (req, res) {
  // 1. The main question type (e.g. "text", "date", "list")
  const mainType = req.body["informationQuestion1"];

  // 2. Subtypes for each category:
  const writtenSubType = req.body["written"];
  const dateSubType = req.body["dateType"];
  const listSubType = req.body["listType"];

  // Ensure `formPages` exists
  const formPages = req.session.data["formPages"] || [];

  // Get the current page index - DO NOT CREATE NEW PAGE
  const pageIndex = req.session.data["currentPageIndex"];
  if (pageIndex === undefined || !formPages[pageIndex]) {
    console.error("❌ Current page not found in session");
    return res.redirect("/form-editor/listing.html");
  }

  // Get the current page
  const currentPage = formPages[pageIndex];
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1; // Convert 0-based index to 1-based question number

  // 3. Store question type and subtypes in session
  req.session.data["currentQuestionType"] = mainType;
  req.session.data["writtenSubType"] = writtenSubType;
  req.session.data["dateSubType"] = dateSubType;
  req.session.data["listSubType"] = listSubType;

  // 4. Create and add the new question
  const newQuestion = {
    questionId: Date.now(),
    type: mainType,
    subType: listSubType || dateSubType || writtenSubType,
    label: "New question",
    options: [], // Initialize empty options array
  };

  // Initialize checkbox-specific properties if needed
  if (mainType === "list" && listSubType === "checkboxes") {
    newQuestion.type = "list";
    newQuestion.subType = "checkboxes";
    newQuestion.options = [];
    // Initialize the checkboxList on the current page if it doesn't exist
    if (!currentPage.checkboxList) {
      currentPage.checkboxList = [];
    }
  }

  // Add the question to the current page
  currentPage.questions.push(newQuestion);

  // Store the question index
  req.session.data["currentQuestionIndex"] = currentPage.questions.length - 1;

  // 5. Save back to session
  req.session.data["formPages"] = formPages;

  // 6. Redirect based on question type
  if (mainType === "list") {
    if (listSubType === "radios") {
      return res.redirect("/form-editor/question-type/radios-nf/edit");
    } else if (listSubType === "checkboxes") {
      return res.redirect("/form-editor/question-type/checkboxes/edit");
    }
  }

  // For all other types, continue with the default question configuration flow
  res.redirect("/question-configuration");
});

//--------------------------------------
// 6. GET /question-configuration
//    Render different templates depending on the user's choice
//--------------------------------------
router.get("/question-configuration", function (req, res) {
  const formData = req.session.data || {};
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1; // Convert 0-based index to 1-based page number
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1; // Convert 0-based index to 1-based question number

  // Retrieve the stored type choices from session
  const mainType = req.session.data["currentQuestionType"];
  const writtenSubType = req.session.data["writtenSubType"];
  const dateSubType = req.session.data["dateSubType"];
  const listSubType = req.session.data["listSubType"];

  // Decide which template to render
  let templateToRender = "/form-editor/question-type/default.html";

  // Decide which template to render based on mainType & subType
  if (mainType === "text") {
    if (writtenSubType === "short-answer-nf") {
      templateToRender = "/form-editor/question-type/shorttext/edit-nf.html";
    } else if (writtenSubType === "long-answer") {
      templateToRender = "/form-editor/question-type/textarea/edit-nf.html";
    } else if (writtenSubType === "numbers") {
      templateToRender = "/form-editor/question-type/numbers/edit-nf.html";
    }
  } else if (mainType === "date") {
    if (dateSubType === "day-month-year") {
      templateToRender = "/form-editor/question-type/date/edit-nf.html";
    } else if (dateSubType === "month-year") {
      templateToRender = "/form-editor/question-type/date-mmyy/edit-nf.html";
    }
  } else if (mainType === "address") {
    templateToRender = "/form-editor/question-type/address/edit-nf.html";
  } else if (mainType === "phone") {
    templateToRender = "/form-editor/question-type/phone/edit-nf.html";
  } else if (mainType === "file") {
    templateToRender = "/form-editor/question-type/fileupload/edit-nf.html";
  } else if (mainType === "email") {
    templateToRender = "/form-editor/question-type/email/edit-nf.html";
  } else if (mainType === "list") {
    if (listSubType === "yes-no") {
      templateToRender = "/form-editor/question-type/yesno/edit-nf.html";
    } else if (listSubType === "checkboxes") {
      templateToRender = "/form-editor/question-type/checkboxes/edit.html";
    } else if (listSubType === "radios") {
      templateToRender = "/form-editor/question-type/radios-nf/edit.html";
    } else if (listSubType === "select") {
      templateToRender = "/form-editor/question-type/autocomplete-nf/edit.html";
    }
  }

  // Render the template with both page and question numbers
  res.render(templateToRender, {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
    questionNumber: questionNumber,
    data: formData, // Include full form data in case templates need it
  });
});

// **** SAVING QUESTION CONFIGURATION ****

// POST /question-configuration-save
router.post("/question-configuration-save", function (req, res) {
  // 1. Ensure formPages is initialized
  if (!req.session.data["formPages"]) {
    req.session.data["formPages"] = [];
  }

  // 2. Identify current page
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const formPages = req.session.data["formPages"];
  const currentPage = formPages[pageIndex] || { questions: [] };

  if (!currentPage.questions) {
    currentPage.questions = [];
  }

  // 3. Read the question type & subtypes from session
  const questionType = req.session.data["currentQuestionType"];
  const writtenSubType = req.session.data["writtenSubType"];
  const dateSubType = req.session.data["dateSubType"];
  const listSubType = req.session.data["listSubType"];

  // 4. Determine the subtype
  let finalSubType = null;
  if (questionType === "text") {
    finalSubType = writtenSubType;
  } else if (questionType === "date") {
    finalSubType = dateSubType;
  } else if (questionType === "list") {
    finalSubType = listSubType;
  } else if (questionType === "address") {
    finalSubType = "address";
  }

  // 5. Capture the question label
  let questionLabel = "";
  switch (questionType) {
    case "phone":
      questionLabel = req.body["questionLabelInputPhone"] || "Phone number";
      break;
    case "text":
      if (writtenSubType === "short-answer-nf") {
        questionLabel =
          req.body["questionLabelInputShortText"] || "Short answer";
      } else if (writtenSubType === "long-answer") {
        questionLabel = req.body["questionLabelInputTextArea"] || "Long answer";
      } else if (writtenSubType === "numbers") {
        questionLabel = req.body["questionLabelInputNumbers"] || "Numbers only";
      } else {
        questionLabel = req.body["questionLabelInputText"] || "Text question";
      }
      break;
    case "email":
      questionLabel = req.body["questionLabelInputEmail"] || "Email address";
      break;
    case "date":
      questionLabel = req.body["questionLabelInputDate"] || "Date question";
      break;
    case "address":
      questionLabel = req.body["questionLabelInputAddress"] || "Address";
      break;
    case "file":
      questionLabel = req.body["multiQuestionLabelInputFile"] || "File upload";
      break;
    case "list":
      if (listSubType === "yes-no") {
        questionLabel =
          req.body["questionLabelInputYesno"] || "Yes/No question";
      } else if (listSubType === "checkboxes") {
        questionLabel =
          req.body["multiQuestionLabelInputCheckboxes"] ||
          "Checkboxes question";
      } else if (listSubType === "radios") {
        questionLabel =
          req.body["multiQuestionLabelInputRadios"] || "Radios question";
      } else if (listSubType === "select") {
        questionLabel =
          req.body["questionLabelInputAutocomplete"] || "Select an option";
      } else {
        questionLabel = req.body["questionLabelInputList"] || "List question";
      }
      break;
    default:
      questionLabel = "Test question"; // Fallback
      break;
  }

  // 6. Capture the question hint
  let questionHint = "";
  if (questionType === "address") {
    questionHint = req.body["hintTextInputAddress"] || "";
  } else {
    questionHint = req.body["questionHintInput"] || "";
  }

  // 7. Capture the options (For Radio and Checkbox lists)
  let questionOptions = [];

  if (questionType === "list" && listSubType === "radios") {
    // Copy from currentPage.radioList
    questionOptions = [...(currentPage.radioList || [])];
  } else if (questionType === "list" && listSubType === "checkboxes") {
    // Copy from the question's existing .options array
    const existingQuestionIndex = req.session.data["currentQuestionIndex"];
    const existingQuestion = currentPage.questions[existingQuestionIndex];

    questionOptions = existingQuestion.options || [];
  }

  // 8. Create or update the question
  let existingQuestionIndex = req.session.data["currentQuestionIndex"];
  if (
    existingQuestionIndex !== undefined &&
    currentPage.questions[existingQuestionIndex]
  ) {
    // Update existing question
    currentPage.questions[existingQuestionIndex].label = questionLabel;
    currentPage.questions[existingQuestionIndex].hint = questionHint;
    currentPage.questions[existingQuestionIndex].options = questionOptions; // ✅ Save options
  } else {
    // Create new question
    const newQuestion = {
      questionId: Date.now(),
      label: questionLabel,
      hint: questionHint,
      type: questionType,
      subType: finalSubType,
      options: questionOptions, // ✅ Attach options
    };
    currentPage.questions.push(newQuestion);
  }

  // 9. Save back to session
  formPages[pageIndex] = currentPage;
  req.session.data["formPages"] = formPages;

  console.log(
    "✅ Updated formPages (saved options):",
    JSON.stringify(formPages, null, 2)
  );

  // 10. Redirect to the page overview
  res.redirect("/page-overview");
});

// **** PAGE OVERVIEW AND EDITING ****************************************************

//--------------------------------------
// 8. GET /page-overview
//    Display a summary of the questions on the current page
//--------------------------------------
router.get("/page-overview", function (req, res) {
  const formData = req.session.data || {};
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1;
  const formPages = req.session.data["formPages"] || [];
  const currentPage = formPages[pageIndex] || {
    questions: [],
    pageType: "question",
    pageHeading: "",
    hasGuidance: false,
    guidanceTextarea: "",
    allowMultipleResponses: false,
    setName: "",
    minResponseCount: "",
    maxResponseCount: "",
  };

  // Enhanced logging for debugging
  console.log("🔍 Page Overview Debug:", {
    sessionData: {
      pageIndex,
      formPagesCount: formPages.length,
      currentPageQuestions: currentPage.questions?.length || 0,
    },
    currentPage: {
      pageType: currentPage.pageType,
      pageHeading: currentPage.pageHeading,
      questions: currentPage.questions?.map((q) => ({
        id: q.questionId,
        type: q.type,
        subType: q.subType,
        label: q.label,
        optionsCount: q.options?.length || 0,
      })),
    },
  });

  // Ensure each question has its options if it's a radio or checkbox type
  currentPage.questions = currentPage.questions.map((question) => {
    if (question.type === "list") {
      if (question.subType === "radios" || question.subType === "checkboxes") {
        if (!question.options) {
          question.options = [];
        }
        // Ensure type and subType are correct
        question.type = "list";
        question.subType =
          question.subType === "radios" ? "radios" : "checkboxes";
      }
    }
    return question;
  });

  res.render("form-editor/page-overview.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
    currentPage: currentPage,
  });
});

//--------------------------------------
// Edit page
//--------------------------------------
router.get("/edit-page/:pageId", function (req, res) {
  const pageId = req.params.pageId;
  const formPages = req.session.data["formPages"] || [];
  // Find the page to edit by matching pageId as a string
  const pageIndex = formPages.findIndex(
    (page) => String(page.pageId) === pageId
  );
  if (pageIndex === -1) {
    // If the page isn't found, redirect back to the listing page (or show an error)
    return res.redirect("/form-editor/listing.html");
  }
  // Set this page as the current page for editing
  req.session.data["currentPageIndex"] = pageIndex;

  // Redirect to the appropriate edit interface.
  const pageToEdit = formPages[pageIndex];
  if (pageToEdit.pageType === "question") {
    res.redirect("/page-overview");
  } else if (pageToEdit.pageType === "guidance") {
    res.redirect("/form-editor/question-type/guidance-configuration.html");
  } else {
    // Fallback
    res.redirect("/form-editor/listing.html");
  }
});

//--------------------------------------
// Edit an existing question
//--------------------------------------
router.get("/edit-question", function (req, res) {
  const questionId = (req.query.questionId || "").trim();
  console.log("Editing question with ID:", questionId);
  if (!questionId) {
    console.log("No questionId provided – redirecting to page overview.");
    return res.redirect("/page-overview");
  }

  // Retrieve formPages from session
  const formPages = req.session.data["formPages"] || [];

  // Search across all pages to find the matching question
  let foundPageIndex = -1;
  let foundQuestionIndex = -1;
  for (let i = 0; i < formPages.length; i++) {
    const qIndex = formPages[i].questions.findIndex(
      (q) => String(q.questionId) === questionId
    );
    if (qIndex !== -1) {
      foundPageIndex = i;
      foundQuestionIndex = qIndex;
      break;
    }
  }

  if (foundPageIndex === -1) {
    console.log("Question not found – redirecting to page overview.");
    return res.redirect("/page-overview");
  }

  // Set the found page as the current page for editing
  req.session.data["currentPageIndex"] = foundPageIndex;
  req.session.data["currentQuestionIndex"] = foundQuestionIndex;

  const question = formPages[foundPageIndex].questions[foundQuestionIndex];
  console.log("Editing question details:", question);

  // Also store the question type and its subtype
  req.session.data["currentQuestionType"] = question.type;
  if (question.type === "text") {
    req.session.data["writtenSubType"] = question.subType;
  } else if (question.type === "date") {
    req.session.data["dateSubType"] = question.subType;
  } else if (question.type === "list") {
    req.session.data["listSubType"] = question.subType;
  }

  res.redirect("/question-configuration");
});

// **** SAVING PAGE LEVEL CHANGES ****************************************************

//--------------------------------------
// 8a. POST /page-overview
//     Handle the user clicking "Save changes" on page-overview
//--------------------------------------
router.post("/page-overview", function (req, res) {
  console.log("req.body:", req.body);

  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const formPages = req.session.data["formPages"] || [];
  const currentPage = formPages[pageIndex] || {
    questions: [],
    pageType: "question",
    pageHeading: "",
    hasGuidance: false,
    guidanceTextarea: "",
    allowMultipleResponses: false,
    setName: "",
    minResponseCount: "",
    maxResponseCount: "",
  };

  // The page heading & guidance text
  const pageHeading = req.body.pageHeading || "";
  const guidanceTextarea = req.body.guidanceTextarea || "";

  // If "guidance" checkbox is checked, req.body.guidance === "guidance"
  currentPage.hasGuidance = req.body.guidance === "guidance";

  // The rest of your multiple responses logic
  let allowMultipleResponses = req.body.allowMultipleResponses;
  const questionSetName = req.body.questionSetName || "";
  const minResponseCount = req.body.minResponseCount || "";
  const maxResponseCount = req.body.maxResponseCount || "";

  if (Array.isArray(allowMultipleResponses)) {
    allowMultipleResponses = allowMultipleResponses.includes("true")
      ? "true"
      : "false";
  }

  // Update all page fields
  currentPage.pageHeading = pageHeading;
  currentPage.guidanceTextarea = guidanceTextarea;
  currentPage.allowMultipleResponses = allowMultipleResponses === "true";
  currentPage.setName = currentPage.allowMultipleResponses
    ? questionSetName
    : "";
  currentPage.minResponseCount = currentPage.allowMultipleResponses
    ? minResponseCount
    : "";
  currentPage.maxResponseCount = currentPage.allowMultipleResponses
    ? maxResponseCount
    : "";

  // Ensure we have a pageType
  if (!currentPage.pageType) {
    currentPage.pageType = "question";
  }

  // Save back to session
  formPages[pageIndex] = currentPage;
  req.session.data["formPages"] = formPages;

  console.log("Updated currentPage:", currentPage);
  res.redirect("/page-overview");
});

//--------------------------------------
// Test form (not specifically used in flow)
//--------------------------------------
router.post("/test-form", (req, res) => {
  // Grab the posted value(s)
  let allowMultipleResponses = req.body.allowMultipleResponses;

  // If it's an array of values, check if "true" is included
  if (Array.isArray(allowMultipleResponses)) {
    if (allowMultipleResponses.includes("true")) {
      allowMultipleResponses = "true";
    } else {
      allowMultipleResponses = "false";
    }
  }

  console.log("Final allowMultipleResponses:", allowMultipleResponses);
  res.send("Check your console for output");
});

// **** CHECKBOXES (ADD/EDIT/FINALIZE) ****************************************************
// Configure checkbox option route
router.post("/configure-checkbox-nf", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"];

  // Ensure we have a valid page
  if (!formPages[pageIndex]) {
    formPages[pageIndex] = { questions: [], checkboxList: [] };
  }

  const currentPage = formPages[pageIndex];

  // Ensure checkboxList exists on the page object
  if (!currentPage.checkboxList) {
    currentPage.checkboxList = [];
  }

  // Create new checkbox option
  const checkboxOption = {
    label: req.body.label,
    value: req.body.value || req.body.label.toLowerCase().replace(/\s+/g, "-"),
    hint: req.body.hint || "",
  };

  // Add to checkboxList
  currentPage.checkboxList.push(checkboxOption);

  // Save back to session
  formPages[pageIndex] = currentPage;
  req.session.data["formPages"] = formPages;

  // Log the state after adding option
  console.log("✅ Added checkbox option:", {
    checkboxOption,
    currentPage,
    checkboxList: currentPage.checkboxList,
  });

  res.redirect("/form-editor/question-type/checkboxes/edit");
});

// Route to finalize checkbox question configuration
router.post(
  "/form-editor/question-type/checkboxes/checkboxes-finalize",
  function (req, res) {
    const formPages = req.session.data["formPages"] || [];
    const pageIndex = req.session.data["currentPageIndex"];
    const questionIndex = req.session.data["currentQuestionIndex"];

    console.log("📝 Processing checkbox finalization:", {
      pageIndex,
      questionIndex,
      body: req.body,
    });

    // Get the current page and question
    const currentPage = formPages[pageIndex];
    const currentQuestion = currentPage.questions[questionIndex];

    // Update the question with the label and hint
    currentQuestion.label =
      req.body.questionLabelInputCheckboxes || "Checkbox question";
    currentQuestion.hint = req.body.questionHintTextInputCheckboxes || "";

    // Parse the checkbox options from the form data
    let options = [];
    try {
      if (req.body.checkboxOptionsData) {
        options = JSON.parse(req.body.checkboxOptionsData);
        console.log("✅ Parsed checkbox options:", options);
      }
    } catch (e) {
      console.error("❌ Error parsing checkbox options:", e);
      options = [];
    }

    // Update the question's type, subType and options
    currentQuestion.type = "list";
    currentQuestion.subType = "checkboxes";
    currentQuestion.options = options;

    // Clear the checkboxList since we've moved the options to the question
    currentPage.checkboxList = [];

    // Save back to session
    formPages[pageIndex] = currentPage;
    req.session.data["formPages"] = formPages;

    console.log("✅ Finalized checkbox question:", {
      questionId: currentQuestion.questionId,
      label: currentQuestion.label,
      hint: currentQuestion.hint,
      type: currentQuestion.type,
      subType: currentQuestion.subType,
      options: currentQuestion.options,
    });

    // Redirect to the page overview
    return res.redirect("/page-overview");
  }
);

// Edit page for checkbox options
router.get("/form-editor/question-type/checkboxes/edit", (req, res) => {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1; // Convert 0-based index to 1-based page number
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1; // Convert 0-based index to 1-based question number
  const formData = req.session.data || {};

  // First try to get checkboxList from the current page
  let checkboxList = [];
  if (formPages[pageIndex]) {
    const currentPage = formPages[pageIndex];
    checkboxList = currentPage.checkboxList || [];
  }

  // If no checkboxList found in current page, try to get it from session data
  if (checkboxList.length === 0) {
    checkboxList = req.session.data?.checkboxList || [];
  }

  // Render the edit page with the checkboxList
  console.log("Current checkbox options:", checkboxList);

  res.render("form-editor/question-type/checkboxes/edit.html", {
    checkboxList: checkboxList,
    pageNumber: pageNumber,
    questionNumber: questionNumber,
    form: {
      name:
        formData.formDetails?.name ||
        formData.formName ||
        "Food takeaway (user research)",
    },
  });
});

// Edit individual checkbox option
router.get("/form-editor/question-type/checkboxes/editoption", (req, res) => {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const index = parseInt(req.query.index) - 1;

  // Get the current page and find the checkbox question
  const currentPage = formPages[pageIndex];

  // Ensure currentPage and questions array exist
  if (!currentPage || !currentPage.questions) {
    return res.redirect("/form-editor/question-type/checkboxes/edit");
  }

  const checkboxQuestion = currentPage.questions.find(
    (q) => q.questionType === "list" && q.questionSubType === "checkboxes"
  );

  if (!checkboxQuestion) {
    return res.redirect("/form-editor/question-type/checkboxes/edit");
  }

  // Ensure configuration exists
  if (!checkboxQuestion.configuration) {
    checkboxQuestion.configuration = {};
  }

  // Get the checkboxList from the question configuration
  const checkboxList = checkboxQuestion.configuration.checkboxList || [];

  // Get the option to edit
  const option = checkboxList[index];

  // Render the edit page with the option data
  res.render("form-editor/question-type/checkboxes/editoption.html", {
    data: {
      index: index + 1,
      checkboxList: checkboxList,
      option: option,
    },
    pageNumber: pageIndex + 1,
    questionNumber: checkboxQuestion.questionNumber,
  });
});

// Save checkbox option changes
router.post("/form-editor/question-type/checkboxes/save-option", (req, res) => {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const index = parseInt(req.body.index);

  // Get the current page and find the checkbox question
  const currentPage = formPages[pageIndex];

  // Ensure currentPage and questions array exist
  if (!currentPage || !currentPage.questions) {
    return res.redirect("/form-editor/question-type/checkboxes/edit");
  }

  const checkboxQuestion = currentPage.questions.find(
    (q) => q.questionType === "list" && q.questionSubType === "checkboxes"
  );

  if (!checkboxQuestion) {
    return res.redirect("/form-editor/question-type/checkboxes/edit");
  }

  // Ensure configuration exists
  if (!checkboxQuestion.configuration) {
    checkboxQuestion.configuration = {};
  }

  // Get the checkboxList from the question configuration
  const checkboxList = checkboxQuestion.configuration.checkboxList || [];

  // Update the option
  checkboxList[index] = {
    label: req.body["option-label"],
    hint: req.body["option-hint"],
    value:
      req.body["option-value"] ||
      req.body["option-label"].toLowerCase().replace(/\s+/g, "-"),
  };

  // Save the updated checkboxList back to the question configuration
  checkboxQuestion.configuration.checkboxList = checkboxList;

  // Update the session data
  req.session.data["formPages"] = formPages;

  // Redirect back to the edit page
  res.redirect("/form-editor/question-type/checkboxes/edit");
});

// **** RADIOS ROUTES (ADD/EDIT/FINALIZE) ****************************************************

// Update the configure-radio-nf route to ensure options are being saved properly
router.post("/configure-radio-nf", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"];

  // Debug logging
  console.log("Adding radio option - Current page index:", pageIndex);
  console.log("Current form pages:", formPages);

  // Ensure we have a valid page
  if (!formPages[pageIndex]) {
    formPages[pageIndex] = { questions: [], radioList: [] };
  }

  const currentPage = formPages[pageIndex];

  // Ensure radioList exists on the page object
  if (!currentPage.radioList) {
    currentPage.radioList = [];
  }

  // Create new radio option
  const radioOption = {
    label: req.body.label,
    value: req.body.value || req.body.label.toLowerCase().replace(/\s+/g, "-"),
    hint: req.body.hint || "",
  };

  // Add to radioList
  currentPage.radioList.push(radioOption);

  // Save back to session
  formPages[pageIndex] = currentPage;
  req.session.data["formPages"] = formPages;

  // Log the state after adding option
  console.log("✅ Added radio option:", {
    radioOption,
    currentPage,
    radioList: currentPage.radioList,
    radioListLength: currentPage.radioList.length,
  });

  res.redirect("/form-editor/question-type/radios-nf/edit");
});

// Route to finalize radio question configuration
router.post(
  "/form-editor/question-type/radios-nf/radios-finalize",
  function (req, res) {
    const formPages = req.session.data["formPages"] || [];
    const pageIndex = req.session.data["currentPageIndex"];
    const questionIndex = req.session.data["currentQuestionIndex"];

    console.log("📝 Processing radio finalization:", {
      pageIndex,
      questionIndex,
      body: req.body,
    });

    // Get the current page and question
    const currentPage = formPages[pageIndex];
    const currentQuestion = currentPage.questions[questionIndex];

    // Update the question with the label and hint
    currentQuestion.label =
      req.body.questionLabelInputRadios || "Radio question";
    currentQuestion.hint = req.body.questionHintTextInputRadios || "";

    // Parse the radio options from the form data
    let options = [];
    try {
      if (req.body.radioOptions) {
        options = JSON.parse(req.body.radioOptions);
        console.log("✅ Parsed radio options:", options);
      }
    } catch (e) {
      console.error("❌ Error parsing radio options:", e);
      options = [];
    }

    // Update the question's type, subType and options
    currentQuestion.type = "list";
    currentQuestion.subType = "radios";
    currentQuestion.options = options;

    // Clear the radioList since we've moved the options to the question
    currentPage.radioList = [];

    // Save back to session
    formPages[pageIndex] = currentPage;
    req.session.data["formPages"] = formPages;

    console.log("✅ Finalized radio question:", {
      questionId: currentQuestion.questionId,
      label: currentQuestion.label,
      hint: currentQuestion.hint,
      type: currentQuestion.type,
      subType: currentQuestion.subType,
      options: currentQuestion.options,
    });

    // Redirect to the page overview with the correct path
    return res.redirect("/page-overview");
  }
);

// Edit page for radio options
router.get("/form-editor/question-type/radios-nf/edit", (req, res) => {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1; // Convert 0-based index to 1-based page number
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1; // Convert 0-based index to 1-based question number
  const formData = req.session.data || {};

  // First try to get radioList from the current page
  let radioList = [];
  if (formPages[pageIndex]) {
    const currentPage = formPages[pageIndex];
    radioList = currentPage.radioList || [];
  }

  // If no radioList found in current page, try to get it from session data
  if (radioList.length === 0) {
    radioList = req.session.data?.radioList || [];
  }

  // Render the edit page with the radioList
  console.log("Current radio options:", radioList);

  res.render("form-editor/question-type/radios-nf/edit.html", {
    radioList: radioList,
    pageNumber: pageNumber,
    questionNumber: questionNumber,
    form: {
      name:
        formData.formDetails?.name ||
        formData.formName ||
        "Food takeaway (user research)",
    },
    commonTerms: terms,
  });
});

// Route to access the add page for radio buttons
router.get("/form-editor/question-type/radios-nf/add.html", (req, res) => {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1;
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1;

  res.render("form-editor/question-type/radios-nf/add.html", {
    pageNumber: pageNumber,
    questionNumber: questionNumber,
  });
});

router.post("/update-radio-label", function (req, res) {
  // Update the session with the provided label
  req.session.data.currentRadioQuestionLabel = req.body.label || "";
  res.json({ success: true });
});

// **** CONDITIONS ROUTES ****************************************************

//--------------------------------------
// GET /conditions
// Show conditions for the current page
//--------------------------------------

// Helper function to find a question by ID
function findQuestionById(formPages, questionId) {
  for (const page of formPages) {
    if (page.questions) {
      for (const question of page.questions) {
        if (question.questionId.toString() === questionId.toString()) {
          return {
            ...question,
            label: question.label || question.text, // Ensure we have a label
          };
        }
      }
    }
  }
  return null;
}

router.get("/form-editor/conditions/:pageId", function (req, res) {
  const formData = req.session.data || {};
  const formPages = req.session.data["formPages"] || [];
  const pageId = req.params.pageId;

  // Find the current page by pageId
  const currentPage = formPages.find((page) => String(page.pageId) === pageId);

  if (!currentPage) {
    console.error("Page not found:", pageId);
    return res.redirect("/form-editor/listing");
  }

  // Store the current page ID in session for other routes
  req.session.data.currentPageId = pageId;

  // Find the page index for numbering
  const pageIndex = formPages.findIndex(
    (page) => String(page.pageId) === pageId
  );
  const pageNumber = pageIndex + 1;

  // Get all available questions for conditions
  const availableQuestions = formPages
    .flatMap((page) => page.questions)
    .filter((question) => {
      const type = question.subType || question.type;
      return ["radios", "checkboxes", "yes-no"].includes(type);
    })
    .map((question) => ({
      value: question.questionId,
      text: question.label,
      type: question.subType || question.type,
      options: question.options,
    }));

  // Collect all existing conditions from other pages
  const existingConditions = formPages
    .filter((page) => String(page.pageId) !== pageId) // Exclude current page
    .flatMap((page) => page.conditions || [])
    .map((condition) => ({
      value: condition.id.toString(),
      text: condition.conditionName,
      hint: {
        text: condition.rules
          .map(
            (rule) =>
              `${rule.questionText} ${rule.operator} ${
                Array.isArray(rule.value) ? rule.value.join(" or ") : rule.value
              }`
          )
          .join(" AND "),
      },
    }));

  res.render("form-editor/conditions.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
    currentPage: currentPage,
    availableQuestions: availableQuestions,
    conditions: currentPage.conditions || [],
    formPages: formPages,
    existingConditions: existingConditions, // Add this line to pass existing conditions
  });
});

//--------------------------------------
// 2. POST /conditions-add
//    Add a new condition or copy an existing one
//--------------------------------------
router.post("/conditions-add", function (req, res) {
  const formPages = req.session.data.formPages || [];
  const currentPageId = req.body.currentPageId;

  // Debug log
  console.log("Received currentPageId:", currentPageId);
  console.log("Form pages:", formPages);

  // Find the current page by pageId
  const currentPage = formPages.find(
    (page) => String(page.pageId) === String(currentPageId)
  );

  if (!currentPage) {
    console.error("Page not found:", currentPageId);
    return res.redirect("/form-editor/listing");
  }

  // Initialize conditions array if it doesn't exist
  currentPage.conditions = currentPage.conditions || [];

  if (req.body.conditionType === "existing") {
    // Handle existing condition
    const existingConditionId = req.body.existingConditionId;
    let existingCondition = null;

    // Find the existing condition in any page
    for (const page of formPages) {
      if (page.conditions) {
        const found = page.conditions.find(
          (c) => c.id.toString() === existingConditionId
        );
        if (found) {
          existingCondition = found;
          break;
        }
      }
    }

    console.log("Found existing condition:", existingCondition);

    if (existingCondition) {
      // Create a deep copy of the existing condition with a new ID
      const newCondition = {
        id: Date.now(),
        conditionName: existingCondition.conditionName,
        rules: existingCondition.rules.map((rule) => ({
          questionText: rule.questionText,
          operator: rule.operator,
          value: rule.value,
          logicalOperator: rule.logicalOperator,
        })),
        text: existingCondition.text,
      };

      console.log("New condition created from existing:", newCondition);
      currentPage.conditions.push(newCondition);
    } else {
      console.error(
        "Could not find existing condition with ID:",
        existingConditionId
      );
    }
  } else {
    // Handle new condition
    let rules;
    try {
      if (req.body.rules) {
        // Debug log to see what's coming in
        console.log("Form data received:", {
          conditionName: req.body.conditionName,
          rules: req.body.rules,
          entireBody: req.body,
        });

        // Parse rules if it's a string, or use directly if it's already an object
        rules =
          typeof req.body.rules === "string"
            ? JSON.parse(req.body.rules)
            : req.body.rules;

        if (!Array.isArray(rules)) {
          rules = [rules];
        }
      } else {
        console.error("No rules provided in request");
        rules = [];
      }
    } catch (e) {
      console.error("Error handling rules:", e);
      console.error(e);
      rules = [];
    }

    // Create the new condition
    const newCondition = {
      id: Date.now(),
      conditionName: req.body.conditionName,
      rules: rules.map((rule) => ({
        questionText: rule.questionText,
        operator: rule.operator,
        value: rule.value,
        logicalOperator: rule.logicalOperator,
      })),
      text: rules
        .map((rule) => {
          // Only use "or" formatting for checkbox values (which come as arrays)
          const valueText = Array.isArray(rule.value)
            ? rule.value.map((v) => `'${v}'`).join(" or ")
            : `'${rule.value}'`;
          return `${rule.questionText} ${rule.operator} ${valueText}`;
        })
        .join(" AND "),
    };

    console.log("New condition created:", newCondition);
    currentPage.conditions.push(newCondition);
  }

  console.log("Updated page conditions:", currentPage.conditions);

  // Save back to session
  req.session.data.formPages = formPages;

  // Fix the redirect URL to include the form-editor prefix
  const returnUrl = `/form-editor/conditions/${currentPageId}`;
  console.log("Redirecting to:", returnUrl);
  res.redirect(returnUrl);
});

//--------------------------------------
// 3. POST /conditions-remove
//    Remove a condition
//--------------------------------------
router.post("/conditions-remove", function (req, res) {
  const pageId = req.session.data["currentPageId"]; // Get the stored page ID
  const formPages = req.session.data["formPages"] || [];

  // Find the specific page by ID
  const pageIndex = formPages.findIndex((page) => page.pageId === pageId);

  if (pageIndex === -1) {
    console.log("⚠️ Page not found:", pageId);
    return res.redirect("/form-editor/listing.html");
  }

  // Remove condition by ID
  const conditionId = req.body.conditionId;
  formPages[pageIndex].conditions = formPages[pageIndex].conditions.filter(
    (c) => c.id.toString() !== conditionId
  );

  // Save back to session
  req.session.data["formPages"] = formPages;

  console.log("✅ Removed condition from page:", pageId);
  console.log("Current conditions:", formPages[pageIndex].conditions);

  res.redirect(`/conditions/${pageId}`);
});

// **** PAGE REORDERING ****************************************************

router.get("/form-editor/reorder/main.html", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const formData = req.session.data || {};
  res.render("form-editor/reorder/main.html", {
    formPages: formPages,
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
  });
});

router.post("/update-page-order", function (req, res) {
  const orderedIds = req.body.orderedIds;
  if (!orderedIds || !Array.isArray(orderedIds)) {
    return res.json({ success: false, message: "Invalid order provided" });
  }

  // Get the existing pages from session
  const formPages = req.session.data["formPages"] || [];

  // Build a new array in the order specified by orderedIds
  const newOrder = [];
  orderedIds.forEach((id) => {
    const page = formPages.find((page) => String(page.pageId) === id);
    if (page) {
      newOrder.push(page);
    }
  });

  // If we have a valid new order, update the session and respond with success
  if (newOrder.length > 0) {
    req.session.data["formPages"] = newOrder;
    console.log(
      "Updated formPages order:",
      newOrder.map((page) => page.pageId)
    );
    return res.json({ success: true });
  } else {
    return res.json({
      success: false,
      message: "No pages found for the new order",
    });
  }
});

// Update the delete page route
router.get("/form-editor/delete/:pageId", function (req, res) {
  const formData = req.session.data || {};
  const pageId = req.params.pageId;
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1;

  res.render("form-editor/delete.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
    pageId: pageId,
  });
});

// Delete page route
router.post("/delete-page", function (req, res) {
  const pageId = req.body.pageId;
  const formPages = req.session.data["formPages"] || [];

  // Find and remove the page
  const pageIndex = formPages.findIndex(
    (page) => String(page.pageId) === String(pageId)
  );
  if (pageIndex !== -1) {
    formPages.splice(pageIndex, 1);
    req.session.data["formPages"] = formPages;
  }

  // Redirect back to the listing page
  res.redirect("/form-editor/listing.html");
});

// Update the guidance overview route
router.post("/form-editor/guidance/overview", function (req, res) {
  console.log("Form data received:", req.body);

  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"];

  // Create or update the guidance page
  const guidancePage = {
    pageId: pageIndex !== undefined ? formPages[pageIndex]?.pageId : Date.now(),
    pageType: "guidance",
    guidanceOnlyHeadingInput: req.body.guidanceOnlyHeadingInput,
    guidanceOnlyGuidanceTextInput: req.body.guidanceOnlyGuidanceTextInput,
    isExitPage: Array.isArray(req.body.exitPage)
      ? req.body.exitPage.includes("true")
      : req.body.exitPage === "true",
    questions: [],
    conditions: [], // Initialize empty conditions array
  };

  // Add or update the page
  if (pageIndex !== undefined) {
    formPages[pageIndex] = guidancePage;
  } else {
    formPages.push(guidancePage);
    req.session.data["currentPageIndex"] = formPages.length - 1;
  }

  req.session.data["formPages"] = formPages;

  // Add this to pass the currentPage to the template
  res.render("form-editor/question-type/guidance-configuration", {
    currentPage: guidancePage,
    data: req.session.data,
    form: {
      name: req.session.data.formName || "Food takeaway (user research)",
    },
  });
});

// Add this GET route for guidance configuration
router.get(
  "/form-editor/question-type/guidance-configuration.html",
  function (req, res) {
    const formPages = req.session.data["formPages"] || [];
    const pageIndex = req.session.data["currentPageIndex"];
    const formData = req.session.data || {};
    const pageNumber = pageIndex + 1;

    // Get the current page from the session
    const currentPage = formPages[pageIndex];

    if (!currentPage) {
      console.log("No current page found:", {
        pageIndex,
        formPagesLength: formPages.length,
      });
      return res.redirect("/form-editor/listing.html");
    }

    console.log("Rendering guidance config with page:", currentPage);

    res.render("form-editor/question-type/guidance-configuration.html", {
      currentPage: currentPage,
      data: req.session.data,
      form: {
        name: formData.formName || "Food takeaway (user research)",
      },
      pageNumber: pageNumber,
    });
  }
);

//--------------------------------------
// Edit an existing guidance page
//--------------------------------------
router.get("/form-editor/edit-guidance", function (req, res) {
  const pageId = (req.query.pageId || "").trim();
  console.log("Editing guidance page with ID:", pageId);

  if (!pageId) {
    console.log("No pageId provided – redirecting to listing.");
    return res.redirect("/form-editor/listing.html");
  }

  // Retrieve formPages from session
  const formPages = req.session.data["formPages"] || [];

  // Find the guidance page
  const foundPageIndex = formPages.findIndex(
    (page) => String(page.pageId) === pageId && page.pageType === "guidance"
  );

  if (foundPageIndex === -1) {
    console.log("Guidance page not found – redirecting to listing.");
    return res.redirect("/form-editor/listing.html");
  }

  // Set the found page as the current page for editing
  req.session.data["currentPageIndex"] = foundPageIndex;

  const guidancePage = formPages[foundPageIndex];
  console.log("Editing guidance page details:", guidancePage);

  res.redirect("/form-editor/question-type/guidance-configuration.html");
});

// Delete page route
router.post("/delete-page", function (req, res) {
  const pageId = parseInt(req.body.pageId, 10);
  const formPages = req.session.data["formPages"] || [];

  // Find and remove the page
  const pageIndex = formPages.findIndex((page) => page.pageId === pageId);
  if (pageIndex !== -1) {
    formPages.splice(pageIndex, 1);
    req.session.data["formPages"] = formPages;
  }

  // Redirect back to the listing page
  res.redirect("/form-editor/listing.html");
});

// Add preview route
router.get("/form-editor/preview", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const formData = req.session.data || {};
  console.log("Rendering preview with form pages:", formPages);
  res.render("form-editor/preview", {
    data: {
      formPages: formPages,
    },
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
  });
});

// Form creation flow - simple routes without validation
router.get("/create-new-form/form-name", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Generate form ID if not already exists
  if (!req.session.data.formId) {
    req.session.data.formId = `FORM-${Date.now()}`;
  }

  // Log current session data
  console.log("Current session data:", req.session.data);

  res.render("create-new-form/form-name", {
    data: req.session.data,
  });
});

router.post("/create-new-form/form-name", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Store form name from the request body
  const formName = req.body.formName;

  // Update session data
  req.session.data = {
    ...req.session.data,
    formId: req.session.data.formId || `FORM-${Date.now()}`,
    formName: formName,
    formDetails: {
      id: req.session.data.formId || `FORM-${Date.now()}`,
      name: formName,
      createdAt: new Date().toISOString(),
      status: "Draft",
    },
  };

  // Log the updated session data
  console.log("Updated session data after form name:", req.session.data);

  res.redirect("/create-new-form/organisation-name");
});

router.get("/create-new-form/organisation-name", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Log current session data
  console.log("Current session data:", req.session.data);

  // Check if we have a form name before proceeding
  if (!req.session.data.formName) {
    return res.redirect("/create-new-form/form-name");
  }

  res.render("create-new-form/organisation-name", {
    data: req.session.data,
  });
});

router.post("/create-new-form/organisation-name", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Store organisation name from the request body
  const organisationName = req.body.organisationName;

  // Update session data
  req.session.data = {
    ...req.session.data,
    organisationName: organisationName,
    formDetails: {
      ...req.session.data.formDetails,
      organisation: organisationName,
    },
  };

  // Log the updated session data
  console.log("Updated session data after organisation:", req.session.data);

  res.redirect("/create-new-form/policy-sme");
});

router.get("/create-new-form/policy-sme", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Log current session data
  console.log("Current session data:", req.session.data);

  // Check if we have the required data before proceeding
  if (!req.session.data.formName || !req.session.data.organisationName) {
    return res.redirect("/create-new-form/form-name");
  }

  res.render("create-new-form/policy-sme", {
    data: req.session.data,
  });
});

router.post("/create-new-form/policy-sme", (req, res) => {
  // Initialize session data if it doesn't exist
  req.session.data = req.session.data || {};

  // Store team details from the request body
  // Ensure we get the first value if it's an array, or the value itself if it's a string
  const teamName = Array.isArray(req.body.teamName)
    ? req.body.teamName[0]
    : req.body.teamName;
  const email = Array.isArray(req.body.email)
    ? req.body.email[0]
    : req.body.email;

  // Update session data
  req.session.data = {
    ...req.session.data,
    teamName: teamName,
    email: email,
    formDetails: {
      ...req.session.data.formDetails,
      teamName: teamName,
      email: email,
      lastUpdated: new Date().toISOString(),
      status: "Draft", // Set initial status to Draft
    },
  };

  // Log the final session data
  console.log("Final session data:", req.session.data);

  res.redirect("/form-overview/draft/overview");
});

// Overview page route
router.get("/form-overview/draft/overview", (req, res) => {
  // Get the form data from the session
  const formData = req.session.data || {};

  // Map status to GOV.UK Design System tag colors
  const statusColorMap = {
    Draft: "orange",
    Live: "green",
    Closed: "red",
  };

  const status = formData.formDetails?.status || "Draft";
  const statusColor = statusColorMap[status] || "grey";

  // Create a URL-friendly version of the form name
  const urlFriendlyName = (formData.formName || "untitled-form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Create the preview URL
  const previewUrl = `https://forms-runner.prototype.cdp-int.defra.cloud/preview/draft/${urlFriendlyName}`;

  // Create the form object that the templates expect
  const form = {
    name: formData.formName || "Food takeaway (user research)",
    status: {
      text: status,
      color: statusColor,
    },
    previewUrl: previewUrl,
    createdAt: formData.formDetails?.createdAt || new Date().toISOString(),
    updatedAt: formData.formDetails?.lastUpdated || new Date().toISOString(),
    organisation: {
      name: formData.formDetails?.organisation || "Not set",
    },
    team: {
      name: formData.formDetails?.teamName || "Not set",
      email: formData.formDetails?.email || "Not set",
    },
    support: {
      phone: formData.formDetails?.support?.phone,
      email: formData.formDetails?.support?.email,
      link: formData.formDetails?.support?.link,
    },
    nextSteps: formData.formDetails?.nextSteps,
    privacyNotice: formData.formDetails?.privacyNotice,
    notificationEmail: formData.formDetails?.notificationEmail,
  };

  res.render("form-overview/draft/overview", {
    form: form,
    pageName: `Overview - ${form.name}`,
  });
});

// Support pages routes
router.get("/form-overview/draft/support/phone", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/draft/support/phone", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      support: {
        phone: formData.formDetails?.support?.phone || "",
      },
    },
    pageName: "Add phone number for support",
  });
});

router.post("/form-overview/draft/support/phone", (req, res) => {
  const formData = req.session.data || {};
  const phoneDetails = req.body.moreDetail;

  // Update the form details with the phone number
  formData.formDetails = {
    ...formData.formDetails,
    support: {
      ...formData.formDetails?.support,
      phone: phoneDetails,
    },
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

router.get("/form-overview/draft/support/email", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/draft/support/email", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      support: {
        email: formData.formDetails?.support?.email || "",
      },
    },
    pageName: "Add email address for support",
  });
});

router.post("/form-overview/draft/support/email", (req, res) => {
  const formData = req.session.data || {};
  const emailAddress = req.body.emailAddress;

  // Update the form details with the email address
  formData.formDetails = {
    ...formData.formDetails,
    support: {
      ...formData.formDetails?.support,
      email: emailAddress,
    },
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

router.get("/form-overview/draft/support/link", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/draft/support/link", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      support: {
        link: formData.formDetails?.support?.link || "",
      },
    },
    pageName: "Add online contact link for support",
  });
});

router.post("/form-overview/draft/support/link", (req, res) => {
  const formData = req.session.data || {};
  const contactLink = req.body.contactLink;

  // Update the form details with the contact link
  formData.formDetails = {
    ...formData.formDetails,
    support: {
      ...formData.formDetails?.support,
      link: contactLink,
    },
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

router.get("/form-overview/draft/support/address", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/support/add-address", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      support: {
        address: formData.formDetails?.support?.address || {
          line1: "",
          line2: "",
          town: "",
          county: "",
          postcode: "",
        },
      },
    },
    pageName: "Add address for support",
  });
});

router.post("/form-overview/draft/support/address", (req, res) => {
  const formData = req.session.data || {};
  const addressDetails = {
    line1: req.body.addressLine1,
    line2: req.body.addressLine2,
    town: req.body.addressTown,
    county: req.body.addressCounty,
    postcode: req.body.addressPostcode,
  };

  // Update the form details with the address
  formData.formDetails = {
    ...formData.formDetails,
    support: {
      ...formData.formDetails?.support,
      address: addressDetails,
    },
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

// Next steps support
router.get("/form-overview/draft/support/next-steps", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/support/next-steps", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      nextSteps: formData.formDetails?.nextSteps || "",
    },
    pageName: "What happens next",
  });
});

// Privacy notice support
router.get("/form-overview/draft/support/privacy-notice", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/support/privacy-notice", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      privacyNotice: formData.formDetails?.privacyNotice || "",
    },
    pageName: "Add privacy notice link",
  });
});

router.post("/form-overview/draft/support/privacy-notice", (req, res) => {
  const formData = req.session.data || {};
  const privacyLink = req.body.privacyLink;

  // Update the form details with the privacy notice link
  formData.formDetails = {
    ...formData.formDetails,
    privacyNotice: privacyLink,
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

// Notification email routes
router.get("/form-overview/draft/support/notification-email", (req, res) => {
  const formData = req.session.data || {};
  res.render("form-overview/support/notification-email", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
      notificationEmail: formData.formDetails?.notificationEmail || "",
    },
    pageName: "Email address for submitted forms",
  });
});

router.post("/form-overview/draft/support/notification-email", (req, res) => {
  const formData = req.session.data || {};
  const notificationEmail = req.body.notificationEmail;

  // Update the form details with the notification email
  formData.formDetails = {
    ...formData.formDetails,
    notificationEmail: notificationEmail,
    lastUpdated: new Date().toISOString(),
  };

  req.session.data = formData;
  res.redirect("/form-overview/draft/overview");
});

/* dictionary stuff */

const path = require("path");

// Finally, export the router
module.exports = router;

router.get("/form-editor/information-type-nf.html", function (req, res) {
  const formData = req.session.data || {};
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1; // Convert 0-based index to 1-based page number
  const questionIndex = req.session.data["currentQuestionIndex"] || 0;
  const questionNumber = questionIndex + 1; // Convert 0-based index to 1-based question number

  res.render("form-editor/information-type-nf.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
    questionNumber: questionNumber,
  });
});

router.get("/form-editor/errors/info-type-lower.html", function (req, res) {
  const formData = req.session.data || {};
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1;

  res.render("form-editor/errors/info-type-lower.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
  });
});

router.get("/form-editor/errors/information-type.html", function (req, res) {
  const formData = req.session.data || {};
  const pageIndex = req.session.data["currentPageIndex"] || 0;
  const pageNumber = pageIndex + 1;

  res.render("form-editor/errors/information-type.html", {
    form: {
      name: formData.formName || "Food takeaway (user research)",
    },
    pageNumber: pageNumber,
  });
});

// Add route for inline radio option addition
router.post("/form-editor/question-type/radios-nf/add-inline", (req, res) => {
  const { label, hint, value } = req.body;
  const formPages = req.session.formPages;
  const currentPageIndex = req.session.currentPageIndex;
  const currentQuestionIndex = req.session.currentQuestionIndex;

  if (!formPages || !formPages[currentPageIndex]) {
    return res.status(400).json({ error: "Invalid page or question" });
  }

  const currentPage = formPages[currentPageIndex];
  const currentQuestion = currentPage.questions[currentQuestionIndex];

  // Initialize radioList if it doesn't exist
  if (!currentQuestion.radioList) {
    currentQuestion.radioList = [];
  }

  // Add new radio option
  currentQuestion.radioList.push({
    label: label,
    hint: hint || "",
    value: value || label.toLowerCase().replace(/\s+/g, "-"),
  });

  // Save to session
  req.session.formPages = formPages;

  // Return success response
  res.json({ success: true });
});

router.post("/form-editor/question-type/radios-nf/add", function (req, res) {
  const formPages = req.session.data["formPages"] || [];
  const pageIndex = req.session.data["currentPageIndex"];

  // Get the current page
  const currentPage = formPages[pageIndex];

  // Initialize radioList if it doesn't exist
  if (!currentPage.radioList) {
    currentPage.radioList = [];
  }

  // Create new radio option
  const radioOption = {
    label: req.body.label,
    value: req.body.value || req.body.label.toLowerCase().replace(/\s+/g, "-"),
    hint: req.body.hint || "",
  };

  // Add to radioList
  currentPage.radioList.push(radioOption);

  // Save back to session
  formPages[pageIndex] = currentPage;
  req.session.data["formPages"] = formPages;

  // Log the state after adding option
  console.log("✅ Added radio option:", {
    radioOption,
    currentPage,
    radioList: currentPage.radioList,
  });

  res.redirect("/form-editor/question-type/radios-nf/edit");
});
