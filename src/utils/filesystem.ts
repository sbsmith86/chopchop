export function isFileSystemAPISupported(): boolean {
  return !!(window.showSaveFilePicker && window.showOpenFilePicker);
}

export async function saveConfigToFile(config: object) {
  try {
    const opts = {
      types: [{
        description: 'JSON Config',
        accept: { 'application/json': ['.json'] }
      }]
    };
    const handle = await window.showSaveFilePicker(opts);
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(config, null, 2));
    await writable.close();
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') {
      throw e;
    }
    // User cancelled, do nothing
  }
}

export async function loadConfigFromFile(): Promise<object | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON Config',
        accept: { 'application/json': ['.json'] }
      }]
    });
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') {
      throw e;
    }
    // User cancelled, do nothing
    return null;
  }
}