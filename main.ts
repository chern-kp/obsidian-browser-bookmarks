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

class MyModal extends Modal {
 constructor(app: any) {
    super(app);
 }

 onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'My Modal' });

    const inputEl = contentEl.createEl('input', { type: 'text', placeholder: 'Enter text here' });
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.close();
      }
    });

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
            const bookmarks = JSON.parse(fileContent);
            const links = this.extractLinks(bookmarks.roots.bookmark_bar);
            console.log('First 5 links:', links.slice(0, 5));
            this.logSubfolderInfo(bookmarks.roots.bookmark_bar, '');
          }
        };
        reader.readAsText(file);
      }
    });

    contentEl.createEl('button', { text: 'Submit' }).addEventListener('click', () => {
      console.log('Submitted:', inputEl.value);
      this.close();
    });
 }

 onClose() {
    const { contentEl } = this;
    contentEl.empty();
 }

 private extractLinks(bookmarkItem: any, links: string[] = []): string[] {
    if (bookmarkItem.type === 'url') {
      links.push(bookmarkItem.url);
    }
    if (bookmarkItem.children) {
      for (const child of bookmarkItem.children) {
        this.extractLinks(child, links);
      }
    }
    return links;
 }

 private logSubfolderInfo(bookmarkItem: any, indent: string) {
    if (bookmarkItem.type === 'folder') {
      console.log(indent + 'Folder Name:', bookmarkItem.name);
      if (bookmarkItem.children && bookmarkItem.children.length > 0) {
        const firstChild = bookmarkItem.children[0];
        if (firstChild.type === 'url') {
          console.log(indent + ' First Item URL:', firstChild.url);
        }
      }
    }
    if (bookmarkItem.children) {
      for (const child of bookmarkItem.children) {
        this.logSubfolderInfo(child, indent + ' ');
      }
    }
 }
}