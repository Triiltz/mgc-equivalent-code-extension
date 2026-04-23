# **Not working due to current MGC VM creation page update*

# MGC Equivalent Code

> Generate equivalent CLI and Terraform code directly from the [Magalu Cloud](https://console.magalu.cloud) console — inspired by Google Cloud's "Equivalent Code" feature.

A Chrome extension that observes the VM creation form on the Magalu Cloud console and generates ready-to-use infrastructure code in real time.

![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![License](https://img.shields.io/badge/License-MIT-blue)

## Quick Start

### Install

```bash
git clone https://github.com/Triiltz/mgc-equivalent-code-extension.git
cd mgc-equivalent-code-extension
```

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project folder

### Use

1. Go to [Magalu Cloud Console](https://console.magalu.cloud) → **Virtual Machines** → **Create instance (Criar instância)**
2. A **`</> Equivalent Code`** button appears in the top-right corner
3. Click it to open the sidebar — code updates as you fill the form
4. Switch between **CLI** and **Terraform** tabs
5. Click **Copy Code** to copy to clipboard

## Output Examples

**CLI**

```bash
mgc virtual-machine instances create \
  --name="my-vm" \
  --image.name="cloud-ubuntu-24.04 LTS" \
  --machine-type.name="BV4-8-100" \
  --availability-zone="br-se1-a" \
  --network.associate-public-ip=true \
  --ssh-key-name="my-key"
```

**Terraform**

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

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | How the extension works, project structure, design decisions |
| [Debugging](docs/debugging.md) | Console logs, common issues, field mapper tool |
| [Roadmap](docs/roadmap.md) | Planned features and improvements |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

---

Built for [Magalu Cloud](https://magalu.cloud).
