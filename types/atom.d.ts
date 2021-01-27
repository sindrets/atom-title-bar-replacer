declare module 'atom' {
    export interface CommandRegistry {
        dispatch(target: Node, commandName: string, commandDetail: string): Promise<void> | null;
    }

    class TextEditor {
        getElement(): Node;
    }
}
