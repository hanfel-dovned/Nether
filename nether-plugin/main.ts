import { App, Plugin, PluginSettingTab, Setting, TFile, Notice } from 'obsidian';

/** 
 * Our plugin’s settings. 
 * We’ll let the user specify a server URL and an API key.
 */
interface NetherPluginSettings {
  serverUrl: string;
  apiKey: string;
}

/** 
 * Default settings. 
 */
const DEFAULT_SETTINGS: NetherPluginSettings = {
  serverUrl: '',
  apiKey: '',
};

export default class NetherPlugin extends Plugin {
  settings: NetherPluginSettings;

  async onload() {
    console.log('Loading NetherPlugin...');
    await this.loadSettings();

    // This registers our plugin’s settings tab:
    this.addSettingTab(new NetherPluginSettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading NetherPlugin...');
  }

  async loadSettings() {
    // Obsidian provides this.loadData() which reads from a data.json in your plugin’s folder
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /** 
   * Utility to get the current active note’s content. 
   */
  async getCurrentNoteContent(): Promise<{ file: TFile | null, content: string | null }> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return { file: null, content: null };
    }
    const content = await this.app.vault.read(file);
    return { file, content };
  }

  /**
   * Posts the current note’s content to the server.
   */
  async postDocument() {
    const { file, content } = await this.getCurrentNoteContent();
    if (!file || content === null) {
      new Notice('No active note found.');
      return;
    }

    try {
      const response = await fetch(this.settings.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify({ content }),
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
   * Retrieves a document from the server and overwrites the current note with the result.
   */
  async retrieveDocument() {
    const { file } = await this.getCurrentNoteContent();
    if (!file) {
      new Notice('No active note found.');
      return;
    }

    try {
      const response = await fetch(this.settings.serverUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.settings.apiKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (!data || typeof data.content !== 'string') {
        throw new Error('No "content" field in JSON.');
      }

      await this.app.vault.modify(file, data.content);
      new Notice('Document retrieved and updated.');
    } catch (err) {
      console.error(err);
      new Notice('Failed to retrieve document.');
    }
  }
}

/**
 * Plugin settings tab, where we display the two text fields (URL and Key)
 * and the Post/Retrieve buttons.
 */
class NetherPluginSettingTab extends PluginSettingTab {
  plugin: NetherPlugin;

  constructor(app: App, plugin: NetherPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'My Sync Plugin Settings' });

    // Server URL Setting
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

    // API Key Setting
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Authentication key for your Urbit app.')
      .addText(text => text
        .setPlaceholder('Your secret key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    // Post button
    new Setting(containerEl)
      .setName('Post Document')
      .setDesc('Send the current note’s content to your Urbit.')
      .addButton(button => {
        button.setButtonText('Post');
        button.onClick(async () => {
          await this.plugin.postDocument();
        });
      });

    // Retrieve button
    new Setting(containerEl)
      .setName('Retrieve Document')
      .setDesc('Fetch the document from your Urbit and overwrite the current note.')
      .addButton(button => {
        button.setButtonText('Retrieve');
        button.onClick(async () => {
          await this.plugin.retrieveDocument();
        });
      });
  }
}