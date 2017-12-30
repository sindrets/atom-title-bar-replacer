# Title Bar Replacer

Adds an alternative, theme-aware title bar and application menu that is more inline with Atom's UI design.

![Showcase of the replacer](http://i.imgur.com/s4wUu5M.gif)

This package is aimed mostly at Windows users, as the native Windows title bar doesn't really go well with Atom's UI design. This title bar replacer adds a functional custom title bar, that lets you move, scale, and utilize Aero-snap features. It also adds a custom application menu that is somewhat more intelligent in terms of design. The default behaviour of the title bar and application menu is to choose colours based on the theme you are currently using. However, most of the colours can be customized in the settings, and the menu can also be hidden.

# Removing the Native Title Bar

For Windows users, this package comes equipped with functionality to do just this for you. The Window Frame Removal Utility can be accessed  from the application menu:
* Packages > Title Bar Replacer > Quick Settings > Window frame remover

It can also be accessed from the package settings under 'Configuration'. Further it can be accessed from the command palette by searching for 'Remove Window Frame'.

The utility will edit one line in Atom's source code in order to make Atom start frameless.

> Note: Atom 1.21 brought back Asar archiving of the application. This makes source code editing much more difficult, and - more notably for users - much slower, as the archive needs to be extracted, modified, then repacked.

*Due to the fact that the source code is being edited, the frame removal has to be **redone after each Atom update.***

![Frame removal](http://i.imgur.com/UCSf8fo.png)

# Keyboard Navigation

The menu bar can be fully utilized from the keyboard. Pressing <kbd>Alt</kbd> will allow you to access the various categories through alt key shortcuts, or arrow keys.

* <kbd>Alt</kbd> - toggle alt key shortcuts or close menu if it's open
* <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> - navigate the menu
* <kbd>Enter</kbd> - Use selected menu item
* <kbd>Space</kbd> - Use selected menu item without closing the application menu
* <kbd>Esc</kbd> - Close menu
* <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> - Toggle menu bar visibility
* <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> - Toggle title bar visibility

![Keyboard Navigation](http://i.imgur.com/WeAerzg.gif)

# UI Customization

There are provided settings to adjust the title bar layout style as well as a few different window contols presets. If there is some design you are unhappy with, or some design features you miss, the title bar is highly adjustable through CSS (Atom's stylesheet).

![UI Customization](https://i.imgur.com/XkEmfzB.gif)

# Changelog

### 1.8.1
 * Fixed fatal bug occurring when no serialization state exists.

### 1.8.0 - Performance Optimization
 * Unimplemented the transpiler. All TypeScript source files are now compiled pre-distribution.
 * Implemented serialization. HTML is now stored and deserialized upon launch.
 * Fixed bug that caused the 'Restore Defaults' button not to work.
 * Handling exiting and disabling properly
 * More type definitions.

### 1.7.0 - UI Customization Overhaul
 * Added style presets
    * Added Spacious preset
    * Added Compact preset
 * Added window controls presets
    * Added Windows 10 preset
    * Added Arc Theme preset
    * Added Yosemite preset
    * Added Legacy theme preset
 * More source code documentation and type definitions
 * Added more CSS selectors for customizability
    * Unique style preset selectors
    * Unique window controls preset selectors
    * Reverse window controls flag selector
    * Title bar visibility selector
    * Menu bar visibility selector
 * Removed 'Navigation Button Highlight Colour' setting

For the full changelog, visit [the repository](https://github.com/sindrets/atom-title-bar-replacer/blob/master/CHANGELOG.md).
