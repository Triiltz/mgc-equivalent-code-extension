/**
 * Mapeamento de valores da UI para valores da API
 * Converte nomes amigáveis exibidos no console para identificadores da API
 */

// Dados obtidos via: mgc virtual-machine images list --raw --output json
// Última atualização: 2026-02-12
const RAW_IMAGE_DATA = [
  {
    displayName: 'Ubuntu 24.04 LTS',
    providerName: 'cloud-ubuntu-24.04 LTS',
    id: 'a92f8939-3331-46e1-873e-2849d7451f59',
    version: '24.04.3 LTS',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['ubuntu 24.04', 'ubuntu24', 'ubuntu-24', 'ubuntu 24.04 lts']
  },
  {
    displayName: 'Ubuntu 22.04 LTS',
    providerName: 'cloud-ubuntu-22.04 LTS',
    id: 'f5d8f560-e2bd-460e-8242-df7fbd7bb35e',
    version: '22.04.5 LTS',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['ubuntu 22.04', 'ubuntu22', 'ubuntu-22', 'ubuntu 22.04 lts']
  },
  {
    displayName: 'Oracle Linux 10',
    providerName: 'cloud-oraclelinux-10',
    id: 'e46704ee-502c-4a7b-bb13-8f2b1e970620',
    version: '10.1',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['oracle linux 10', 'oraclelinux 10', 'oraclelinux-10']
  },
  {
    displayName: 'Oracle Linux 9',
    providerName: 'cloud-oraclelinux-9',
    id: 'c2241f4e-e5d4-46cf-9103-c665f5955d17',
    version: '9.7',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['oracle linux', 'oraclelinux 9', 'oraclelinux-9']
  },
  {
    displayName: 'Oracle Linux 8',
    providerName: 'cloud-oraclelinux-8',
    id: '18806a48-aa29-4111-b59b-a1b42701de49',
    version: '8.10',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['oracle linux 8', 'oraclelinux 8']
  },
  {
    displayName: 'Rocky Linux 10',
    providerName: 'cloud-rocky-10',
    id: '5da1585b-5328-4947-8b16-ebf64956a64f',
    version: '10.1',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['rocky 10', 'rocky-linux-10']
  },
  {
    displayName: 'Rocky Linux 9',
    providerName: 'cloud-rocky-09',
    id: '165b05dd-e705-4e48-a30d-f4a5e815a0ab',
    version: '9.7',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['rocky', 'rocky 9', 'rocky-linux-9']
  },
  {
    displayName: 'Debian 13 LTS',
    providerName: 'cloud-debian-13 LTS',
    id: '6d329c7c-7d70-462c-b6a7-b8495b999489',
    version: '13.3',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['debian 13', 'debian-13', 'debian 13 lts']
  },
  {
    displayName: 'Debian 12 LTS',
    providerName: 'cloud-debian-12 LTS',
    id: 'd4a0df68-ec40-40f0-879d-1b8d1503cb9a',
    version: '12.13',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['debian 12', 'debian-12', 'debian 12 lts']
  },
  {
    displayName: 'Fedora 43',
    providerName: 'cloud-fedora-43',
    id: 'bf16fb11-4806-41a9-9c4c-06686cc986ef',
    version: '43',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['fedora', 'fedora 43']
  },
  {
    displayName: 'Fedora 42',
    providerName: 'cloud-fedora-42',
    id: '736de564-f38b-43ee-b824-010c4aec61e6',
    version: '42',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['fedora 42']
  },
  {
    displayName: 'openSUSE 15.6',
    providerName: 'cloud-opensuse-15.6',
    id: '2f4f90ba-c226-4d58-8ecf-30b5effb0426',
    version: '15.6',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['opensuse', 'opensuse 15.6']
  },
  {
    displayName: 'openSUSE 15.5',
    providerName: 'cloud-opensuse-15.5',
    id: 'fdc5cf21-f056-40db-8d92-12c3339e724b',
    version: '15.5',
    platform: 'linux',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['opensuse 15.5']
  },
  {
    displayName: 'Windows Server 2022',
    providerName: 'windows-server-2022',
    id: 'f00b9bcf-efa1-4a55-bc09-4ce7268f68b7',
    version: '2022',
    platform: 'windows',
    availabilityZones: ['br-se1-a', 'br-se1-b', 'br-se1-c'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['windows', 'windows server', 'win 2022']
  }
];

function normalizeImageName(imageName) {
  if (!imageName) return '';
  return imageName
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function buildImageCatalog(rawData) {
  return rawData.map((item) => ({
    id: item.id,
    name: item.providerName,
    displayName: item.displayName,
    version: item.version,
    platform: item.platform,
    availabilityZones: item.availabilityZones,
    minRequirements: item.minRequirements,
    aliases: item.aliases || []
  }));
}

function buildImageMappings(catalog) {
  return catalog.reduce((acc, image) => {
    const keys = new Set([
      image.displayName,
      image.name,
      image.version ? `${image.platform} ${image.version}` : null,
      ...image.aliases
    ]);

    keys.forEach((key) => {
      if (!key) return;
      const normalized = normalizeImageName(key);
      acc[normalized] = image;
    });

    return acc;
  }, {});
}

const IMAGE_CATALOG = buildImageCatalog(RAW_IMAGE_DATA);
const IMAGE_MAPPINGS = buildImageMappings(IMAGE_CATALOG);

function getImageMetadata(uiImageName) {
  const normalized = normalizeImageName(uiImageName);
  const metadata = IMAGE_MAPPINGS[normalized];
  return metadata ? { ...metadata } : null;
}

function getImageApiValue(uiImageName) {
  const metadata = getImageMetadata(uiImageName);
  return metadata ? metadata.name : (uiImageName || '');
}

function listAvailableImages() {
  return IMAGE_CATALOG.map((image) => ({ ...image }));
}

window.MGC_MAPPINGS = {
  IMAGE_CATALOG,
  IMAGE_MAPPINGS,
  getImageApiValue,
  getImageMetadata,
  listAvailableImages,
  normalizeImageName
};

console.log('[MGC Extension] Mappings carregados:', IMAGE_CATALOG.length, 'imagens');
