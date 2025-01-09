# Nether

**THIS APP IS IN ALPHA. DO NOT USE IT WITH ANY DATA YOU ACTUALLY CARE ABOUT.**

Nether lets you sync Obsidian documents across your devices using your Urbit ship.

**Installation**

1. On your Urbit ship, run `|install ~ridlyd %nether` and `|pass [%e [%approve-origin 'app://obsidian.md']]`. Open the app and copy the key.

2. Clone this repo to your local machine. From the `nether-plugin` directory, copy these three files into `<YourVault>/.obsidian/plugins/nether/`:
- `main.js`
- `styles.css`
- `manifest.json`

3. In Obsidian, open `Settings` -> `Community plugins` and disable `Restricted mode`. You should see Nether under `Installed plugins` in the same tab; enable it, and then open the Nether tab in the left sidebar.

4. Copy in your ship URL and secret key. Choose a name to identify your current vault by. Now you can create an empty vault on another installation of Obsidian, install this plugin there, and use this same name to automatically sync files across your devices.