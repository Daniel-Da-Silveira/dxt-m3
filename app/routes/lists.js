const fs = require("fs");
const path = require("path");

const listsFilePath = path.join(__dirname, "../data/lists.js");

if (!fs.existsSync(listsFilePath)) {
  fs.writeFileSync(listsFilePath, "module.exports = {}");
}

module.exports = {
  // API Endpoints
  getListsAPI: (req, res) => {
    delete require.cache[require.resolve("../data/lists.js")];
    const lists = require("../data/lists.js");
    res.json(Object.keys(lists));
  },

  getListAPI: (req, res) => {
    delete require.cache[require.resolve("../data/lists.js")];
    const lists = require("../data/lists.js");
    const listName = req.params.name;

    if (lists[listName]) {
      res.json(lists[listName]);
    } else {
      res.status(404).send("List not found");
    }
  },

  // UI Routes
  get: (req, res) => {
    delete require.cache[require.resolve("../data/lists.js")];
    const lists = require("../data/lists.js");
    const tableRows = Object.entries(lists).map(([name, items]) => [
      {
        html: `<a href="/form-editor/edit-list/${name}" class="govuk-!-margin-right-1 govuk-!-margin-bottom-0 govuk-!-margin-top-0">${name}</a>`,
      },
      //{ text: name },
      //{ text: `${items.length} items` },
      {
        html: `<div class="govuk-!-margin-bottom-0 govuk-!-margin-top-0">
		  <!--<a href="/form-editor/view-list/${name}" class="govuk-link govuk-!-margin-right-4 govuk-!-margin-top-1" style="display:inline-block">Preview</a>-->
		  <!--<a href="/form-editor/edit-list/${name}" class="govuk-button govuk-button--secondary govuk-!-margin-right-1 govuk-!-margin-bottom-0 govuk-!-margin-top-0">Edit</a>
		  <form method="POST" action="/form-editor/delete-list/${name}" class="govuk-!-display-inline">
			<button class="govuk-button govuk-button--warning govuk-!-margin-bottom-0 govuk-!-margin-top-0">Delete</button>
		  </form>-->
		</div>`,
      },
    ]);

    res.render("form-editor/list-manager", { tableRows });
  },

  post: (req, res) => {
    setTimeout(() => {
      delete require.cache[require.resolve("../data/lists.js")];
      const lists = require("../data/lists.js");
      const { name, items } = req.body;

      const processedItems = items
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      lists[name] = processedItems;

      fs.writeFileSync(
        listsFilePath,
        `module.exports = ${JSON.stringify(lists, null, 2)}`
      );
      res.redirect("/form-editor/list-manager");
    }, 500);
  },

  viewGet: (req, res) => {
    try {
      // Clear require cache first
      delete require.cache[require.resolve("../data/lists.js")];

      // Add a small delay to ensure file is written
      setTimeout(() => {
        const lists = require("../data/lists.js");
        const list = lists[req.params.name];

        if (!list) {
          return res.redirect("/form-editor/list-manager");
        }

        res.render("form-editor/view-list", {
          name: req.params.name,
          items: list,
        });
      }, 100);
    } catch (error) {
      console.error("Error loading list for preview:", error);
      res.redirect("/form-editor/list-manager");
    }
  },

  editGet: (req, res) => {
    delete require.cache[require.resolve("../data/lists.js")];
    const lists = require("../data/lists.js");
    const list = lists[req.params.name];

    if (!list) {
      return res.redirect("/form-editor/list-manager");
    }

    res.render("form-editor/edit-list", {
      name: req.params.name,
      items: list.join("\n"),
    });
  },

  editPost: (req, res) => {
    setTimeout(() => {
      delete require.cache[require.resolve("../data/lists.js")];
      const lists = require("../data/lists.js");
      const { items } = req.body;

      const processedItems = items
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      lists[req.params.name] = processedItems;

      fs.writeFileSync(
        listsFilePath,
        `module.exports = ${JSON.stringify(lists, null, 2)}`
      );
      res.redirect("/form-editor/list-manager");
    }, 500);
  },

  delete: (req, res) => {
    setTimeout(() => {
      delete require.cache[require.resolve("../data/lists.js")];
      const lists = require("../data/lists.js");
      delete lists[req.params.name];

      fs.writeFileSync(
        listsFilePath,
        `module.exports = ${JSON.stringify(lists, null, 2)}`
      );
      res.redirect("/form-editor/list-manager");
    }, 500);
  },
};
