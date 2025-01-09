import { 
  App, 
  Plugin, 
  PluginSettingTab, 
  Setting, 
  TFile, 
  Notice 
} from 'obsidian';

interface NetherPluginSettings {
  serverUrl: string;     // e.g. https://example-star.startram.io/apps/nether
  apiKey: string;        // The secret key
  vaultName: string;     // The name of this vault, to separate multiple vaults on the server
  lastSyncedAt: number;  // The latest timestamp we've successfully synced
}

const DEFAULT_SETTINGS: NetherPluginSettings = {
  serverUrl: '',
  apiKey: '',
  vaultName: '',
  lastSyncedAt: 0,
};

export default class NetherPlugin extends Plugin {
  settings: NetherPluginSettings;

  // We'll store a map of timeouts for each file so we can debounce changes:
  private uploadTimeouts: Map<string, number> = new Map();

  async onload() {
    console.log('Loading NetherPlugin (auto-sync)...');
    await this.loadSettings();
    this.addSettingTab(new NetherPluginSettingTab(this.app, this));

    // Whenever a Markdown file is modified, schedule an upload.
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.scheduleUpload(file);
        }
      })
    );

    // Poll the server every 10 seconds for new docs
    this.registerInterval(
      window.setInterval(() => this.pullUpdates(), 10000)
    );
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
   * Schedule an upload for the given file, debounced by 10 seconds.
   * If the user keeps editing the file, we'll keep resetting the timer.
   */
  private scheduleUpload(file: TFile) {
    const filePath = file.path;

    // If there's an existing timer for this file, clear it
    if (this.uploadTimeouts.has(filePath)) {
      window.clearTimeout(this.uploadTimeouts.get(filePath));
    }

    // Set a new timer for 10 seconds
    const timeoutId = window.setTimeout(() => {
      this.uploadFile(file);
      this.uploadTimeouts.delete(filePath);
    }, 10_000);

    this.uploadTimeouts.set(filePath, timeoutId);
  }

  /**
   * Actually upload a file: read its content and POST to the server.
   * We'll include the current timestamp in the JSON body.
   */
  private async uploadFile(file: TFile) {
    try {
      const content = await this.app.vault.read(file);
      const now = Date.now();

      // POST to something like: POST /upload
      // Body:
      // { vault, title, content, timestamp }
      const response = await fetch(`${this.settings.serverUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.settings.apiKey,
        },
        body: JSON.stringify({
          vault: this.settings.vaultName,
          title: file.basename,
          content: content,
          timestamp: now
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // If the POST succeeded, update our lastSyncedAt to at least 'now'
      // in case this is the highest timestamp we've sent or received so far.
      if (now > this.settings.lastSyncedAt) {
        this.settings.lastSyncedAt = now;
        await this.saveSettings();
      }

      console.log(`Auto-synced: ${file.basename} at ${now}`);
    } catch (err) {
      console.error('Auto-sync upload failed:', err);
    }
  }

  /**
   * Pull any updates from the server that have a timestamp
   * newer than our current `lastSyncedAt`.
   *
   * For each returned doc:
   *   - If the local file exists, overwrite it
   *   - If not, create it (optional)
   * Update our `lastSyncedAt` so we only pull newer data next time.
   */
  private async pullUpdates() {
    try {
      // GET /pull?vault=<vaultName>&since=<lastSyncedAt>
      const url = `${this.settings.serverUrl}/pull?vault=${encodeURIComponent(this.settings.vaultName)}&since=${this.settings.lastSyncedAt}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.settings.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // Expecting JSON: { updates: [ {title, content, timestamp}, ... ] }
      // Possibly no updates, or many
      const data = await response.json();
      if (!data || !Array.isArray(data.updates)) {
        throw new Error('Response JSON missing "updates" array.');
      }

      let highestTimestamp = this.settings.lastSyncedAt;

      for (const doc of data.updates) {
        if (!doc.title || !doc.content || !doc.timestamp) {
          continue; // Skip malformed entries
        }
        const localFile = this.app.vault.getAbstractFileByPath(doc.title + '.md');
        if (localFile instanceof TFile) {
          // Overwrite
          await this.app.vault.modify(localFile, doc.content);
        } else {
          // Optional: create a new file if it doesn’t exist
          await this.app.vault.create(doc.title + '.md', doc.content);
        }

        if (doc.timestamp > highestTimestamp) {
          highestTimestamp = doc.timestamp;
        }

        console.log(`Pulled and updated: ${doc.title} (ts=${doc.timestamp})`);
      }

      // Update our last synced timestamp
      if (highestTimestamp > this.settings.lastSyncedAt) {
        this.settings.lastSyncedAt = highestTimestamp;
        await this.saveSettings();
      }
    } catch (err) {
      console.error('Failed to pull updates:', err);
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
      .setDesc('The URL of your Urbit Nether app (e.g., /apps/nether).')
      .addText(text => text
        .setPlaceholder('https://sampel-palnet.startram.io/apps/nether')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (value) => {
          this.plugin.settings.serverUrl = value;
        }));

    new Setting(containerEl)
      .setName('Key')
      .setDesc('Secret key from your Urbit app.')
      .addText(text => text
        .setPlaceholder('Your secret key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
        }));

    new Setting(containerEl)
      .setName('Vault Name')
      .setDesc('A unique name for this vault to sync files to and from.')
      .addText(text => text
        .setPlaceholder('MyVaultName')
        .setValue(this.plugin.settings.vaultName)
        .onChange(async (value) => {
          this.plugin.settings.vaultName = value;
        }));

    new Setting(containerEl)
      .setName('Save Settings')
      .setDesc('Apply your changes.')
      .addButton(button => {
        button.setButtonText('Save');
        button.onClick(async () => {
          await this.plugin.saveSettings();
          new Notice('Nether plugin settings have been saved.');
        });
      });
  }
}