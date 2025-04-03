const { resolve } = require('path')
const { cwd } = require('process')

//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const { addFilter, addFunction } = govukPrototypeKit.views

// Add your filters here

// Import the marked package for Markdown parsing
const marked = require('marked');

// Define filters
module.exports = function (env) {
  // Define a Markdown filter
  env.addFilter('markdown', (text) => {
    if (text && typeof text === 'string') {
      return marked(text);
    }
    return text;
  });
};

addFunction('require', (path) => {
  try {
    return require(resolve(cwd(), 'app', path))
  } catch {
    return {}
  }
})

addFilter(
  'search',

  /**
   * @param {FormLibrary['items']} items
   * @param {Partial<Record<string, string | string[]>>} [data]
   */
  function (items, data = {}) {
    const { author, name, organisation, status } = data

    // Form name keyword search
    if (name && typeof name === 'string') {
      const keywords = name.toLowerCase().split(/[\s+]+/)

      items = items.filter((item) =>
        keywords.every((keyword) => item.name.toLowerCase().includes(keyword)),
      )
    }

    // Created or updated by author search
    if (Array.isArray(author) && author[0]) {
      items = items.filter(
        (item) =>
          author.includes(item.created.name) ||
          author.includes(item.updated.name)
      )
    }

    // Organisation filter
    if (Array.isArray(organisation) && organisation[0]) {
      items = items.filter((item) => organisation.includes(item.organisation))
    }

    // Status filter
    if (Array.isArray(status) && status[0]) {
      items =
        status.length === 1
          ? items.filter((item) => status.includes(item.status))
          : items.filter((item) => item.status === status.join('-'))
    }

    return items
  }
)

/**
 * @typedef {typeof import('./data/form-library.json')} FormLibrary
 */

