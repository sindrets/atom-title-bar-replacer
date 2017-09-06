# Title Bar Replacer

Adds an alternative, theme-aware title bar and application menu that is more inline with Atom's UI design.

![Showcase of the replacer](http://i.imgur.com/s4wUu5M.gif)

This package is aimed mostly at Windows users, as the native Windows title bar doesn't really go well with Atom's UI design. This title bar replacer adds a functional custom title bar, that lets you move, scale, and utilize Aero-snap features. It also adds a custom application menu that is somewhat more intelligent in terms of design. The default behaviour of the title bar and application menu is to choose colours based on the theme you are currently using. However, most of the colours can be customized in the settings, and the menu can also be hidden.

# Removing the Native Title Bar

For Windows users, this package comes equipped with functionality to do just this for you. The Window Frame Removal Utility can be accessed  from the application menu:
* Packages > Title Bar Replacer > Settings > Window frame remover

It can also be accessed from the package settings under 'Configuration'. Further it can be accessed from the command palette by searching for 'Remove Window Frame'.

The utility will edit one line in Atom's source code in order to make Atom start frameless.

*Due to the fact that the source code is being edited, the frame removal has to be **redone after each Atom update.***

![Frame removal](http://i.imgur.com/UCSf8fo.png)

# Keyboard Navigation

The menu bar can be fully utilized from the keyboard. Pressing <kbd>Alt</kbd> will allow you to access the various categories through alt key shortcuts, or arrow keys.

* <kbd>Alt</kbd> - toggle alt key shortcuts or close menu if it's open
* <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> - navigate the menu
* <kbd>Enter</kbd> - Use selected menu item
* <kbd>Esc</kbd> - Close menu
* <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>M</kbd> - Toggle menu bar visibility

![Keyboard Navigation](http://i.imgur.com/WeAerzg.gif)

# Changelog

### 1.4.1
 * Hotfix: openCategory accessed from wrong scope

### 1.4.0 - Live Menu Updates
 * The menu now updates in real-time: updating label text, adding or removing new menu items, or categories
 * Improved selection of keystrokes for menu items
 * More exception handling

### 1.3.2
 * Hotfix: prevent crash upon accessing faulty menu items

### 1.3.1
 * Menu categories is navigated with left and right arrow keys when alt is pressed, or a submenu is unavailable in that direction
 * Alt is toggled off when the window becomes out of focus

### 1.3.0 - Keyboard Navigation
 * Full keyboard navigation support
 * Alt key shortcuts for the menu bar
 * The title bar is now hidden in fullscreen mode by default

### 1.2.0 - Auto Hide
 * Added an auto hide feature for the menu bar
 * Added an option to allow adjacent menu categories to be opened on mouse hover if a category is already open
 * Fixed bug that could cause malfunction in the title bar

### 1.1.0 - Reversion
 * Added an option in the Window Frame Remover to restore Atom, and bring back the native title bar.

### 1.0.0 - Initial release
