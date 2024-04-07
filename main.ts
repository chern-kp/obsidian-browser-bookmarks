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

        // Create a dedicated container for the tree view
        const treeViewContainer = contentEl.createEl('div');
        treeViewContainer.setAttribute('id', 'tree-view-container');
        
        const fileInputEl = contentEl.createEl('input', { type: 'file' });
        fileInputEl.setAttribute('id', 'file-selector');
        fileInputEl.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                console.log('Selected file:', file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target?.result as string;
                    if (fileContent) {
                        const parsedData = JSON.parse(fileContent);
                        const dataArray = parsedData.roots?.bookmark_bar?.children;
                        if (dataArray) {
                            this.treeData = dataArray;
                            this.setAllNodesChecked(this.treeData, true);
                            this.renderTreeView(this.treeData, null);
                        }
                    }
                };
                reader.readAsText(file);
            }
        });

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
        // Get the dedicated container for the tree view
        const treeViewContainer = document.getElementById('tree-view-container');
        if (treeViewContainer) {
            // Clear the container before rendering the tree view
            treeViewContainer.empty();
            data.forEach((node) => {
                this.renderTreeNode(node, treeViewContainer, parent);
            });
        }
    }

    private renderTreeNode(node: Node, parentEl: HTMLElement, parent: Node | null, depth = 0) {
        if (node.type === 'folder') {
            const nodeEl = parentEl.createEl('div');
            nodeEl.style.marginLeft = `${depth * 20}px`;

            const checkbox = nodeEl.createEl('input', { type: 'checkbox' });
            checkbox.checked = node.isChecked || false;
            checkbox.addEventListener('change', () => this.handleCheck(node, checkbox.checked));
            nodeEl.createEl('label', { text: node.name });

            const childrenContainer = nodeEl.createEl('div');

            if (node.children) {
                node.children.forEach((child: Node) => {
                    this.renderTreeNode(child, childrenContainer, node, depth + 1);
                });
            }
        }
        this.nodeToParentMap.set(node, parent);
    }

    private handleCheck(node: Node, isChecked: boolean) {
        node.isChecked = isChecked;

        const updateChildren = (childNode: Node) => {
            childNode.isChecked = isChecked;
            if (childNode.children) {
                childNode.children.forEach(updateChildren);
            }
        };
        if (node.children) {
            node.children.forEach(updateChildren);
        }

        this.renderTreeView(this.treeData, null);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}