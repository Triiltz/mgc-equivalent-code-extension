/**
 * Mapeamento de valores da UI para valores da API
 * Converte nomes amigáveis exibidos no console para identificadores da API
 */

const RAW_IMAGE_DATA = [
  {
    displayName: 'Ubuntu 24.04 LTS',
    providerName: 'cloud-ubuntu-24.04 LTS',
    id: 'd8d019e1-ad7b-4e76-b881-e98bb822840f',
    version: '24.04.2 LTS',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['ubuntu 24.04', 'ubuntu24', 'ubuntu-24']
  },
  {
    displayName: 'Oracle Linux 9',
    providerName: 'cloud-oraclelinux-9',
    id: 'f00aa3f4-6acb-4351-94a0-b1c0963d78d8',
    version: '9.6',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['oracle linux', 'oraclelinux 9', 'oraclelinux-9']
  },
  {
    displayName: 'Ubuntu 22.04 LTS',
    providerName: 'cloud-ubuntu-22.04 LTS',
    id: '28f71189-1b77-4bd8-8088-1d500c7813f7',
    version: '22.04.5 LTS',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['ubuntu 22.04', 'ubuntu22', 'ubuntu-22']
  },
  {
    displayName: 'Rocky Linux 9',
    providerName: 'cloud-rocky-09',
    id: '757c5899-5109-4f7a-bea6-521017780e79',
    version: '9.6',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['rocky', 'rocky 9', 'rocky-linux-9']
  },
  {
    displayName: 'Debian 13 LTS',
    providerName: 'cloud-debian-13 LTS',
    id: '156e2223-def1-44ea-bb70-dff597240ae5',
    version: '13.1',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['debian 13', 'debian-13']
  },
  {
    displayName: 'Debian 12 LTS',
    providerName: 'cloud-debian-12 LTS',
    id: '81f41aa4-8a64-499f-9a0b-2a8becffed27',
    version: '12.12',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['debian 12', 'debian-12']
  },
  {
    displayName: 'openSUSE 15.6',
    providerName: 'cloud-opensuse-15.6',
    id: '2f4f90ba-c226-4d58-8ecf-30b5effb0426',
    version: '15.6',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['opensuse', 'opensuse 15.6']
  },
  {
    displayName: 'openSUSE 15.5',
    providerName: 'cloud-opensuse-15.5',
    id: 'fdc5cf21-f056-40db-8d92-12c3339e724b',
    version: '15.5',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['opensuse 15.5']
  },
  {
    displayName: 'Fedora 41',
    providerName: 'cloud-fedora-41',
    id: '48835577-8c61-4333-acb8-fb89e178d3f9',
    version: '41',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 10, ram: 1, vcpu: 1 },
    aliases: ['fedora', 'fedora 41']
  },
  {
    displayName: 'Oracle Linux 8',
    providerName: 'cloud-oraclelinux-8',
    id: '18806a48-aa29-4111-b59b-a1b42701de49',
    version: '8.10',
    platform: 'linux',
    availabilityZones: ['br-se1-a'],
    minRequirements: { disk: 40, ram: 4, vcpu: 2 },
    aliases: ['oracle linux 8', 'oraclelinux 8']
  },
  {
    displayName: 'Windows Server 2022',
    providerName: 'windows-server-2022',
    id: 'f00b9bcf-efa1-4a55-bc09-4ce7268f68b7',
    version: '2022',
    platform: 'windows',
    availabilityZones: ['br-se1-a'],
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
