/**
 * Main Content Script
 * Captures VM form data and injects a sidebar with equivalent code
 */

class MGCEquivalentCode {
  constructor() {
    this.sidebar = null;
    this.currentTab = 'cli';
    this.isCollapsed = false; // Collapse state
    this.formData = this.createEmptyFormData();
    this.observer = null;
    
    console.log('[MGC Extension] Inicializando...');
    console.log('[MGC Extension] URL:', window.location.href);
    console.log('[MGC Extension] DOM Ready:', document.readyState);
    
    this.init();
  }

  /**
   * Initializes the extension
   */
  init() {
    // Check if we are on the VM creation page
    if (this.isCreateVMPage()) {
      console.log('[MGC Extension] VM creation page detected');
      this.injectSidebar();
      this.startObserving();
      this.attachEventListeners();
      this.updateFormData();
    } else {
      console.log('[MGC Extension] Waiting for navigation to VM creation page');
      // Watch for URL changes (SPA)
      this.observeUrlChanges();
    }
  }

  /**
   * Checks if we are on the VM creation page
   * @returns {boolean}
   */
  isCreateVMPage() {
    // Detect by URL and page elements
    const url = window.location.href;
    console.log('[MGC Extension] Current URL:', url);
    
    const isVMUrl = url.includes('virtual-machine') || 
                    url.includes('vm') || 
                    url.includes('compute') ||
                    url.includes('instancia'); // Portuguese word in Magalu Cloud console URL
    
    console.log('[MGC Extension] URL contains VM?', isVMUrl);
    
    // Also check for typical VM form elements
    const hasDataChecked = !!document.querySelector('[data-checked]');
    const hasNameInput = !!document.querySelector('input[placeholder*="nome" i]');
    const hasNameAttr = !!document.querySelector('input[name*="name" i]');
    const hasTextInput = !!document.querySelector('input[type="text"]');
    
    console.log('[MGC Extension] Elementos encontrados:', {
      hasDataChecked,
      hasNameInput,
      hasNameAttr,
      hasTextInput
    });
    
    const hasVMForm = hasDataChecked || hasNameInput || hasNameAttr;
    
    const result = isVMUrl || hasVMForm;
    console.log('[MGC Extension] É página de VM?', result);
    
    return result;
  }

  /**
   * Watches for URL changes in SPAs
   */
  observeUrlChanges() {
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[MGC Extension] URL changed:', currentUrl);
        
        if (this.isCreateVMPage() && !this.sidebar) {
          console.log('[MGC Extension] Entering VM creation page');
          this.init();
        } else if (!this.isCreateVMPage() && this.sidebar) {
          console.log('[MGC Extension] Leaving VM creation page');
          this.removeSidebar();
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Injects the sidebar into the page
   */
  injectSidebar() {
    if (this.sidebar) {
      console.log('[MGC Extension] Sidebar already exists');
      return;
    }

    console.log('[MGC Extension] Injecting sidebar');

    this.sidebar = document.createElement('div');
    this.sidebar.id = 'mgc-equivalent-code-sidebar';
    this.sidebar.innerHTML = `
      <button id="mgc-toggle-btn" class="mgc-toggle-button" title="Minimizar/Expandir">
        <span class="mgc-toggle-icon">&lt;/&gt;</span>
        <span class="mgc-toggle-label">Equivalent Code</span>
      </button>
      
      <div class="mgc-sidebar-main">
        <div class="mgc-sidebar-header">
          <div class="mgc-brand">
            <h2>Equivalent Code</h2>
          </div>
          <div class="mgc-tabs">
            <button class="mgc-tab active" data-tab="cli">CLI</button>
            <button class="mgc-tab" data-tab="terraform">Terraform</button>
          </div>
        </div>
        
        <div class="mgc-sidebar-content">
          <div id="mgc-billing-info" class="mgc-billing-info" style="display: none;"></div>
          <div class="mgc-code-container">
            <pre><code id="mgc-code-output">// Loading...</code></pre>
          </div>
        </div>
        
        <div class="mgc-sidebar-footer">
          <button id="mgc-copy-btn" class="mgc-copy-button">
            Copy Code
          </button>
          <div id="mgc-copy-feedback" class="mgc-copy-feedback"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
    console.log('[MGC Extension] Sidebar injected successfully');

    // Event listeners for tabs and copy button
    this.setupSidebarListeners();
  }

  /**
   * Removes the sidebar
   */
  removeSidebar() {
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
      console.log('[MGC Extension] Sidebar removed');
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Sets up sidebar event listeners
   */
  setupSidebarListeners() {
    // Tabs
    const tabs = this.sidebar.querySelectorAll('.mgc-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Copy button
    const copyBtn = this.sidebar.querySelector('#mgc-copy-btn');
    copyBtn.addEventListener('click', () => this.copyCode());
    
    // Toggle button (collapse/expand)
    const toggleBtn = this.sidebar.querySelector('#mgc-toggle-btn');
    toggleBtn.addEventListener('click', () => this.toggleSidebar());
  }

  /**
   * Switches between tabs
   * @param {string} tabName - Tab name (cli or terraform)
   */
  switchTab(tabName) {
    console.log('[MGC Extension] Switching to tab:', tabName);
    
    this.currentTab = tabName;
    
    // Update tab UI
    const tabs = this.sidebar.querySelectorAll('.mgc-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update code
    this.updateCodeDisplay();
  }

  /**
   * Copies the code to the clipboard
   */
  async copyCode() {
    const codeElement = this.sidebar.querySelector('#mgc-code-output');
    const code = codeElement.textContent;
    
    try {
      await navigator.clipboard.writeText(code);
      this.showCopyFeedback('✓ Copied!');
      console.log('[MGC Extension] Code copied');
    } catch (err) {
      console.error('[MGC Extension] Copy error:', err);
      this.showCopyFeedback('✗ Copy failed');
    }
  }

  /**
   * Toggles the sidebar between expanded and collapsed
   */
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      this.sidebar.classList.add('collapsed');
      console.log('[MGC Extension] Sidebar collapsed');
    } else {
      this.sidebar.classList.remove('collapsed');
      console.log('[MGC Extension] Sidebar expanded');
    }
    
    // Update button icon
    const toggleIcon = this.sidebar.querySelector('.mgc-toggle-icon');
    toggleIcon.textContent = this.isCollapsed ? '</>' : '✕';
  }

  /**
   * Creates the base form data object
   */
  createEmptyFormData() {
    return {
      instanceName: '',
      availabilityZone: null,
      memoryProfile: null,
      flavor: null,
      disk: null,
      connectivity: null,
      gpuEnabled: false,
      image: null,
      sshKeyName: null
    };
  }

  /**
   * Shows copy feedback message
   * @param {string} message - Feedback message
   */
  showCopyFeedback(message) {
    const feedback = this.sidebar.querySelector('#mgc-copy-feedback');
    feedback.textContent = message;
    feedback.classList.add('show');
    
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 2000);
  }

  /**
   * Starts observing the form
   */
  startObserving() {
    console.log('[MGC Extension] Starting DOM observation');

    // Set up MutationObserver
    this.observer = new MutationObserver((mutations) => {
      // Debounce: update only after 300ms of inactivity
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.updateFormData();
      }, 300);
    });

    // Observe the entire body
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-checked', 'value']
    });
  }

  /**
   * Attaches form event listeners
   */
  attachEventListeners() {
    // Listener for text inputs (instance name)
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[type="text"]')) {
        console.log('[MGC Extension] Input detected:', e.target.name, e.target.value);
        this.updateFormData();
      }
    });

    // Listener for clicks (image selection)
    document.addEventListener('click', (e) => {
      // Detect clicks on selection elements
      setTimeout(() => this.updateFormData(), 100);
    });
  }

  /**
   * Updates the captured form data
   */
  updateFormData() {
    console.log('[MGC Extension] ===== Starting data capture =====');

    const instanceName = this.captureInstanceName();
    const availabilityZone = this.captureAvailabilityZone();
    const memoryProfile = this.captureMemoryProfile();
    const flavor = this.captureFlavor();
    const disk = this.captureDiskSize();
    const connectivity = this.captureConnectivity();
    const gpuEnabled = this.captureGpuState();
    const image = this.captureSelectedImage();
    const sshKeyName = this.captureSSHKeyName();

    const nextData = {
      instanceName,
      availabilityZone,
      memoryProfile,
      flavor,
      disk,
      connectivity,
      gpuEnabled,
      image,
      sshKeyName
    };

    console.log('[MGC Extension] Captured data:', nextData);

    const changed = JSON.stringify(this.formData) !== JSON.stringify(nextData);

    if (changed) {
      this.formData = nextData;
      console.log('[MGC Extension] ✓ State updated with new data');
      this.updateCodeDisplay();
    } else {
      console.log('[MGC Extension] Data unchanged, skipping update');
    }
    
    console.log('[MGC Extension] ===== End of capture =====');
  }

  /**
   * Captures the instance name from the form
   * @returns {string}
   */
  captureInstanceName() {
    // Look for input#name first (most specific)
    const nameInput = document.querySelector('input#name');
    if (nameInput?.value && nameInput.value.length > 0) {
      const value = nameInput.value.trim();
      console.log('[MGC Extension] Name captured via input#name:', value);
      return value;
    }

    // Fallback: try other selectors
    const selectors = [
      'input[name="name"]',
      'input[placeholder*="nome" i]',
      'input[placeholder*="instance" i]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && input.value && input.value.length > 0) {
        const value = input.value.trim();
        console.log('[MGC Extension] Name captured via', selector, ':', value);
        return value;
      }
    }

    console.log('[MGC Extension] Instance name not found');
    return '';
  }

  /**
   * Captures the selected availability zone
   * @returns {{label: string, value: string}|null}
   */
  captureAvailabilityZone() {
    const section = this.findSectionByLabel('zona de disponibilidade');
    if (!section) {
      console.log('[MGC Extension] Zone section not found');
      return null;
    }

    // Procurar label com data-checked ou input radio marcado
    const checkedLabel = section.querySelector('label[data-checked], [data-checked="true"] label');
    const input = checkedLabel?.querySelector('input[type="radio"]') || section.querySelector('input[type="radio"]:checked');
    const ariaLabel = checkedLabel?.querySelector('[aria-label]')?.getAttribute('aria-label');
    
    const text = this.extractText(checkedLabel) || ariaLabel || input?.value || null;
    const value = input?.value || text;

    if (!text && !value) {
      console.log('[MGC Extension] Zone: no option selected');
      return null;
    }

    console.log('[MGC Extension] Zone captured:', { label: text, value });
    return { label: text, value };
  }

  /**
   * Captures the memory profile (active tab)
   * @returns {{label: string, options: string[]}|null}
   */
  captureMemoryProfile() {
    const section = this.findSectionByLabel('tipo de instância');
    if (!section) {
      console.log('[MGC Extension] Instance type section not found');
      return null;
    }

    const tablist = section.querySelector('[role="tablist"]');
    const activeTab = tablist?.querySelector('[role="tab"][aria-selected="true"]');
    
    if (!activeTab) {
      console.log('[MGC Extension] Memory profile: no active tab');
      return null;
    }

    const label = this.extractText(activeTab);
    console.log('[MGC Extension] Memory profile captured:', label);
    
    return { label };
  }

  /**
   * Captures the selected flavor
   * @returns {{label: string, value: string|null, sku?: string|null, vcpu?: number|null, ramGb?: number|null, priceHour?: string|null, priceMonth?: string|null}|null}
   */
  captureFlavor() {
    const section = this.findSectionByLabel('tipo de instância');
    if (!section) {
      console.log('[MGC Extension] Instance type section not found for flavor');
      return null;
    }

    // Procurar card selecionado
    const selectedCard = section.querySelector('button[data-testid="flavor-card"][data-checked="true"]') ||
      section.querySelector('label[data-checked] button[data-testid="flavor-card"]')?.closest('label[data-checked]');
    
    const input = selectedCard?.querySelector('input[name="type"]') || 
      section.querySelector('input[name="type"]:checked');
    
    if (!selectedCard && !input?.value) {
      console.log('[MGC Extension] Flavor: none selected');
      return null;
    }

    // Read each field separately from card <p> elements to avoid concatenation
    // Structure: <p>BV4-8-100</p> <p>4 vCPU</p> <p>8 GB RAM</p> <p>R$.../hour</p> <p>R$.../month</p>
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

    const result = {
      label: paragraphs.join(' | '),
      value: input?.value || sku || null,
      sku,
      vcpu,
      ramGb,
      priceHour,
      priceMonth
    };
    
    console.log('[MGC Extension] Flavor captured:', result);
    return result;
  }

  /**
   * Captures the selected disk size
   * @returns {{label: string, sizeGb: number|null}|null}
   */
  captureDiskSize() {
    const input = document.querySelector('input[aria-label="Tamanho do disco local:"]');
    const valueNode = input?.closest('[class*="control"]')?.querySelector('[class*="singleValue"]');
    
    const label = this.extractText(valueNode) || input?.value;
    
    if (!label) {
      console.log('[MGC Extension] Disk: value not found');
      return null;
    }

    const numericMatch = label.match(/(\d+)/);
    const sizeGb = numericMatch ? Number(numericMatch[1]) : null;

    console.log('[MGC Extension] Disk captured:', { label, sizeGb });
    return { label, sizeGb };
  }

  /**
   * Captures connectivity preferences (public IPv4)
   * @returns {{publicIPv4: boolean}|null}
   */
  captureConnectivity() {
    const checkbox = this.findCheckboxByLabel('ipv4 público');
    if (!checkbox) {
      console.log('[MGC Extension] Connectivity: checkbox not found');
      return null;
    }

    const result = { publicIPv4: this.isElementChecked(checkbox) };
    console.log('[MGC Extension] Connectivity captured:', result);
    return result;
  }

  /**
   * Captures the GPU toggle state
   * @returns {boolean}
   */
  captureGpuState() {
    const checkbox = this.findCheckboxByLabel('habilitar gpu');
    const state = checkbox ? this.isElementChecked(checkbox) : false;
    console.log('[MGC Extension] GPU captured:', state);
    return state;
  }

  /**
   * Captures the selected image
   * @returns {object|null}
   */
  captureSelectedImage() {
    const section = this.findSectionByLabel('escolha uma imagem');

    // Approach 1 (most reliable): find the selected card and read its input[name="image"]
    // Each image card has its own hidden input. Unselected ones have value="".
    // We specifically need the one from the card with data-checked="true".
    const selectedCard = section?.querySelector('[data-checked="true"]')
      || section?.querySelector('label[data-checked]');
    
    if (selectedCard) {
      // O input hidden com o providerName exato (ex: "cloud-ubuntu-24.04 LTS")
      const hiddenInput = selectedCard.querySelector('input[name="image"]');
      
      if (hiddenInput?.value) {
        const providerName = hiddenInput.value.trim();
        console.log('[MGC Extension] Imagem via input[name=image]:', providerName);

        // Lookup metadata by providerName
        if (window.MGC_MAPPINGS?.getImageMetadata) {
          const metadata = window.MGC_MAPPINGS.getImageMetadata(providerName);
          if (metadata) {
            console.log('[MGC Extension] Image captured (with metadata):', metadata.displayName);
            return { ...metadata, sourceLabel: providerName, apiValue: metadata.name };
          }
        }

        // Use providerName directly (valid for the API)
        return {
          displayName: providerName,
          name: providerName,
          id: null,
          sourceLabel: providerName,
          apiValue: providerName
        };
      }
    }

    // Approach 2 (global fallback): any input[name="image"] with a value
    const allImageInputs = (section || document).querySelectorAll('input[name="image"]');
    for (const inp of allImageInputs) {
      if (inp.value) {
        const providerName = inp.value.trim();
        console.log('[MGC Extension] Imagem via fallback input:', providerName);
        if (window.MGC_MAPPINGS?.getImageMetadata) {
          const metadata = window.MGC_MAPPINGS.getImageMetadata(providerName);
          if (metadata) return { ...metadata, sourceLabel: providerName, apiValue: metadata.name };
        }
        return { displayName: providerName, name: providerName, id: null, sourceLabel: providerName, apiValue: providerName };
      }
    }

    // Approach 3: read the version displayed in the selected card's dropdown
    if (selectedCard) {
      const versionNode = selectedCard.querySelector('[class*="singleValue"]');
      const version = versionNode?.textContent?.trim() || null;
      
      if (version && window.MGC_MAPPINGS?.getImageMetadata) {
        const metadata = window.MGC_MAPPINGS.getImageMetadata(version);
        if (metadata) {
          console.log('[MGC Extension] Imagem via dropdown version:', version);
          return { ...metadata, sourceLabel: version, apiValue: metadata.name };
        }
      }
    }

    console.log('[MGC Extension] Image: no image detected');
    return null;
  }

  /**
   * Captures the selected SSH key name
   * @returns {string|null}
   */
  captureSSHKeyName() {
    // 1) "Insert new key" mode: input#key_name (present when the "insert" radio is active)
    const keyNameInput = document.querySelector('input#key_name');
    if (keyNameInput?.value?.trim()) {
      console.log('[MGC Extension] SSH key captured (input#key_name):', keyNameInput.value);
      return keyNameInput.value.trim();
    }

    // 2) "Select existing key" mode: find the container of the entire SSH section.
    //    The "Chave SSH*" label is inside a <div class="chakra-stack"> which is a child
    //    of the section container. We walk up the DOM to find the container that also
    //    contains the radiogroup (i.e. the complete SSH section).
    const allLabels = Array.from(document.querySelectorAll('label'));
    const sshLabel = allLabels.find(l => {
      const text = this.normalizeText(l.textContent);
      return text.includes('chave ssh');
    });

    if (sshLabel) {
      // Walk up the DOM until finding a container that holds the radiogroup
      let container = sshLabel.parentElement;
      for (let i = 0; i < 6 && container; i++) {
        if (container.querySelector('[role="radiogroup"]')) break;
        container = container.parentElement;
      }

      if (container) {
        // React-select com nome da chave existente selecionada
        const selectValue = container.querySelector('[class*="singleValue"]');
        if (selectValue?.textContent?.trim()) {
          const name = selectValue.textContent.trim();
          if (name !== 'Selecione' && name !== 'Selecionar' && name.length > 0) {
            console.log('[MGC Extension] SSH key captured (dropdown):', name);
            return name;
          }
        }

        // Fallback: native <select> inside the SSH section
        const nativeSelect = container.querySelector('select');
        if (nativeSelect?.value?.trim()) {
          console.log('[MGC Extension] SSH key captured (native select):', nativeSelect.value);
          return nativeSelect.value.trim();
        }
      }
    }

    console.log('[MGC Extension] SSH key: no key selected');
    return null;
  }

  /**
   * Extracts normalized text from a node
   * @param {Element|null} node
   * @returns {string}
   */
  extractText(node) {
    if (!node) return '';
    const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text;
  }

  /**
   * Normalizes text for comparisons
   * @param {string} value
   * @returns {string}
   */
  normalizeText(value) {
    if (!value) return '';
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Locates a section/form-group by label text
   * @param {string} labelText
   * @returns {Element|null}
   */
  findSectionByLabel(labelText) {
    const target = this.normalizeText(labelText);
    if (!target) return null;

    // Search all labels first
    const allLabels = Array.from(document.querySelectorAll('label'));
    let matchLabel = allLabels.find((label) => this.normalizeText(label.textContent).includes(target));
    
    if (matchLabel) {
      const container = matchLabel.closest('[role="group"]') || 
        matchLabel.closest('.chakra-form-control') ||
        matchLabel.closest('fieldset') ||
        matchLabel.parentElement;
      console.log('[MGC Extension] Section found via label for:', labelText);
      return container;
    }

    // Fallback: search in headers and other elements
    const candidates = Array.from(document.querySelectorAll('h2, h3, h4, legend, p, span, strong'));
    const match = candidates.find((el) => this.normalizeText(el.textContent).includes(target));

    if (!match) {
      console.log('[MGC Extension] Section NOT found for:', labelText);
      return null;
    }

    const container = match.closest('[role="group"], section, fieldset, form, .chakra-form-control') || match.parentElement;
    console.log('[MGC Extension] Section found via element for:', labelText);
    return container;
  }

  /**
   * Finds the label associated with an input
   * @param {Element} input
   * @returns {Element|null}
   */
  findLabelForInput(input) {
    if (!input) return null;
    if (input.closest('label')) return input.closest('label');
    if (input.id) {
      return document.querySelector(`label[for="${input.id}"]`);
    }
    return null;
  }

  /**
   * Locates a checkbox by its label text
   * @param {string} labelText
   * @returns {HTMLInputElement|null}
   */
  findCheckboxByLabel(labelText) {
    const target = this.normalizeText(labelText);
    if (!target) return null;

    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find((el) => this.normalizeText(el.textContent).includes(target));
    if (label && label.querySelector('input[type="checkbox"]')) {
      return label.querySelector('input[type="checkbox"]');
    }

    const ariaInputs = Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'));
    const ariaMatch = ariaInputs.find((input) => this.normalizeText(input.getAttribute('aria-label')).includes(target));
    if (ariaMatch) return ariaMatch;

    return null;
  }

  /**
   * Checks the state of a checkbox/input
   * @param {HTMLInputElement} input
   * @returns {boolean}
   */
  isElementChecked(input) {
    if (!input) return false;
    if (typeof input.checked === 'boolean') return input.checked;
    const label = this.findLabelForInput(input) || input.closest('label');
    return label?.getAttribute('data-checked') === 'true';
  }

  /**
   * Extracts numeric flavor details
   * @param {string} text
   * @returns {{sku: string|null, vcpu: number|null, ramGb: number|null, priceHour: string|null, priceMonth: string|null}}
   */
  parseFlavorDetails(text) {
    if (!text) {
      return { sku: null, vcpu: null, ramGb: null, priceHour: null, priceMonth: null };
    }

    // SKU format: XX{digits}-{digits}-{digits} (e.g. BV4-8-100, BV1-1-40)
    // Use word boundary \b to avoid grabbing concatenated text like "BV4-8-1004 vCPU"
    const skuMatch = text.match(/\b([A-Z]{2}\d+-\d+-\d+)\b/i);
    
    // vCPU: match digit(s) immediately before "vCPU" with possible space
    const vcpuMatch = text.match(/\b(\d{1,3})\s*vCPU/i);
    
    // RAM: match digit(s) immediately before "GB" 
    const ramMatch = text.match(/\b(\d{1,4})\s*GB/i);
    
    const priceHourMatch = text.match(/R\$\s*[\d.,]+\s*\/\s*hora/i);
    const priceMonthMatch = text.match(/R\$\s*[\d.,]+\s*\/\s*m[eê]s/i);

    return {
      sku: skuMatch ? skuMatch[1].toUpperCase() : null,
      vcpu: vcpuMatch ? Number(vcpuMatch[1]) : null,
      ramGb: ramMatch ? Number(ramMatch[1]) : null,
      priceHour: priceHourMatch ? priceHourMatch[0].replace(/\s+/g, ' ') : null,
      priceMonth: priceMonthMatch ? priceMonthMatch[0].replace(/\s+/g, ' ') : null
    };
  }

  /**
   * Updates the code display
   */
  updateCodeDisplay() {
    if (!this.sidebar) return;

    console.log('[MGC Extension] Updating code display');

    const codeElement = this.sidebar.querySelector('#mgc-code-output');
    const billingElement = this.sidebar.querySelector('#mgc-billing-info');
    
    // Prepare data for generation
    const data = { ...this.formData };

    // Generate code based on the active tab
    let result = null;
    
    if (window.MGC_GENERATORS) {
      if (this.currentTab === 'cli') {
        result = window.MGC_GENERATORS.generateCLI(data);
      } else if (this.currentTab === 'terraform') {
        result = window.MGC_GENERATORS.generateTerraform(data);
      }
    } else {
      console.error('[MGC Extension] MGC_GENERATORS not available');
      codeElement.textContent = '// Error: generators not loaded';
      return;
    }

    // Update code with syntax highlighting
    if (window.MGC_GENERATORS?.formatCodeWithHighlight) {
      codeElement.innerHTML = window.MGC_GENERATORS.formatCodeWithHighlight(
        result.code, this.currentTab
      );
    } else {
      codeElement.textContent = result.code;
    }
    
    // Show billing info if available
    if (billingElement && result.billing) {
      billingElement.textContent = result.billing;
      billingElement.style.display = 'block';
    } else if (billingElement) {
      billingElement.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MGCEquivalentCode();
  });
} else {
  new MGCEquivalentCode();
}

console.log('[MGC Extension] Content script loaded');
