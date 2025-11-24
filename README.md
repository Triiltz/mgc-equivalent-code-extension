# MGC Equivalent Code Extension

Chrome extension that generates equivalent CLI and Terraform code from Magalu Cloud console.

## 📋 MVP Features

- ✅ Automatic capture of VM creation form fields:
  - Instance name
  - Selected image (Ubuntu, Debian, Rocky, Oracle Linux)
- ✅ Side panel with CLI and Terraform tabs
- ✅ Real-time code generation
- ✅ Copy code button
- ✅ Automatic UI → API value mapping

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
- **Name**: Inputs with `name`, `placeholder`, or `id` containing "name"/"nome"
- **Image**: Elements with `[data-checked="true"]`

### 3. Mapping

Converts user-friendly UI names to API values:

```javascript
"Ubuntu 22.04 LTS" → "ubuntu-22.04-lts"
"Debian 13 LTS" → "debian-13-lts"
```

### 4. Code Generation

#### CLI
```bash
mgc virtual-machines create \
  --name "my-vm" \
  --image "ubuntu-22.04-lts"
```

#### Terraform
```hcl
resource "mgc_virtual_machine" "my_vm" {
  name  = "my-vm"
  image = "ubuntu-22.04-lts"
}
```

## 🎨 Interface

- **Sidebar**: Fixed position on the right, 500px width
- **Theme**: VS Code Dark (#1e1e1e)
- **Tabs**: CLI and Terraform
- **Syntax Highlighting**: Basic highlighting for comments, keywords, strings
- **Copy Button**: Visual feedback on copy

## 🐛 Debug

Open Chrome Console (F12) to see logs:

```
[MGC Extension] Inicializando...
[MGC Extension] Página de criar VM detectada
[MGC Extension] Sidebar injetada com sucesso
[MGC Extension] Nome capturado: minha-vm
[MGC Extension] Imagem capturada: Ubuntu 22.04 LTS
[MGC Extension] Imagem mapeada: Ubuntu 22.04 LTS -> ubuntu-22.04-lts
```

## 📝 Future Features (Post-MVP)

- [ ] Capture more fields (machine type, region, disk, network)
- [ ] Add more code options (Python SDK, Go SDK)
- [ ] Export code to file
- [ ] Generated code validation
- [ ] Light/dark theme toggle
- [ ] Custom icons
- [ ] Extension settings

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
