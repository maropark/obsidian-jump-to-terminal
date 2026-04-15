import {
	App,
	FileSystemAdapter,
	Menu,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TAbstractFile,
} from "obsidian";
import { exec } from "child_process";
import { dirname } from "path";

// ── Types ──────────────────────────────────────────────────────────────────

interface TerminalConfig {
	command: string; // command template, {dir} is replaced with the target directory
	label: string;
}

interface OpenInTerminalSettings {
	macTerminal: string;
	linuxTerminal: string;
	winTerminal: string;
	customMac: string;
	customLinux: string;
	customWin: string;
}

// ── Terminal definitions ───────────────────────────────────────────────────

const TERMINALS_MAC: Record<string, TerminalConfig> = {
	terminal: { label: "Terminal (built-in)", command: "open -a Terminal {dir}" },
	iterm: { label: "iTerm2", command: "open -a iTerm {dir}" },
	warp: { label: "Warp", command: "open -a Warp {dir}" },
	alacritty: { label: "Alacritty", command: "open -a Alacritty {dir}" },
	kitty: { label: "kitty", command: "kitty --directory={dir}" },
	custom: { label: "Custom…", command: "" },
};

const TERMINALS_LINUX: Record<string, TerminalConfig> = {
	gnome: { label: "GNOME Terminal", command: "gnome-terminal --working-directory={dir}" },
	konsole: { label: "Konsole (KDE)", command: "konsole --workdir {dir}" },
	xfce: { label: "Xfce Terminal", command: "xfce4-terminal --working-directory={dir}" },
	alacritty: { label: "Alacritty", command: "alacritty --working-directory {dir}" },
	kitty: { label: "kitty", command: "kitty --directory={dir}" },
	xterm: { label: "xterm", command: `xterm -e "cd {dir} && exec bash"` },
	custom: { label: "Custom…", command: "" },
};

const TERMINALS_WIN: Record<string, TerminalConfig> = {
	wt: { label: "Windows Terminal", command: "start wt -d {dir}" },
	cmd: { label: "Command Prompt", command: `start cmd /K "cd /d {dir}"` },
	pwsh: { label: "PowerShell", command: `start pwsh -NoExit -Command "Set-Location '{dir}'"` },
	powershell: { label: "PowerShell (legacy)", command: `start powershell -NoExit -Command "Set-Location '{dir}'"` },
	custom: { label: "Custom…", command: "" },
};

const DEFAULT_SETTINGS: OpenInTerminalSettings = {
	macTerminal: "terminal",
	linuxTerminal: "gnome",
	winTerminal: "wt",
	customMac: "",
	customLinux: "",
	customWin: "",
};

// ── Plugin ─────────────────────────────────────────────────────────────────

export default class OpenInTerminalPlugin extends Plugin {
	settings: OpenInTerminalSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new OpenInTerminalSettingTab(this.app, this));

		// Command palette
		this.addCommand({
			id: "open-terminal-here",
			name: "Open terminal here",
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (!file) {
					new Notice("Open in Terminal: No active file.");
					return;
				}
				this.openTerminalAtFile(file);
			},
		});

		// File explorer context menu
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
				menu.addItem((item) => {
					item
						.setTitle("Open terminal here")
						.setIcon("terminal")
						.onClick(() => this.openTerminalAtFile(file));
				});
			})
		);

		// Editor body context menu (right-click inside note)
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return;
				menu.addItem((item) => {
					item
						.setTitle("Open terminal here")
						.setIcon("terminal")
						.onClick(() => this.openTerminalAtFile(file));
				});
			})
		);
	}

	onunload() {
		// registerEvent handles cleanup automatically
	}

	// ── Core ────────────────────────────────────────────────────────────────

	openTerminalAtFile(file: TAbstractFile) {
		const dir = this.resolveDirectory(file);
		if (!dir) {
			new Notice("Open in Terminal: Could not resolve file path. Is this a local vault?");
			return;
		}
		const command = this.buildCommand(dir);
		if (!command) {
			new Notice("Open in Terminal: No terminal configured. Check plugin settings.");
			return;
		}
		this.launch(command);
	}

	private resolveDirectory(file: TAbstractFile): string | null {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) return null;
		const basePath = adapter.getBasePath();
		return dirname(`${basePath}/${file.path}`);
	}

	private buildCommand(dir: string): string | null {
		const platform = process.platform;
		let template: string;

		if (platform === "darwin") {
			const key = this.settings.macTerminal;
			template = key === "custom" ? this.settings.customMac : (TERMINALS_MAC[key]?.command ?? "");
		} else if (platform === "linux") {
			const key = this.settings.linuxTerminal;
			template = key === "custom" ? this.settings.customLinux : (TERMINALS_LINUX[key]?.command ?? "");
		} else if (platform === "win32") {
			const key = this.settings.winTerminal;
			template = key === "custom" ? this.settings.customWin : (TERMINALS_WIN[key]?.command ?? "");
		} else {
			return null;
		}

		if (!template) return null;

		// Escape the directory path for safe shell insertion
		const escapedDir =
			platform === "win32"
				? dir.replace(/\//g, "\\")
				: `"${dir.replace(/"/g, '\\"')}"`;

		return template.replace(/\{dir\}/g, escapedDir);
	}

	private launch(command: string) {
		const options =
			process.platform === "win32" ? { shell: true } : { shell: "/bin/sh" };

		exec(command, options as Parameters<typeof exec>[1], (error) => {
			if (error) {
				console.error("Open in Terminal error:", error);
				new Notice(`Open in Terminal: Failed to launch.\n${error.message}`);
			}
		});
	}

	// ── Settings ────────────────────────────────────────────────────────────

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ── Settings tab ───────────────────────────────────────────────────────────

class OpenInTerminalSettingTab extends PluginSettingTab {
	plugin: OpenInTerminalPlugin;

	constructor(app: App, plugin: OpenInTerminalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Open in Terminal" });

		this.renderPlatformSection(
			containerEl,
			"macOS",
			TERMINALS_MAC,
			"macTerminal",
			"customMac"
		);
		this.renderPlatformSection(
			containerEl,
			"Linux",
			TERMINALS_LINUX,
			"linuxTerminal",
			"customLinux"
		);
		this.renderPlatformSection(
			containerEl,
			"Windows",
			TERMINALS_WIN,
			"winTerminal",
			"customWin"
		);

		containerEl.createEl("p", {
			text: "Use {dir} as a placeholder for the directory path in custom commands.",
			cls: "setting-item-description",
		});
	}

	private renderPlatformSection(
		container: HTMLElement,
		label: string,
		terminals: Record<string, TerminalConfig>,
		selectionKey: keyof OpenInTerminalSettings,
		customKey: keyof OpenInTerminalSettings
	) {
		container.createEl("h3", { text: label });

		new Setting(container)
			.setName("Terminal app")
			.setDesc(`Terminal to open on ${label}.`)
			.addDropdown((drop) => {
				Object.entries(terminals).forEach(([key, cfg]) => {
					drop.addOption(key, cfg.label);
				});
				drop.setValue(this.plugin.settings[selectionKey]);
				drop.onChange(async (val) => {
					(this.plugin.settings[selectionKey] as string) = val;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (this.plugin.settings[selectionKey] === "custom") {
			new Setting(container)
				.setName("Custom command")
				.setDesc(`Example: myterm --workdir={dir}`)
				.addText((text) =>
					text
						.setPlaceholder("myterm --workdir={dir}")
						.setValue(this.plugin.settings[customKey])
						.onChange(async (val) => {
							(this.plugin.settings[customKey] as string) = val;
							await this.plugin.saveSettings();
						})
				);
		}
	}
}
