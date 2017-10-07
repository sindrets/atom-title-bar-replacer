'use babel'

const TitleBarReplacer = require("./title-bar-replacer");
const ConfigSchema = require("./configuration.js");

export default {

    config: ConfigSchema.config,
    titleBarReplacer: new TitleBarReplacer.default(),

    activate(state) {
        this.titleBarReplacer.activate(state);
    },

    deactivate() {
        this.titleBarReplacer.deactivate();
    },

    serialize() {
        return this.titleBarReplacer.serialize();
    },

    deserialize({ data }) {
        console.log(data);
    }

}
