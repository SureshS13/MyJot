/**
* Deletes all the children of the inputted HTML elements from the DOM.
* @param {HTMLElement[]} [elements=[]] An Array containing HTMLElements.
*/
function deleteAllChildren(elements = []) {
    if (Array.isArray(elements)) {
        for (const element of elements) {
            element.replaceChildren();
        }
    }
}

/**
* @typedef {Object} HTMLElementOptions
* @property {string} [type="p"] The type of the HTML element (e.g., "div", "span").
* @property {string} [text=""] The text content of the HTML element.
* @property {HTMLElement[]} [children=[]] An array of child elements to append to the created element.
* @property {Array.<{name: string, value: string}>} [attributes=[]] An array of objects, each containing `name` and `value` properties for each of the attributes to set on the element.
* @property {string[]} [classes=[]] An array of CSS classes to add to the created element.
* @property {string} [id=""] The ID to assign to the created element.
* @property {Object} [additionalOptions={}] Additional options for creating the HTML element.
* @property {boolean} [additionalOptions.placeChildrenBeforeText=false] Whether to place children before the text content.
*/

/**
* Creates an HTML element with specified attributes and children.
* @param {HTMLElementOptions} options Options for creating the HTML element.
* @returns {HTMLElement} The created HTML element.
*/
function createHTMLElement({ type = "p", text = "", children = [], attributes = [], classes = [], id = "", additionalOptions = { placeChildrenBeforeText: false } }) {
    let element = document.createElement(type);
    let elementText = document.createTextNode(text);

    // Append children before or after text based on the option
    if (additionalOptions.placeChildrenBeforeText) {
        for (const child of children) {
            element.appendChild(child);
        }
        element.appendChild(elementText);
    } else {
        element.appendChild(elementText);
        for (const child of children) {
            element.appendChild(child);
        }
    }

    // Set attributes
    for (const attribute of attributes) {
        element.setAttribute(attribute.name, attribute.value);
    }

    // Add classes
    for (const cssClass of classes) {
        element.classList.add(cssClass);
    }

    // Set ID if provided
    if (id.trim().length >= 1) {
        element.setAttribute("id", id);
    }

    return element;
}

/**
* Parses an HTML string and returns the first DOM element matching the given selector.
* @param {string} htmlString The HTML string to parse (must not be empty).
* @param {string} querySelector The CSS selector to find the element (must not be empty).
* @returns {HTMLElement} The first matching DOM element.
* @throws {TypeError} If either argument is not a string or is empty.
* @throws {Error} If no element is found for the selector.
*/
function parseHTMLToElement(htmlString, querySelector) {
    // Validate that the provided htmlString is a non-empty string
    if (typeof htmlString !== "string" || !htmlString) {
        throw new TypeError("htmlString must be a non-empty string.");
    }

    // Validate that the provided querySelector is a non-empty string
    if (typeof querySelector !== "string" || !querySelector) {
        throw new TypeError("querySelector must be a non-empty string.");
    }

    // Declare and initialize a new DOMParser object instance
    const domParser = new DOMParser();

    // Parse the HTML string into a document and extract the first matching element
    const newDocument = domParser.parseFromString(htmlString, "text/html");
    const element = newDocument.body.querySelector(querySelector);

    // Throw an error to the caller if the provided selector does not match any element
    if (!element) {
        throw new Error(`No element found for selector: ${querySelector}.`);
    }

    // Return the matching element
    return element;
}

export { deleteAllChildren, createHTMLElement, parseHTMLToElement }