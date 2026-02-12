
class MGCFieldMapper {
  constructor(root = document) {
    this.root = root;
    this.results = {};
  }

  normalize(text) {
    return text?.toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
  }

  matches(text, needle) {
    return this.normalize(text).includes(this.normalize(needle));
  }

  buildSelector(el) {
    if (!el) return null;
    if (el.id) return `#${el.id}`;
    if (el.name) return `[name="${el.name}"]`;
    if (el.getAttribute('aria-label')) {
      return `[aria-label="${el.getAttribute('aria-label')}"]`;
    }
    return el.tagName ? el.tagName.toLowerCase() : null;
  }

  findLabels() {
    return Array.from(this.root.querySelectorAll('label'));
  }

  findLabelByText(text) {
    return this.findLabels().find(label => this.matches(label.textContent, text));
  }

  findFormGroup(text) {
    const label = this.findLabelByText(text);
    return label?.closest('[role="group"], .chakra-form-control') ?? null;
  }

  labelForInput(input) {
    if (!input) return null;
    return input.closest('label') ?? this.root.querySelector(`label[for="${input.id}"]`);
  }

  isChecked(input) {
    if (!input) return false;
    if (typeof input.checked === 'boolean') return input.checked;
    return this.labelForInput(input)?.hasAttribute('data-checked') ?? false;
  }

  extractRadioChoice(container) {
    if (!container) return null;
    const label = container.querySelector('label[data-checked], [data-checked="true"] label');
    const input = label?.querySelector('input[type="radio"]') ?? container.querySelector('input[type="radio"]:checked');
    const aria = label?.querySelector('[aria-label]')?.getAttribute('aria-label');
    return {
      input,
      value: input?.value || aria || null,
      text: label?.textContent?.replace(/\s+/g, ' ').trim() || aria || null
    };
  }

  store(key, value) {
    this.results[key] = value;
    console.groupCollapsed(`[${key}]`);
    console.dir(value);
    console.groupEnd();
    return value;
  }

  mapAvailabilityZone() {
    const group = this.findFormGroup('zona de disponibilidade');
    const choice = this.extractRadioChoice(group);
    return this.store('availabilityZone', {
      value: choice?.value,
      text: choice?.text,
      selector: this.buildSelector(choice?.input)
    });
  }

  mapImage() {
    const group = this.findFormGroup('Escolha uma imagem');
    const hiddenInput = group?.querySelector('input[name="image"]');
    const selectedCard = group?.querySelector('[data-checked="true"], label[data-checked]');
    const family = selectedCard?.querySelector('.css-3inudv')?.textContent?.trim() ?? null;
    const version = selectedCard?.querySelector('[class*="singleValue"], .css-18wv2zb-singleValue')?.textContent?.trim() ?? null;
    return this.store('image', {
      value: hiddenInput?.value || version || family,
      family,
      version,
      selector: this.buildSelector(hiddenInput)
    });
  }

  findCheckboxByLabel(text) {
    return this.findLabels()
      .filter(label => label.querySelector('input[type="checkbox"]'))
      .map(label => ({ label, input: label.querySelector('input[type="checkbox"]') }))
      .find(({ label }) => this.matches(label.textContent, text))?.input ?? null;
  }

  mapGPU() {
    const checkbox = this.findCheckboxByLabel('habilitar gpu');
    return this.store('gpu', {
      checked: this.isChecked(checkbox),
      selector: this.buildSelector(checkbox)
    });
  }

  mapMemoryProfile() {
    const group = this.findFormGroup('tipo de instância');
    const tablist = group?.querySelector('[role="tablist"]');
    const tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
    const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    return this.store('memoryProfile', {
      active: active?.textContent?.trim() ?? null,
      options: tabs.map(tab => tab.textContent.trim()),
      selector: this.buildSelector(active)
    });
  }

  mapFlavor() {
    const group = this.findFormGroup('tipo de instância');
    const selectedCard = group?.querySelector('button[data-testid="flavor-card"][data-checked="true"]') ??
      group?.querySelector('label[data-checked] button[data-testid="flavor-card"]')?.closest('label[data-checked]');
    const input = selectedCard?.querySelector('input[name="type"]') ?? group?.querySelector('input[name="type"]:checked');

    // Parse each <p> individually to avoid concatenation bugs (e.g. "BV2-2-20" + "2 vCPU" = "BV2-2-202")
    const paragraphs = selectedCard
      ? Array.from(selectedCard.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean)
      : [];

    let sku = null, vcpu = null, ramGb = null, priceHour = null, priceMonth = null;

    for (const text of paragraphs) {
      if (!sku && /^[A-Z]{2}\d+-\d+-\d+$/i.test(text)) {
        sku = text.toUpperCase();
      } else if (!vcpu && /^\d{1,3}\s*vCPU$/i.test(text)) {
        vcpu = Number(text.match(/\d+/)[0]);
      } else if (!ramGb && /^\d{1,4}\s*GB/i.test(text)) {
        ramGb = Number(text.match(/\d+/)[0]);
      } else if (!priceHour && /R\$.*\/\s*hora/i.test(text)) {
        priceHour = text;
      } else if (!priceMonth && /R\$.*\/\s*m[eê]s/i.test(text)) {
        priceMonth = text;
      }
    }

    return this.store('flavor', {
      value: input?.value ?? sku ?? null,
      sku,
      vcpu,
      ramGb,
      priceHour,
      priceMonth,
      selector: this.buildSelector(input)
    });
  }

  mapDiskSize() {
    const input = this.root.querySelector('input[aria-label="Tamanho do disco local:"]');
    const valueNode = input?.closest('[class*="control"], [class*="select"]')?.querySelector('[class*="singleValue"]');
    return this.store('disk', {
      value: valueNode?.textContent?.trim() ?? input?.value ?? null,
      selector: this.buildSelector(input)
    });
  }

  mapConnectivity() {
    const checkbox = this.findCheckboxByLabel('ipv4 público');
    return this.store('connectivity', {
      publicIPv4: this.isChecked(checkbox),
      selector: this.buildSelector(checkbox)
    });
  }

  mapSSHKey() {
    // 1) "Insert new key" mode: input#key_name
    const keyNameInput = this.root.querySelector('input#key_name');
    if (keyNameInput?.value?.trim()) {
      return this.store('sshKey', {
        mode: 'new',
        keyName: keyNameInput.value.trim(),
        selector: this.buildSelector(keyNameInput)
      });
    }

    // 2) "Select existing key" mode: find the SSH section and look for react-select value
    const sshLabel = this.findLabels().find(l => this.matches(l.textContent, 'chave ssh'));
    if (sshLabel) {
      let container = sshLabel.parentElement;
      for (let i = 0; i < 6 && container; i++) {
        if (container.querySelector('[role="radiogroup"]')) break;
        container = container.parentElement;
      }

      if (container) {
        const selectValue = container.querySelector('[class*="singleValue"]');
        const name = selectValue?.textContent?.trim();
        if (name && name !== 'Selecione' && name !== 'Selecionar') {
          return this.store('sshKey', {
            mode: 'existing',
            keyName: name,
            selector: this.buildSelector(selectValue)
          });
        }

        // Fallback: native <select>
        const nativeSelect = container.querySelector('select');
        if (nativeSelect?.value?.trim()) {
          return this.store('sshKey', {
            mode: 'existing',
            keyName: nativeSelect.value.trim(),
            selector: this.buildSelector(nativeSelect)
          });
        }
      }
    }

    return this.store('sshKey', {
      mode: null,
      keyName: null,
      selector: null
    });
  }

  mapInstanceName() {
    const input = this.root.querySelector('input#name');
    return this.store('instanceName', {
      value: input?.value ?? null,
      selector: this.buildSelector(input)
    });
  }


  mapAll() {
    console.log('🔍 Iniciando mapeamento...\n');

    this.mapAvailabilityZone();
    this.mapImage();
    this.mapGPU();
    this.mapMemoryProfile();
    this.mapFlavor();
    this.mapDiskSize();
    this.mapConnectivity();
    this.mapSSHKey();
    this.mapInstanceName();
    console.log('\n📋 JSON para copiar:');
    console.log(JSON.stringify(this.results, null, 2));
    return this.results;
  }
}

const mapper = new MGCFieldMapper();
mapper.mapAll();
    
