# Title Bar Replacer

Adds an alternative, theme-aware title bar and application menu that is more inline with Atom's UI design.

![Showcase of the replacer](https://drive.google.com/uc?export=download&id=0Byw2iYIxnNWKbVVlUVZHT0FrVWs)

This package is aimed mostly at Windows users, as the native Windows title bar doesn't really go well with Atom's UI design. This title bar replacer adds a functional custom title bar, that lets you move, scale, and utilize Aero-snap features. It also adds a custom application menu that is somewhat more intelligent in terms of design. The default behaviour of the title bar and application menu is to choose colours based on the theme you are currently using. However, most of the colours can be customized in the settings, and the menu can also be hidden.

# Removing the Native Title Bar

For Windows users, this package comes equiped with functionality to do just this for you. The Window Frame Removal Utility can be accessed  from the application menu:
* Packages > Title Bar Replacer > Settings > Window frame remover

It can also be accessed from the package settings under 'Configuration'. Further it can be accessed from the command pallette by searching for 'Remove Window Frame'.

The utility will edit one line in Atom's source code in order to make Atom start frameless. Due to the fact that it edits the source code, the removal has to be redone after each Atom update.

![Frame removal](https://drive.google.com/uc?export=download&id=0Byw2iYIxnNWKZ1ZCVUlQTEtMN1U)
