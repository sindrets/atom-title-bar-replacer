module.exports =
    config:
        general:
            order: 1
            type: "object"
            title: "General"
            properties:
                displayTitleBar:
                    order: 1
                    title: "Display Title Bar"
                    description: "Determines whether or not the title bar should be displayed by default."
                    type: "boolean"
                    default: true
                displayMenu:
                    order: 2
                    title: "Display Menu Bar"
                    description: "Determines whether or not the menu bar should be displayed by default. Overridden by 'Auto Hide'."
                    type: "boolean"
                    default: true
                closeOnDispatch:
                    order: 3
                    title: "Close Menu On Dispatch"
                    description: "Closes the application menu once you click an item."
                    type: "boolean"
                    default: true
                openAdjacent:
                    order: 4
                    title: "Open Adjacent Categories On Hover"
                    description: "Opens adjacent menu categories on mouse hover as long as a menu category is already open."
                    type: "boolean"
                    default: true
                autoHide:
                    order: 5
                    title: "Auto Hide Menu Bar"
                    description: "Automatically hide the menu bar and toggle it by pressing Alt. Overrides 'Display Menu Bar'."
                    type: "boolean"
                    default: false
                hideFullscreenTitle:
                    order: 6
                    title: "Hide Title Bar in Fullscreen"
                    type: "boolean"
                    default: true
        colours:
            order: 2
            type: "object"
            title: "Colours"
            properties:
                navColour:
                    order: 1
                    title: "Navigation Button Highlight Colour"
                    description: "Sets the colour of the highlights displayed when hovering over the title bar navigation buttons"
                    type: "color"
                    default: "#397F7A"
                autoSelectColour:
                    order: 2
                    title: "Automatically Select Title Bar Colours"
                    description: "The ui-variables will be used as a base for the title bar design. <br/>If you untick this option you can use the following colours as a base:"
                    type: "boolean"
                    default: true
                baseColour:
                    order: 3
                    title: "Base Colour"
                    description: "Colour of the title bar background"
                    type: "color"
                    default: "#212326"
                highlightColour:
                    order: 4
                    title: "Highlight Colour"
                    description: "Colour of the highlighted fields in the menu bar"
                    type: "color"
                    default: "#3A465B"
                textColour:
                    order: 5
                    title: "Text Colour"
                    description: "Base colour for text and icons in the title bar"
                    type: "color"
                    default: "#A2A6AE"
        configuration:
            order: 3
            type: "object"
            title: "Configuration"
            properties:
                restoreDefaults:
                    title: "Restore Defaults"
                    description: "Restore to the default settings of Title Bar Replacer."
                    type: "boolean"
                    default: false
                removeFrame:
                    title: "Remove Window Frame"
                    description: "Runs the window frame removal utility, which essentially edits one line in Atom's 'atom-window.js'."
                    type: "boolean"
                    default: false
