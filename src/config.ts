export const config = {
    general: {
        order: 1,
        type: "object",
        title: "General",
        properties: {
            displayTitleBar: {
                order: 1,
                title: "Display Title Bar",
                description: "Determines whether or not the title bar should be displayed by default.",
                type: "boolean",
                default: true
            },
            displayMenuBar: {
                order: 2,
                title: "Display Menu Bar",
                description: "Determines whether or not the menu bar should be displayed by default. Overridden by 'Auto Hide'.",
                type: "boolean",
                default: true
            },
            openAdjacent: {
                order: 3,
                title: "Open Adjacent Categories On Hover",
                description: "Opens adjacent menu categories on mouse hover as long as a menu category is already open.",
                type: "boolean",
                default: true
            },
            autoHide: {
                order: 4,
                title: "Auto Hide Menu Bar",
                description: "Automatically hide the menu bar and toggle it by pressing Alt. Overrides 'Display Menu Bar'.",
                type: "boolean",
                default: false
            },
            hideFullscreenTitle: {
                order: 5,
                title: "Hide Title Bar in Fullscreen",
                type: "boolean",
                default: true
            }
        }
    },
    colors: {
        order: 2,
        type: "object",
        title: "Appearance",
        properties: {
            autoSelectColor: {
                order: 1,
                title: "Automatically Select Title Bar Colors",
                description: "The ui-variables will be used as a base for the title bar design. <br/>If you untick this option you can use the following colors as a base:",
                type: "boolean",
                default: true
            },
            baseColor: {
                order: 2,
                title: "Base Color",
                description: "Color of the title bar background",
                type: "color",
                default: "#212326"
            },
            highlightColor: {
                order: 3,
                title: "Highlight Color",
                description: "Color of the highlighted fields in the menu bar",
                type: "color",
                default: "#3A465B"
            },
            textColor: {
                order: 4,
                title: "Text Color",
                description: "Base  for text and icons in the title bar",
                type: "color",
                default: "#a1adad"
            },
            style: {
                order: 5,
                title: "Style",
                type: "string",
                enum: [
                    "Spacious",
                    "Compact"
                ],
                default: "Spacious"
            },
            controlTheme: {
                order: 6,
                title: "Window Controls Theme",
                type: "string",
                enum: [
                    "Windows 10",
                    "Arc",
                    "Yosemite",
                    "Legacy"
                ],
                default: "Windows 10"
            },
            controlLocation: {
                order: 7,
                title: "Reverse Window Controls Location",
                type: "boolean",
                default: false
            }
        }
    },
};
