/**
 * Geradores de código CLI e Terraform
 * Gera código equivalente a partir dos dados capturados do formulário
 *
 * Referências:
 *   CLI:       mgc virtual-machine instances create --help
 *   Terraform: registry.terraform.io/providers/MagaluCloud/mgc/latest/docs/resources/virtual_machine_instances
 */

/**
 * Resolve o melhor valor de imagem para uso em código.
 * Prioridade: providerName (name) > displayName > fallback
 * @param {Object|null} image
 * @returns {{imageName: string|null, imageId: string|null}}
 */
function resolveImage(image) {
  if (!image) return { imageName: null, imageId: null };
  return {
    imageName: image.name || image.apiValue || image.displayName || null,
    imageId: image.id || null
  };
}

/**
 * Resolve o melhor valor de machine-type.
 * Prefere o nome SKU (ex: "BV4-8-100") ao UUID.
 * @param {Object|null} flavor
 * @returns {{mtName: string|null, mtId: string|null}}
 */
function resolveMachineType(flavor) {
  if (!flavor) return { mtName: null, mtId: null };
  return {
    mtName: flavor.sku || null,
    mtId: flavor.value && flavor.value !== flavor.sku ? flavor.value : null
  };
}

/**
 * Gera comando CLI do MGC
 * @param {Object} data - Dados capturados do formulário
 * @returns {{code: string, billing: string|null}}
 */
function generateCLI(data = {}) {
  const {
    instanceName,
    image,
    availabilityZone,
    flavor,
    connectivity,
    sshKeyName
  } = data || {};

  const { imageName, imageId } = resolveImage(image);
  const { mtName, mtId } = resolveMachineType(flavor);

  const hasData = Boolean(
    instanceName ||
    imageName || imageId ||
    availabilityZone?.value ||
    mtName || mtId ||
    typeof connectivity?.publicIPv4 === 'boolean' ||
    sshKeyName
  );

  if (!hasData) {
    return {
      code: '# Fill out the form to generate CLI code\n# Command: mgc virtual-machine instances create',
      billing: null
    };
  }

  const args = [];
  const esc = (v) => v?.toString().replace(/"/g, '\\"');
  const add = (flag, value, { quote = true } = {}) => {
    if (value === undefined || value === null || value === '') return;
    const formatted = quote ? `"${esc(value)}"` : value;
    args.push(`${flag}=${formatted}`);
  };

  // --name (required)
  add('--name', instanceName);

  // --image.name / --image.id
  if (imageName) {
    add('--image.name', imageName);
  } else if (imageId) {
    add('--image.id', imageId);
  }

  // --machine-type.name / --machine-type.id
  if (mtName) {
    add('--machine-type.name', mtName);
  } else if (mtId) {
    add('--machine-type.id', mtId);
  }

  // --availability-zone
  add('--availability-zone', availabilityZone?.value);

  // --network.associate-public-ip
  if (typeof connectivity?.publicIPv4 === 'boolean') {
    add('--network.associate-public-ip', connectivity.publicIPv4.toString(), { quote: false });
  }

  // --ssh-key-name
  add('--ssh-key-name', sshKeyName);

  let command = 'mgc virtual-machine instances create';
  if (args.length) {
    command += ' \\\n  ' + args.join(' \\\n  ');
  }

  return {
    code: command,
    billing: flavor?.priceHour || flavor?.priceMonth ?
      `Custos estimados: ${[flavor.priceHour, flavor.priceMonth].filter(Boolean).join(' | ')}` : null
  };
}

/**
 * Gera código Terraform
 * Ref: registry.terraform.io/providers/MagaluCloud/mgc/latest/docs/resources/virtual_machine_instances
 *
 * Required: name, machine_type
 * Optional: image, availability_zone, ssh_key_name, allocate_public_ipv4,
 *           user_data, vpc_id, network_interface_id, creation_security_groups
 *
 * @param {Object} data - Dados capturados do formulário
 * @returns {{code: string, billing: string|null}}
 */
function generateTerraform(data = {}) {
  const {
    instanceName,
    image,
    availabilityZone,
    flavor,
    connectivity,
    sshKeyName
  } = data || {};

  const { imageName } = resolveImage(image);
  const { mtName, mtId } = resolveMachineType(flavor);
  const machineTypeValue = mtName || mtId || null;

  const hasData = Boolean(
    instanceName ||
    imageName ||
    availabilityZone?.value ||
    machineTypeValue ||
    typeof connectivity?.publicIPv4 === 'boolean' ||
    sshKeyName
  );

  if (!hasData) {
    return {
      code: '# Fill out the form to generate Terraform code\n# Resource: mgc_virtual_machine_instances',
      billing: null
    };
  }

  const resourceName = instanceName
    ? instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : 'vm_instance';

  const lines = [];
  const pad = (key) => key.padEnd(20);

  lines.push(`resource "mgc_virtual_machine_instances" "${resourceName}" {`);

  // name (required)
  if (instanceName) {
    lines.push(`  ${pad('name')} = "${instanceName}"`);
  } else {
    lines.push(`  # ${pad('name')} = "instance-name"`);
  }

  // machine_type (required)
  if (machineTypeValue) {
    lines.push(`  ${pad('machine_type')} = "${machineTypeValue}"`);
  } else {
    lines.push(`  # ${pad('machine_type')} = "BV2-4-100"`);
  }

  // image
  if (imageName) {
    lines.push(`  ${pad('image')} = "${imageName}"`);
  } else {
    lines.push(`  # ${pad('image')} = "cloud-ubuntu-24.04 LTS"`);
  }

  // availability_zone
  if (availabilityZone?.value) {
    lines.push(`  ${pad('availability_zone')} = "${availabilityZone.value}"`);
  }

  // ssh_key_name
  if (sshKeyName) {
    lines.push(`  ${pad('ssh_key_name')} = "${sshKeyName}"`);
  } else {
    lines.push(`  # ${pad('ssh_key_name')} = "your-ssh-key-name"`);
  }

  // allocate_public_ipv4
  if (typeof connectivity?.publicIPv4 === 'boolean') {
    lines.push(`  ${pad('allocate_public_ipv4')} = ${connectivity.publicIPv4}`);
  }

  lines.push('}');

  return {
    code: lines.join('\n'),
    billing: flavor?.priceHour || flavor?.priceMonth ?
      `Estimated costs: ${[flavor.priceHour, flavor.priceMonth].filter(Boolean).join(' | ')}` : null
  };
}

/**
 * Formata código com syntax highlighting básico usando HTML
 * @param {string} code - Código fonte
 * @param {string} language - Linguagem (cli ou terraform)
 * @returns {string} - Código formatado
 */
function formatCodeWithHighlight(code, language) {
  if (!code) return '';

  // Escapar HTML
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Estratégia: extrair strings "..." para placeholders ANTES de inserir spans,
  // assim o regex de strings nunca casa com atributos class="..." do HTML gerado.

  if (language === 'cli') {
    escaped = escaped.split('\n').map(line => {
      // Comentários — linha inteira
      if (line.trimStart().startsWith('#')) {
        return `<span class="comment">${line}</span>`;
      }
      // 1) Extrair strings para placeholders
      const strings = [];
      let processed = line.replace(/"([^"]*)"/g, (match) => {
        strings.push(`<span class="string">${match}</span>`);
        return `\x00S${strings.length - 1}\x00`;
      });
      // 2) Flags (--flag.name, --flag-name)
      processed = processed.replace(/--([a-z][a-z0-9._-]*)/gi, '<span class="flag">--$1</span>');
      // 3) Booleans soltos (true/false)
      processed = processed.replace(/\b(true|false)\b/g, '<span class="keyword">$1</span>');
      // 4) Restaurar strings
      processed = processed.replace(/\x00S(\d+)\x00/g, (_, i) => strings[i]);
      return processed;
    }).join('\n');
  }

  if (language === 'terraform') {
    escaped = escaped.split('\n').map(line => {
      // Comentários — linha inteira
      if (line.trimStart().startsWith('#')) {
        return `<span class="comment">${line}</span>`;
      }
      // 1) Extrair strings para placeholders
      const strings = [];
      let processed = line.replace(/"([^"]*)"/g, (match) => {
        strings.push(`<span class="string">${match}</span>`);
        return `\x00S${strings.length - 1}\x00`;
      });
      // 2) Properties (key = ...) — ANTES de keywords para não casar class= dos spans
      processed = processed.replace(/\b([a-z_][a-z0-9_]*)\s*=/g, '<span class="property">$1</span> =');
      // 3) Keywords HCL
      processed = processed.replace(/\b(resource|provider|variable|output|module|data|locals|terraform)\b/g,
        '<span class="keyword">$1</span>');
      // 4) Booleans
      processed = processed.replace(/\b(true|false)\b/g, '<span class="keyword">$1</span>');
      // 5) Restaurar strings
      processed = processed.replace(/\x00S(\d+)\x00/g, (_, i) => strings[i]);
      return processed;
    }).join('\n');
  }

  return escaped;
}

// Exportar para uso no content script
window.MGC_GENERATORS = {
  generateCLI,
  generateTerraform,
  formatCodeWithHighlight
};

console.log('[MGC Extension] Geradores carregados');
