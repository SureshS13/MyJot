/**
* Creates an HTML element with specified attributes and children.
* @param {HTMLElementOptions} options Options for creating the HTML element.
* @returns {HTMLElement} The created HTML element.
*/
export function createHTMLElement({ type = "p", text = "", children = [], attributes = [], classes = [], id = "", additionalOptions = { placeChildrenBeforeText: false } }) {
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