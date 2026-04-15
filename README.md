# Open in Terminal

An [Obsidian](https://obsidian.md) plugin that opens a system terminal at the directory of the current note.

## Features

- **Command palette**: run `Open terminal here` from Ctrl/Cmd+P
- **Right-click in file explorer**: context menu item on any file or folder
- **Right-click in editor**: context menu item inside the note body
- **Cross-platform**: macOS, Linux, and Windows with popular terminal apps pre-configured
- **Custom terminal**: enter any command with `{dir}` as the directory placeholder

## Installation

### From Obsidian Community Plugins (recommended)

1. Open Settings → Community plugins
2. Search for "Open in Terminal"
3. Click Install, then Enable

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/maropark/obsidian-open-in-terminal/releases/latest)
2. Copy both files into `<vault>/.obsidian/plugins/open-in-terminal/`
3. Reload Obsidian and enable the plugin in Settings → Community plugins

## Configuration

Open Settings → Open in Terminal to choose your preferred terminal per platform.

| Platform | Supported terminals |
|----------|---------------------|
| macOS    | Terminal, iTerm2, Warp, Alacritty, kitty, Custom |
| Linux    | GNOME Terminal, Konsole, Xfce Terminal, Alacritty, kitty, xterm, Custom |
| Windows  | Windows Terminal, Command Prompt, PowerShell, PowerShell (legacy), Custom |

For **Custom**, enter any shell command using `{dir}` as the placeholder:

```
myterm --workdir={dir}
```

## Development

```bash
git clone https://github.com/maropark/obsidian-open-in-terminal
cd obsidian-open-in-terminal
npm install

# Watch mode (rebuilds on save)
npm run dev

# Production build
npm run build
```

Symlink into your vault for live testing:

```bash
ln -sf ~/Projects/open-in-terminal \
       ~/path/to/vault/.obsidian/plugins/open-in-terminal
```

Then enable the plugin in Obsidian and use Ctrl+P → "Reload app without saving" after changes.

## License

MIT
