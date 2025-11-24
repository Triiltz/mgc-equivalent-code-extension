/**
 * Geradores de código CLI e Terraform
 * Gera código equivalente a partir dos dados capturados do formulário
 */

/**
 * Gera comando CLI do MGC
 * @param {Object} data - Dados capturados do formulário
 * @param {string} data.instanceName - Nome da instância
 * @param {Object} data.image - Dados da imagem selecionada
 * @param {Object} data.availabilityZone - Zona de disponibilidade selecionada
 * @param {Object} data.memoryProfile - Perfil de memória ativo
 * @param {Object} data.flavor - Flavor selecionado com detalhes
 * @param {Object} data.disk - Configuração de disco
 * @param {Object} data.connectivity - Preferências de rede
 * @param {boolean} data.gpuEnabled - Se GPU está habilitada
 * @returns {string} - Comando CLI formatado
 */
function generateCLI(data = {}) {
  const {
    instanceName,
    image,
    availabilityZone,
    memoryProfile,
    flavor,
    disk,
    connectivity,
    gpuEnabled
  } = data || {};

  const imageValue = image?.id || image?.name || image?.apiValue || image?.displayName || null;
  const hasData = Boolean(
    instanceName ||
    imageValue ||
    availabilityZone?.value ||
    flavor?.value ||
    disk?.sizeGb ||
    typeof connectivity?.publicIPv4 === 'boolean' ||
    gpuEnabled
  );

  if (!hasData) {
    return '# Preencha o formulário para gerar o código CLI\n# Campos observados: nome, imagem, zona, tipo, disco, rede e GPU (opcional)';
  }

  const args = [];
  const escapeValue = (value) => value?.toString().replace(/"/g, '\\"');
  const addArg = (flag, value, { quote = true } = {}) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'number' && Number.isNaN(value)) return;
    const formatted = quote ? `"${escapeValue(value)}"` : value;
    args.push(`${flag} ${formatted}`);
  };

  if (instanceName) {
    addArg('--name', instanceName);
  }

  if (imageValue) {
    addArg('--image', imageValue);
  }

  if (availabilityZone?.value) {
    addArg('--availability-zone', availabilityZone.value);
  }

  if (flavor?.value) {
    addArg('--flavor', flavor.value);
  } else if (flavor?.sku) {
    addArg('--flavor', flavor.sku);
  }

  if (disk?.sizeGb) {
    addArg('--disk-size', disk.sizeGb, { quote: false });
  }

  if (typeof connectivity?.publicIPv4 === 'boolean') {
    addArg('--public-ipv4', connectivity.publicIPv4 ? 'true' : 'false', { quote: false });
  }

  if (gpuEnabled) {
    addArg('--gpu-enabled', 'true', { quote: false });
  }

  let command = 'mgc virtual-machines create';
  if (args.length) {
    command += ' \\\n  ' + args.join(' \\\n  ');
  }

  const comments = [
    '# Comando MGC CLI para criar VM',
    '# Documentação: https://docs.magalu.cloud/cli'
  ];

  if (memoryProfile?.label) {
    comments.push(`# Perfil de memória: ${memoryProfile.label}`);
  }

  if (flavor?.sku || flavor?.vcpu || flavor?.ramGb) {
    const specs = [
      flavor?.sku,
      flavor?.vcpu ? `${flavor.vcpu} vCPU` : null,
      flavor?.ramGb ? `${flavor.ramGb} GB RAM` : null
    ].filter(Boolean).join(' · ');
    if (specs) {
      comments.push(`# Flavor selecionado: ${specs}`);
    }
  }

  if (flavor?.priceHour || flavor?.priceMonth) {
    comments.push(`# Custos estimados: ${[flavor.priceHour, flavor.priceMonth].filter(Boolean).join(' | ')}`);
  }

  if (disk?.label && !disk.sizeGb) {
    comments.push(`# Disco: ${disk.label}`);
  }

  if (image?.displayName && image?.displayName !== imageValue) {
    comments.push(`# Imagem exibida: ${image.displayName}${image?.version ? ` (${image.version})` : ''}`);
  }

  if (availabilityZone?.label && availabilityZone.label !== availabilityZone.value) {
    comments.push(`# Zona exibida: ${availabilityZone.label}`);
  }

  return `${comments.join('\n')}\n\n${command}`;
}

/**
 * Gera código Terraform
 * @param {Object} data - Dados capturados do formulário
 * @param {string} data.instanceName - Nome da instância
 * @param {Object} data.image - Dados da imagem selecionada
 * @param {Object} data.availabilityZone - Zona de disponibilidade
 * @param {Object} data.memoryProfile - Perfil de memória ativo
 * @param {Object} data.flavor - Flavor selecionado
 * @param {Object} data.disk - Configuração de disco
 * @param {Object} data.connectivity - Preferências de rede
 * @param {boolean} data.gpuEnabled - Flag de GPU
 * @returns {string} - Código Terraform formatado
 */
function generateTerraform(data = {}) {
  const {
    instanceName,
    image,
    availabilityZone,
    memoryProfile,
    flavor,
    disk,
    connectivity,
    gpuEnabled
  } = data || {};

  const imageValue = image?.id || image?.name || image?.apiValue || image?.displayName || null;
  const hasData = Boolean(
    instanceName ||
    imageValue ||
    availabilityZone?.value ||
    flavor?.value ||
    disk?.sizeGb ||
    typeof connectivity?.publicIPv4 === 'boolean' ||
    gpuEnabled
  );

  if (!hasData) {
    return '# Preencha o formulário para gerar o código Terraform\n# Campos observados: nome, imagem, zona, flavor, disco, rede e GPU (opcional)';
  }

  const resourceName = instanceName
    ? instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : 'vm_instance';

  const terraform = [];
  terraform.push('# Configuração Terraform para Magalu Cloud');
  terraform.push('# Provider: https://registry.terraform.io/providers/magalucloud/mgc/latest');
  if (memoryProfile?.label) {
    terraform.push(`# Perfil selecionado no console: ${memoryProfile.label}`);
  }
  terraform.push('');

  terraform.push(`resource "mgc_virtual_machine" "${resourceName}" {`);

  if (instanceName) {
    terraform.push(`  name             = "${instanceName}"`);
  } else {
    terraform.push('  # name          = "adicione-o-nome-da-instancia"');
  }

  if (availabilityZone?.value) {
    terraform.push(`  availability_zone = "${availabilityZone.value}"`);
  } else {
    terraform.push('  # availability_zone = "selecione-uma-zona"');
  }

  if (imageValue) {
    terraform.push(`  image            = "${imageValue}"`);
    if (image?.displayName && image?.displayName !== imageValue) {
      terraform.push(`  # UI: ${image.displayName}${image?.version ? ` (${image.version})` : ''}`);
    }
  } else {
    terraform.push('  # image          = "selecione-uma-imagem"');
  }

  if (flavor?.value || flavor?.sku) {
    terraform.push(`  flavor           = "${flavor.value || flavor.sku}"`);
  } else {
    terraform.push('  # flavor        = "selecione-um-flavor"');
  }

  if (disk?.sizeGb) {
    terraform.push(`  disk_size        = ${disk.sizeGb}`);
  } else {
    terraform.push('  # disk_size     = 40');
  }

  if (typeof connectivity?.publicIPv4 === 'boolean') {
    terraform.push(`  public_ipv4      = ${connectivity.publicIPv4}`);
  } else {
    terraform.push('  # public_ipv4   = true');
  }

  if (gpuEnabled) {
    terraform.push('  gpu_enabled      = true');
  } else {
    terraform.push('  # gpu_enabled   = false');
  }

  terraform.push('}');

  if (flavor?.priceHour || flavor?.priceMonth) {
    terraform.push('');
    terraform.push(`# Custos estimados: ${[flavor.priceHour, flavor.priceMonth].filter(Boolean).join(' | ')}`);
  }

  return terraform.join('\n');
}

/**
 * Formata código com syntax highlighting básico usando HTML
 * @param {string} code - Código fonte
 * @param {string} language - Linguagem (cli ou terraform)
 * @returns {string} - Código formatado
 */
function formatCodeWithHighlight(code, language) {
  if (!code) return '';
  
  let formatted = code;
  
  // Escapar HTML
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Highlight para CLI (bash-like)
  if (language === 'cli') {
    formatted = formatted
      .replace(/^(#.*)$/gm, '<span class="comment">$1</span>') // Comentários
      .replace(/--([a-z-]+)/g, '<span class="flag">--$1</span>') // Flags
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>'); // Strings
  }
  
  // Highlight para Terraform (HCL)
  if (language === 'terraform') {
    formatted = formatted
      .replace(/^(#.*)$/gm, '<span class="comment">$1</span>') // Comentários
      .replace(/\b(resource|provider|variable|output|module)\b/g, '<span class="keyword">$1</span>') // Keywords
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>') // Strings
      .replace(/\b([a-z_][a-z0-9_]*)\s*=/g, '<span class="property">$1</span> ='); // Properties
  }
  
  return formatted;
}

// Exportar para uso no content script
window.MGC_GENERATORS = {
  generateCLI,
  generateTerraform,
  formatCodeWithHighlight
};

console.log('[MGC Extension] Geradores carregados');
