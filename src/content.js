/**
 * Content Script Principal
 * Captura dados do formulário de VM e injeta sidebar com código equivalente
 */

class MGCEquivalentCode {
  constructor() {
    this.sidebar = null;
    this.currentTab = 'cli';
    this.isCollapsed = false; // Estado de minimização
    this.formData = this.createEmptyFormData();
    this.observer = null;
    
    console.log('[MGC Extension] Inicializando...');
    console.log('[MGC Extension] URL:', window.location.href);
    console.log('[MGC Extension] DOM Ready:', document.readyState);
    
    this.init();
  }

  /**
   * Inicializa a extensão
   */
  init() {
    // Verificar se estamos na página de criar VM
    if (this.isCreateVMPage()) {
      console.log('[MGC Extension] Página de criar VM detectada');
      this.injectSidebar();
      this.startObserving();
      this.attachEventListeners();
      this.updateFormData();
    } else {
      console.log('[MGC Extension] Aguardando navegação para página de criar VM');
      // Observar mudanças de URL (SPA)
      this.observeUrlChanges();
    }
  }

  /**
   * Verifica se estamos na página de criar VM
   * @returns {boolean}
   */
  isCreateVMPage() {
    // Detectar pela URL e elementos da página
    const url = window.location.href;
    console.log('[MGC Extension] URL atual:', url);
    
    const isVMUrl = url.includes('virtual-machine') || 
                    url.includes('vm') || 
                    url.includes('compute') ||
                    url.includes('instancia'); // Palavra em português
    
    console.log('[MGC Extension] URL contém VM?', isVMUrl);
    
    // Também verificar se há elementos típicos de formulário de VM
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
   * Observa mudanças de URL para SPAs
   */
  observeUrlChanges() {
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[MGC Extension] URL mudou:', currentUrl);
        
        if (this.isCreateVMPage() && !this.sidebar) {
          console.log('[MGC Extension] Entrando na página de criar VM');
          this.init();
        } else if (!this.isCreateVMPage() && this.sidebar) {
          console.log('[MGC Extension] Saindo da página de criar VM');
          this.removeSidebar();
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Injeta a sidebar na página
   */
  injectSidebar() {
    if (this.sidebar) {
      console.log('[MGC Extension] Sidebar já existe');
      return;
    }

    console.log('[MGC Extension] Injetando sidebar');

    this.sidebar = document.createElement('div');
    this.sidebar.id = 'mgc-equivalent-code-sidebar';
    this.sidebar.innerHTML = `
      <button id="mgc-toggle-btn" class="mgc-toggle-button" title="Minimizar/Expandir">
        <span class="mgc-toggle-icon">«</span>
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
            <pre><code id="mgc-code-output">// Carregando...</code></pre>
          </div>
        </div>
        
        <div class="mgc-sidebar-footer">
          <button id="mgc-copy-btn" class="mgc-copy-button">
            Copiar Código
          </button>
          <div id="mgc-copy-feedback" class="mgc-copy-feedback"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
    console.log('[MGC Extension] Sidebar injetada com sucesso');

    // Event listeners para tabs e botão copiar
    this.setupSidebarListeners();
  }

  /**
   * Remove a sidebar
   */
  removeSidebar() {
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
      console.log('[MGC Extension] Sidebar removida');
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Configura listeners da sidebar
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

    // Botão copiar
    const copyBtn = this.sidebar.querySelector('#mgc-copy-btn');
    copyBtn.addEventListener('click', () => this.copyCode());
    
    // Botão toggle (minimizar/expandir)
    const toggleBtn = this.sidebar.querySelector('#mgc-toggle-btn');
    toggleBtn.addEventListener('click', () => this.toggleSidebar());
  }

  /**
   * Alterna entre tabs
   * @param {string} tabName - Nome da tab (cli ou terraform)
   */
  switchTab(tabName) {
    console.log('[MGC Extension] Alternando para tab:', tabName);
    
    this.currentTab = tabName;
    
    // Atualizar UI das tabs
    const tabs = this.sidebar.querySelectorAll('.mgc-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Atualizar código
    this.updateCodeDisplay();
  }

  /**
   * Copia o código para área de transferência
   */
  async copyCode() {
    const codeElement = this.sidebar.querySelector('#mgc-code-output');
    const code = codeElement.textContent;
    
    try {
      await navigator.clipboard.writeText(code);
      this.showCopyFeedback('✓ Copiado!');
      console.log('[MGC Extension] Código copiado');
    } catch (err) {
      console.error('[MGC Extension] Erro ao copiar:', err);
      this.showCopyFeedback('✗ Erro ao copiar');
    }
  }

  /**
   * Alterna entre sidebar expandida e colapsada
   */
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      this.sidebar.classList.add('collapsed');
      console.log('[MGC Extension] Sidebar minimizada');
    } else {
      this.sidebar.classList.remove('collapsed');
      console.log('[MGC Extension] Sidebar expandida');
    }
    
    // Atualizar ícone do botão
    const toggleIcon = this.sidebar.querySelector('.mgc-toggle-icon');
    toggleIcon.textContent = this.isCollapsed ? '»' : '«';
  }

  /**
   * Cria objeto base de dados do formulário
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
   * Mostra feedback de cópia
   * @param {string} message - Mensagem de feedback
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
   * Inicia observação do formulário
   */
  startObserving() {
    console.log('[MGC Extension] Iniciando observação do DOM');

    // Configurar MutationObserver
    this.observer = new MutationObserver((mutations) => {
      // Debounce: atualizar apenas após 300ms de inatividade
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.updateFormData();
      }, 300);
    });

    // Observar todo o body
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-checked', 'value']
    });
  }

  /**
   * Adiciona listeners de eventos do formulário
   */
  attachEventListeners() {
    // Listener para inputs de texto (nome da instância)
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[type="text"]')) {
        console.log('[MGC Extension] Input detectado:', e.target.name, e.target.value);
        this.updateFormData();
      }
    });

    // Listener para cliques (seleção de imagem)
    document.addEventListener('click', (e) => {
      // Detectar cliques em elementos de seleção
      setTimeout(() => this.updateFormData(), 100);
    });
  }

  /**
   * Atualiza dados do formulário capturados
   */
  updateFormData() {
    console.log('[MGC Extension] ===== Iniciando captura de dados =====');

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

    console.log('[MGC Extension] Dados capturados:', nextData);

    const changed = JSON.stringify(this.formData) !== JSON.stringify(nextData);

    if (changed) {
      this.formData = nextData;
      console.log('[MGC Extension] ✓ Dados atualizados no estado');
      this.updateCodeDisplay();
    } else {
      console.log('[MGC Extension] Dados não mudaram, skip update');
    }
    
    console.log('[MGC Extension] ===== Fim da captura =====');
  }

  /**
   * Captura o nome da instância do formulário
   * @returns {string}
   */
  captureInstanceName() {
    // Procurar especificamente o input com id="name" primeiro (mais específico)
    const nameInput = document.querySelector('input#name');
    if (nameInput?.value && nameInput.value.length > 0) {
      const value = nameInput.value.trim();
      console.log('[MGC Extension] Nome capturado via input#name:', value);
      return value;
    }

    // Fallback: tentar outros seletores
    const selectors = [
      'input[name="name"]',
      'input[placeholder*="nome" i]',
      'input[placeholder*="instance" i]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && input.value && input.value.length > 0) {
        const value = input.value.trim();
        console.log('[MGC Extension] Nome capturado via', selector, ':', value);
        return value;
      }
    }

    console.log('[MGC Extension] Nome da instância não encontrado');
    return '';
  }

  /**
   * Captura a zona de disponibilidade selecionada
   * @returns {{label: string, value: string}|null}
   */
  captureAvailabilityZone() {
    const section = this.findSectionByLabel('zona de disponibilidade');
    if (!section) {
      console.log('[MGC Extension] Seção de zona não encontrada');
      return null;
    }

    // Procurar label com data-checked ou input radio marcado
    const checkedLabel = section.querySelector('label[data-checked], [data-checked="true"] label');
    const input = checkedLabel?.querySelector('input[type="radio"]') || section.querySelector('input[type="radio"]:checked');
    const ariaLabel = checkedLabel?.querySelector('[aria-label]')?.getAttribute('aria-label');
    
    const text = this.extractText(checkedLabel) || ariaLabel || input?.value || null;
    const value = input?.value || text;

    if (!text && !value) {
      console.log('[MGC Extension] Zona: nenhuma opção selecionada');
      return null;
    }

    console.log('[MGC Extension] Zona capturada:', { label: text, value });
    return { label: text, value };
  }

  /**
   * Captura o perfil de memória (aba ativa)
   * @returns {{label: string, options: string[]}|null}
   */
  captureMemoryProfile() {
    const section = this.findSectionByLabel('tipo de instância');
    if (!section) {
      console.log('[MGC Extension] Seção de tipo de instância não encontrada');
      return null;
    }

    const tablist = section.querySelector('[role="tablist"]');
    const activeTab = tablist?.querySelector('[role="tab"][aria-selected="true"]');
    
    if (!activeTab) {
      console.log('[MGC Extension] Perfil de memória: nenhuma aba ativa');
      return null;
    }

    const label = this.extractText(activeTab);
    console.log('[MGC Extension] Perfil de memória capturado:', label);
    
    return { label };
  }

  /**
   * Captura o flavor selecionado
   * @returns {{label: string, value: string|null, sku?: string|null, vcpu?: number|null, ramGb?: number|null, priceHour?: string|null, priceMonth?: string|null}|null}
   */
  captureFlavor() {
    const section = this.findSectionByLabel('tipo de instância');
    if (!section) {
      console.log('[MGC Extension] Seção de tipo de instância não encontrada para flavor');
      return null;
    }

    // Procurar card selecionado
    const selectedCard = section.querySelector('button[data-testid="flavor-card"][data-checked="true"]') ||
      section.querySelector('label[data-checked] button[data-testid="flavor-card"]')?.closest('label[data-checked]');
    
    const input = selectedCard?.querySelector('input[name="type"]') || 
      section.querySelector('input[name="type"]:checked');
    
    if (!selectedCard && !input?.value) {
      console.log('[MGC Extension] Flavor: nenhum selecionado');
      return null;
    }

    // Ler cada campo separadamente dos <p> do card para evitar concatenação
    // Estrutura: <p>BV4-8-100</p> <p>4 vCPU</p> <p>8 GB RAM</p> <p>R$ .../hora</p> <p>R$ .../mês</p>
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
    
    console.log('[MGC Extension] Flavor capturado:', result);
    return result;
  }

  /**
   * Captura o tamanho de disco selecionado
   * @returns {{label: string, sizeGb: number|null}|null}
   */
  captureDiskSize() {
    const input = document.querySelector('input[aria-label="Tamanho do disco local:"]');
    const valueNode = input?.closest('[class*="control"]')?.querySelector('[class*="singleValue"]');
    
    const label = this.extractText(valueNode) || input?.value;
    
    if (!label) {
      console.log('[MGC Extension] Disco: valor não encontrado');
      return null;
    }

    const numericMatch = label.match(/(\d+)/);
    const sizeGb = numericMatch ? Number(numericMatch[1]) : null;

    console.log('[MGC Extension] Disco capturado:', { label, sizeGb });
    return { label, sizeGb };
  }

  /**
   * Captura preferências de conectividade (IPv4 público)
   * @returns {{publicIPv4: boolean}|null}
   */
  captureConnectivity() {
    const checkbox = this.findCheckboxByLabel('ipv4 público');
    if (!checkbox) {
      console.log('[MGC Extension] Conectividade: checkbox não encontrado');
      return null;
    }

    const result = { publicIPv4: this.isElementChecked(checkbox) };
    console.log('[MGC Extension] Conectividade capturada:', result);
    return result;
  }

  /**
   * Captura estado do toggle de GPU
   * @returns {boolean}
   */
  captureGpuState() {
    const checkbox = this.findCheckboxByLabel('habilitar gpu');
    const state = checkbox ? this.isElementChecked(checkbox) : false;
    console.log('[MGC Extension] GPU capturado:', state);
    return state;
  }

  /**
   * Captura a imagem selecionada
   * @returns {object|null}
   */
  captureSelectedImage() {
    const section = this.findSectionByLabel('escolha uma imagem');

    // Abordagem 1 (mais confiável): encontrar o card selecionado e ler seu input[name="image"]
    // Cada card de imagem tem seu próprio input hidden. Os não-selecionados têm value="".
    // Precisamos pegar especificamente o do card com data-checked="true".
    const selectedCard = section?.querySelector('[data-checked="true"]')
      || section?.querySelector('label[data-checked]');
    
    if (selectedCard) {
      // O input hidden com o providerName exato (ex: "cloud-ubuntu-24.04 LTS")
      const hiddenInput = selectedCard.querySelector('input[name="image"]');
      
      if (hiddenInput?.value) {
        const providerName = hiddenInput.value.trim();
        console.log('[MGC Extension] Imagem via input[name=image]:', providerName);

        // Buscar metadata pelo providerName
        if (window.MGC_MAPPINGS?.getImageMetadata) {
          const metadata = window.MGC_MAPPINGS.getImageMetadata(providerName);
          if (metadata) {
            console.log('[MGC Extension] Imagem capturada (com metadata):', metadata.displayName);
            return { ...metadata, sourceLabel: providerName, apiValue: metadata.name };
          }
        }

        // Usar o providerName direto (válido para a API)
        return {
          displayName: providerName,
          name: providerName,
          id: null,
          sourceLabel: providerName,
          apiValue: providerName
        };
      }
    }

    // Abordagem 2 (fallback global): qualquer input[name="image"] com valor
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

    // Abordagem 3: ler a versão exibida no dropdown do card selecionado
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

    console.log('[MGC Extension] Imagem: nenhuma imagem detectada');
    return null;
  }

  /**
   * Captura o nome da chave SSH selecionada
   * @returns {string|null}
   */
  captureSSHKeyName() {
    // 1) Modo "Inserir chave nova": input#key_name (presente quando o radio "insert" está ativo)
    const keyNameInput = document.querySelector('input#key_name');
    if (keyNameInput?.value?.trim()) {
      console.log('[MGC Extension] SSH key capturada (input#key_name):', keyNameInput.value);
      return keyNameInput.value.trim();
    }

    // 2) Modo "Selecionar chave existente": encontrar o container da seção SSH inteira
    //    O label "Chave SSH*" está dentro de um <div class="chakra-stack"> que é filho
    //    do container da seção. Subimos na DOM até achar o container que também contém
    //    o radiogroup (ou seja, a seção SSH completa).
    const allLabels = Array.from(document.querySelectorAll('label'));
    const sshLabel = allLabels.find(l => {
      const text = this.normalizeText(l.textContent);
      return text.includes('chave ssh');
    });

    if (sshLabel) {
      // Subir na DOM até encontrar um container que contenha o radiogroup
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
            console.log('[MGC Extension] SSH key capturada (dropdown):', name);
            return name;
          }
        }

        // Fallback: native <select> dentro da seção SSH
        const nativeSelect = container.querySelector('select');
        if (nativeSelect?.value?.trim()) {
          console.log('[MGC Extension] SSH key capturada (native select):', nativeSelect.value);
          return nativeSelect.value.trim();
        }
      }
    }

    console.log('[MGC Extension] SSH key: nenhuma chave selecionada');
    return null;
  }

  /**
   * Extrai texto normalizado de um nó
   * @param {Element|null} node
   * @returns {string}
   */
  extractText(node) {
    if (!node) return '';
    const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text;
  }

  /**
   * Normaliza texto para comparações
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
   * Localiza seção/form-group pelo texto do label
   * @param {string} labelText
   * @returns {Element|null}
   */
  findSectionByLabel(labelText) {
    const target = this.normalizeText(labelText);
    if (!target) return null;

    // Buscar em todos os labels primeiro
    const allLabels = Array.from(document.querySelectorAll('label'));
    let matchLabel = allLabels.find((label) => this.normalizeText(label.textContent).includes(target));
    
    if (matchLabel) {
      const container = matchLabel.closest('[role="group"]') || 
        matchLabel.closest('.chakra-form-control') ||
        matchLabel.closest('fieldset') ||
        matchLabel.parentElement;
      console.log('[MGC Extension] Seção encontrada via label para:', labelText);
      return container;
    }

    // Fallback: buscar em headers e outros elementos
    const candidates = Array.from(document.querySelectorAll('h2, h3, h4, legend, p, span, strong'));
    const match = candidates.find((el) => this.normalizeText(el.textContent).includes(target));

    if (!match) {
      console.log('[MGC Extension] Seção NÃO encontrada para:', labelText);
      return null;
    }

    const container = match.closest('[role="group"], section, fieldset, form, .chakra-form-control') || match.parentElement;
    console.log('[MGC Extension] Seção encontrada via elemento para:', labelText);
    return container;
  }

  /**
   * Encontra label associado a um input
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
   * Localiza checkbox pelo texto do label
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
   * Verifica estado de um checkbox/input
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
   * Extrai detalhes numéricos do flavor
   * @param {string} text
   * @returns {{sku: string|null, vcpu: number|null, ramGb: number|null, priceHour: string|null, priceMonth: string|null}}
   */
  parseFlavorDetails(text) {
    if (!text) {
      return { sku: null, vcpu: null, ramGb: null, priceHour: null, priceMonth: null };
    }

    // SKU format: XX{digits}-{digits}-{digits} (ex: BV4-8-100, BV1-1-40)
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
   * Atualiza o display do código
   */
  updateCodeDisplay() {
    if (!this.sidebar) return;

    console.log('[MGC Extension] Atualizando display do código');

    const codeElement = this.sidebar.querySelector('#mgc-code-output');
    const billingElement = this.sidebar.querySelector('#mgc-billing-info');
    
    // Preparar dados para geração
    const data = { ...this.formData };

    // Gerar código baseado na tab ativa
    let result = null;
    
    if (window.MGC_GENERATORS) {
      if (this.currentTab === 'cli') {
        result = window.MGC_GENERATORS.generateCLI(data);
      } else if (this.currentTab === 'terraform') {
        result = window.MGC_GENERATORS.generateTerraform(data);
      }
    } else {
      console.error('[MGC Extension] MGC_GENERATORS não disponível');
      codeElement.textContent = '// Erro: Geradores não carregados';
      return;
    }

    // Atualizar código com syntax highlighting
    if (window.MGC_GENERATORS?.formatCodeWithHighlight) {
      codeElement.innerHTML = window.MGC_GENERATORS.formatCodeWithHighlight(
        result.code, this.currentTab
      );
    } else {
      codeElement.textContent = result.code;
    }
    
    // Exibir billing se existir
    if (billingElement && result.billing) {
      billingElement.textContent = result.billing;
      billingElement.style.display = 'block';
    } else if (billingElement) {
      billingElement.style.display = 'none';
    }
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MGCEquivalentCode();
  });
} else {
  new MGCEquivalentCode();
}

console.log('[MGC Extension] Content script carregado');
