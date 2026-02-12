# Debugging

## Console Logs

The extension logs all capture activity to the browser console. Open DevTools (`F12`) and filter by `[MGC Extension]`:

```
[MGC Extension] Inicializando...
[MGC Extension] Página de criar VM detectada
[MGC Extension] Sidebar injetada com sucesso
[MGC Extension] Nome capturado via input#name: minha-vm
[MGC Extension] Imagem via input[name=image]: cloud-ubuntu-24.04 LTS
[MGC Extension] Flavor capturado: {sku: 'BV4-8-100', vcpu: 4, ramGb: 8}
[MGC Extension] SSH key capturada (dropdown): my-key
```

## Common Issues

### Sidebar doesn't appear

- Verify the extension is loaded at `chrome://extensions/`
- Confirm you're on `https://console.magalu.cloud/virtual-machine/create`
- Check console for errors

### Fields not captured

- The console uses Chakra UI with dynamically generated class names. If MGC updates their frontend, selectors in `content.js` may need updating.
- Use `tools/mgcfieldmapper.js` in the browser console to inspect the current DOM structure.

### Image not recognized

- The image catalog in `src/mappings.js` is a static snapshot. Run `mgc virtual-machine images list --raw --output json` to check for new images and update the catalog.

## Field Mapper Tool

`tools/mgcfieldmapper.js` is a standalone script you can paste into the browser console to inspect all form fields:

```javascript
// Paste tools/mgcfieldmapper.js contents into the console
const mapper = new MGCFieldMapper();
mapper.mapAll();
// Outputs all captured fields with selectors
```
