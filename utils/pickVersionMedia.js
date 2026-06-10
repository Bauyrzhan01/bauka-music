import * as DocumentPicker from 'expo-document-picker';

function assetToFile(asset) {
  const name = asset.name || 'version';
  const ext = name.split('.').pop()?.toLowerCase();
  const isVideo = ['mp4', 'mov', 'webm', 'm4v'].includes(ext);

  return {
    file: {
      uri: asset.uri,
      name,
      mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'audio/mpeg'),
    },
    suggestedType: isVideo ? 'video' : 'edit',
  };
}

export async function pickVersionMedia({ multiple = false } = {}) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*', 'video/*'],
    copyToCacheDirectory: true,
    multiple,
  });

  if (result.canceled || !result.assets?.length) {
    return { ok: false, cancelled: true };
  }

  const items = result.assets.map(assetToFile);

  if (multiple) {
    return { ok: true, files: items };
  }

  const first = items[0];
  return {
    ok: true,
    file: first.file,
    suggestedType: first.suggestedType,
  };
}
