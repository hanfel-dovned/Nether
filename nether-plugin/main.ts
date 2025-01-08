import { App, Plugin, PluginSettingTab, Setting, TFile, Notice } from 'obsidian';

interface NetherPluginSettings {
  serverUrl: string;
  apiKey: string;
}

const DEFAULT_SETTINGS: NetherPluginSettings = {
  serverUrl: '',
  apiKey: '',
};

export default class NetherPlugin extends Plugin {
  settings: NetherPluginSettings;

  async onload() {
    console.log('Loading NetherPlugin...');
    await this.loadSettings();
    this.addSettingTab(new NetherPluginSettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading NetherPlugin...');
  }

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Utility to get the current active note’s file and content.
   */
  async getCurrentNoteContent(): Promise<{ file: TFile | null; content: string | null }> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return { file: null, content: null };
    }
    const content = await this.app.vault.read(file);
    return { file, content };
  }

  /**
   * POST the current note’s title (no extension) and content to the server.
   * Sending JSON: { title, content }
   */
  async postDocument() {
    const { file, content } = await this.getCurrentNoteContent();
    if (!file || content === null) {
      new Notice('No active note found.');
      return;
    }

    const noteTitle = file.basename;

    try {
      const response = await fetch(this.settings.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.settings.apiKey,
        },
        body: JSON.stringify({
          title: noteTitle,
          content: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      new Notice('Document posted successfully.');
    } catch (err) {
      console.error(err);
      new Notice('Failed to post document.');
    }
  }

  /**
   * GET the document from `serverUrl/file/<title>` and overwrite the current note’s content.
   * Expected JSON response: { title, content }
   */
  async retrieveDocument() {
    const { file } = await this.getCurrentNoteContent();
    if (!file) {
      new Notice('No active note found.');
      return;
    }

    const noteTitle = file.basename;
    const encodedTitle = encodeURIComponent(noteTitle);

    try {
      const url = `${this.settings.serverUrl}/file/${encodedTitle}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.settings.apiKey, // No 'Bearer' prefix
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (!data || typeof data.content !== 'string' || typeof data.title !== 'string') {
        throw new Error('Response JSON did not have "title" and "content" fields.');
      }

      await this.app.vault.modify(file, data.content);
      new Notice(`Document retrieved for "${data.title}" and updated.`);
    } catch (err) {
      console.error(err);
      new Notice('Failed to retrieve document.');
    }
  }
}

class NetherPluginSettingTab extends PluginSettingTab {
  plugin: NetherPlugin;

  constructor(app: App, plugin: NetherPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Nether Plugin Settings' });

    new Setting(containerEl)
      .setName('Urbit URL')
      .setDesc('The URL of your Urbit app (ends in /apps/nether).')
      .addText(text => text
        .setPlaceholder('https://sampel-palnet.startram.io/apps/nether')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (value) => {
          this.plugin.settings.serverUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Key')
      .setDesc('Secret key from your Urbit app.')
      .addText(text => text
        .setPlaceholder('Your secret key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Post Document')
      .setDesc('POST the current note’s title/content to your ship.')
      .addButton(button => {
        button.setButtonText('Post');
        button.onClick(async () => {
          await this.plugin.postDocument();
        });
      });

    new Setting(containerEl)
      .setName('Retrieve Document')
      .setDesc('GET the document from your ship and overwrite the current note.')
      .addButton(button => {
        button.setButtonText('Retrieve');
        button.onClick(async () => {
          await this.plugin.retrieveDocument();
        });
      });
  }
}