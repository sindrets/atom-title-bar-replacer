### 1.5.0 - General Improvements
 * Pressing space bar now uses the selected menu item without closing the application menu
 * Implemented support for command details
 * No longer stopping key event propagation if no action responding to a key event is taken in the Title Bar Replacer
 * Added setting for title bar visibility
 * Improved selection of keystrokes for menu items
 * Handle error that occurs when the title element is accessed pre definition
 * Window control icons now transition to white on hover
 * New markup structure and class naming

### 1.4.3
 * Bug fixes for the menu updater: improved order of index incrementation
 * Exception handling: the menu updater now ignores objects with insufficient properties

### 1.4.2
 * Bug fixes for the menu updater

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
