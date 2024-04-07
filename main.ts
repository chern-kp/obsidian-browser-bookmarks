import { Plugin, MarkdownView, Editor, Modal } from 'obsidian';

export default class ObsidinaBrowserBookmarks extends Plugin {
  onload() {
    console.log('Example plugin loaded');
    this.addCommand({
      id: 'get-browser-bookmarks',
      name: 'Get Browser Bookmarks',
      callback: this.insertBrowserBookmarks.bind(this),
    });

    this.addCommand({
      id: 'open-my-modal',
      name: 'Open My Modal',
      callback: () => this.openMyModal(),
    });
  }

  private insertBrowserBookmarks() {
    const activeView = this.getActiveMarkdownView();
    if (activeView) {
      const editor = activeView.editor;
      if (editor) {
        this.insertTextAtCursor(editor, 'Got Browser Bookmarks!');
      }
    }
  }

  private getActiveMarkdownView(): MarkdownView | null {
    return this.app.workspace.getActiveViewOfType(MarkdownView);
  }

  private insertTextAtCursor(editor: Editor, text: string) {
    const position = editor.getCursor();
    editor.replaceRange(text, position);
  }

  openMyModal() {
    const modal = new MyModal(this.app);
    modal.open();
  }
}

interface Node {
  name: string;
  children?: Node[];
  isChecked?: boolean;
  type?: string;
  parent?: Node;
}
class MyModal extends Modal {
    private treeData: Node[] = [];
    private nodeToParentMap: Map<Node, Node | null> = new Map();

    constructor(app: any) {
        super(app);
    }

onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'My Modal' });

    // File selector button
    const fileInputEl = contentEl.createEl('input', { type: 'file' });
    fileInputEl.setAttribute('id', 'file-selector'); // Set the id attribute
    fileInputEl.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            console.log('Selected file:', file.name);
            // Read the file content
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target?.result as string; // Use type assertion here
                if (fileContent) {
                    // Parse the JSON content
                    const parsedData = JSON.parse(fileContent);
                    // Access the 'bookmark_bar' object within 'roots'
                    const dataArray = parsedData.roots?.bookmark_bar?.children;
                    if (dataArray) {
                        this.treeData = dataArray;
                        // Set all nodes to checked by default
                        this.setAllNodesChecked(this.treeData, true);
                        this.renderTreeView(this.treeData, null); // Pass null as the parent for the root nodes
                    }
                }
            };
            reader.readAsText(file);
        }
    });

    // Select button
    const selectButtonEl = contentEl.createEl('button', { text: 'Select' });
    selectButtonEl.addEventListener('click', () => {
        console.log('Selected!');
    });
}

    private setAllNodesChecked(nodes: Node[], isChecked: boolean) {
        nodes.forEach(node => {
            node.isChecked = isChecked;
            if (node.children) {
                this.setAllNodesChecked(node.children, isChecked);
            }
        });
    }

    private renderTreeView(data: Node[], parent: Node | null) {
        const { contentEl } = this;
        contentEl.empty(); // Clear the content before rendering
        data.forEach((node) => {
            this.renderTreeNode(node, contentEl, parent);
        });
    }

    private renderTreeNode(node: Node, parentEl: HTMLElement, parent: Node | null, depth = 0) {
        // Check if the node is a folder
        if (node.type === 'folder') {
            const nodeEl = parentEl.createEl('div');
            nodeEl.style.marginLeft = `${depth * 20}px`;

            const checkbox = nodeEl.createEl('input', { type: 'checkbox' });
            checkbox.checked = node.isChecked || false; // Ensure the checkbox reflects the node's checked state
            checkbox.addEventListener('change', () => this.handleCheck(node, checkbox.checked));
            nodeEl.createEl('label', { text: node.name });

            // Create a container for the children
            const childrenContainer = nodeEl.createEl('div');

            // Render children if the node has any
            if (node.children) {
                node.children.forEach((child: Node) => {
                    // Recursively render each child node within the childrenContainer
                    this.renderTreeNode(child, childrenContainer, node, depth + 1);
                });
            }
        }
        // Update the map with the parent of the current node
        this.nodeToParentMap.set(node, parent);
    }

    private handleCheck(node: Node, isChecked: boolean) {
        // Update the checked state of the current node
        node.isChecked = isChecked;

        // Recursively update children
        const updateChildren = (childNode: Node) => {
            childNode.isChecked = isChecked;
            if (childNode.children) {
                childNode.children.forEach(updateChildren);
            }
        };
        if (node.children) {
            node.children.forEach(updateChildren);
        }

        // Re-render the tree view to reflect the changes
        this.renderTreeView(this.treeData, null);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}