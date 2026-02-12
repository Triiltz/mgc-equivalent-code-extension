# MGC Equivalent Code Extension

Chrome extension that generates equivalent CLI and Terraform code from Magalu Cloud console.

## 📋 Features

- ✅ Automatic capture of VM creation form fields:
  - Instance name
  - Selected image (Ubuntu, Debian, Rocky, Oracle Linux, Fedora, openSUSE, Windows)
  - Machine type / Flavor (SKU)
  - Availability zone
  - Public IPv4 toggle
  - SSH key name
  - Disk size, memory profile, GPU toggle
- ✅ Side panel with CLI and Terraform tabs
- ✅ Real-time code generation (updates as you fill the form)
- ✅ Copy code button with visual feedback
- ✅ Syntax highlighting (comments, flags, strings, keywords)
- ✅ Image catalog with 14 images synced from the real API (`mgc virtual-machine images list`)
- ✅ Collapsible sidebar

## 🚀 Installation

### 1. Download/Clone

```bash
git clone <your-repo>
cd mgc-equivalent-code-extension
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right corner)
3. Click **Load unpacked**
4. Select the `mgc-equivalent-code-extension` folder

### 3. Test

1. Navigate to `https://console.magalu.cloud/`
2. Go to the VM creation page
3. The sidebar will appear automatically on the right
4. Fill in the form fields and watch the code being generated

## 📁 Project Structure

```
mgc-equivalent-code-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── src/
│   ├── content.js            # Main script - capture and UI
│   ├── generators.js         # CLI and Terraform code generators
│   └── mappings.js           # UI → API mapping
├── styles/
│   └── sidebar.css           # Sidebar styles (VS Code theme)
├── icons/
│   ├── icon16.txt           # Placeholder 16x16
│   ├── icon48.txt           # Placeholder 48x48
│   └── icon128.txt          # Placeholder 128x128
└── README.md
```

## 🔧 How It Works

### 1. Page Detection

The content script detects when you're on the Magalu Cloud console VM creation page.

### 2. Data Capture

Uses `MutationObserver` to monitor DOM changes and captures:
- **Name**: Input `#name`
- **Image**: Hidden `input[name="image"]` (provider name) + selected card fallback
- **Machine Type**: Flavor cards with `data-testid="flavor-card"` + `input[name="type"]`
- **Availability Zone**: Radio buttons in the zone section
- **Connectivity**: Checkbox for public IPv4
- **SSH Key**: Input `#key_name` or select dropdown in SSH section

### 3. Mapping

Converts UI display names to API provider names using a catalog synced with `mgc virtual-machine images list`:

```javascript
"Ubuntu 24.04 LTS" → "cloud-ubuntu-24.04 LTS"
"Debian 13 LTS"    → "cloud-debian-13 LTS"
"Rocky Linux 9"    → "cloud-rocky-09"
```

### 4. Code Generation

#### CLI
```bash
mgc virtual-machine instances create \
  --name "my-vm" \
  --image.name "cloud-ubuntu-24.04 LTS" \
  --machine-type.name "BV4-8-100" \
  --availability-zone "br-se1-a" \
  --network.associate-public-ip true \
  --ssh-key-name "my-key"
```

#### Terraform
```hcl
resource "mgc_virtual_machine_instances" "my_vm" {
  name                 = "my-vm"
  machine_type         = "BV4-8-100"
  image                = "cloud-ubuntu-24.04 LTS"
  availability_zone    = "br-se1-a"
  ssh_key_name         = "my-key"
  allocate_public_ipv4 = true
}
```

## 🎨 Interface

- **Sidebar**: Fixed position on the right, 550px width
- **Theme**: Magalu Cloud brand colors (#6B4FFF)
- **Tabs**: CLI and Terraform
- **Syntax Highlighting**: Basic highlighting for comments, keywords, strings
- **Copy Button**: Visual feedback on copy

## 🐛 Debug

Open Chrome Console (F12) to see logs:

```
[MGC Extension] Inicializando...
[MGC Extension] Página de criar VM detectada
[MGC Extension] Sidebar injetada com sucesso
[MGC Extension] Nome capturado via input#name: minha-vm
[MGC Extension] Imagem via input[name=image]: cloud-ubuntu-24.04 LTS
[MGC Extension] Flavor capturado: {sku: 'BV4-8-100', vcpu: 4, ramGb: 8}
[MGC Extension] SSH key capturada: my-key
```

## 📝 Future Features

- [ ] Add more code options (Python SDK, Go SDK, REST API)
- [ ] Export code to file
- [ ] Generated code validation against `mgc` CLI
- [ ] Support more resource types (Block Storage, Kubernetes, Database)
- [ ] Light/dark theme toggle
- [ ] Custom icons (replace .txt placeholders)
- [ ] Extension popup/settings page
- [ ] Terraform provider block generation

## 🔒 Permissions

- `activeTab`: To interact with the active tab
- `https://console.magalu.cloud/*`: Access to Magalu Cloud console

## 💡 Usage Tips

1. **Real-time Updates**: Code is automatically updated as you fill in the form
2. **Switch Tabs**: Click CLI or Terraform to see the corresponding code
3. **Copy Code**: Use the "📋 Copy Code" button to copy to clipboard
4. **Visual Feedback**: A "✓ Copied!" message appears after successfully copying

## 🛠️ Technologies

- **Vanilla JavaScript** (ES6+)
- **Chrome Extensions API** (Manifest V3)
- **CSS3** (no frameworks)
- **MutationObserver API**
- **Clipboard API**

## 📄 License

MIT License - See LICENSE file

---

**Desenvolvido para Magalu Cloud**
