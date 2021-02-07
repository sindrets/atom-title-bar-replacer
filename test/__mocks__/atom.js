const atom = jest.fn();
atom.CompositeDisposable = jest.fn();
atom.keymaps = {
    findKeyBindings: jest.fn().mockImplementation((...args) => {
        return [];
    })
}
atom.menu = {};

module.exports = atom;
