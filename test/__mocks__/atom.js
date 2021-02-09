const atom = jest.fn();
atom.CompositeDisposable = jest.fn();
atom.keymaps = {
    findKeyBindings: jest.fn().mockImplementation((...args) => {
        return [];
    })
}
atom.workspace = {
    onDidChangeActivePaneItem: jest.fn()
}
atom.menu = {};

module.exports = atom;
