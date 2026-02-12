# Architecture

## How It Works

### 1. Page Detection

The extension's content script runs on `https://console.magalu.cloud/*` and detects when the user navigates to the VM creation page (`/virtual-machine/create`). Since the console is a Next.js SPA, URL changes are monitored via `MutationObserver` and `popstate` events.

### 2. Data Capture

A `MutationObserver` watches for DOM mutations and periodically captures form field values:

| Field | Capture Strategy |
|---|---|
| **Instance Name** | `input#name` |
| **Image** | Hidden `input[name="image"]` from the selected card (`data-checked="true"`) |
| **Machine Type** | Flavor cards with `data-testid="flavor-card"`, individual `<p>` parsing for SKU |
| **Availability Zone** | Radio buttons within the zone section |
| **Connectivity** | Checkbox for public IPv4 |
| **SSH Key** | `input#key_name` (new key mode) or react-select dropdown (existing key mode) |
| **Disk Size** | Dropdown in the flavor section |
| **GPU** | Checkbox toggle |

### 3. Mapping

The image catalog in `src/mappings.js` maps UI display names to API-compatible provider names. This data is synced from the real API via `mgc virtual-machine images list`:

```
"Ubuntu 24.04 LTS" → "cloud-ubuntu-24.04 LTS"
"Debian 13 LTS"    → "cloud-debian-13 LTS"
"Rocky Linux 9"    → "cloud-rocky-09"
```

### 4. Code Generation

`src/generators.js` takes the captured data and produces:

- **CLI**: `mgc virtual-machine instances create` with `--flag=value` syntax
- **Terraform**: `mgc_virtual_machine_instances` resource block using the [MagaluCloud/mgc](https://registry.terraform.io/providers/MagaluCloud/mgc/latest) provider

Both generators include syntax highlighting via regex-based HTML spans with a placeholder strategy to avoid nested tag corruption.

## Project Structure

```
mgc-equivalent-code-extension/
├── manifest.json              # Chrome Extension manifest (Manifest V3)
├── src/
│   ├── content.js            # Main content script — DOM capture, sidebar UI
│   ├── generators.js         # CLI and Terraform code generators
│   └── mappings.js           # Image catalog (UI name → API provider name)
├── styles/
│   └── sidebar.css           # Sidebar styles (Magalu Cloud brand)
├── tools/
│   └── mgcfieldmapper.js     # Debug tool for DOM field inspection
├── docs/                     # Technical documentation
└── tests/                    # Saved HTML snapshots for development
```

## Key Design Decisions

- **No frameworks**: Pure vanilla JS to keep the extension lightweight and dependency-free.
- **MutationObserver over polling**: Reacts to DOM changes instead of interval-based polling for better performance.
- **Placeholder-based highlighting**: Strings are extracted to `\x00S{n}\x00` placeholders before applying regex highlighting rules, preventing nested HTML corruption.
- **Modular files**: Mappings, generators, and content script are separate files loaded in sequence via `manifest.json` to keep concerns separated.
