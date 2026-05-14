export type LabType = 'lab1' | 'lab2';

export type ModuleAssetsMapping = Record<
  string,
  {
    labType: LabType;
    modelKey: string; // primary model (maps to /models/<modelFile>)
    manualPdfUrl: string; // can be a blob: URL during the same session

    // Optional metadata for faculty UI (frontend-only prototype).
    // Lab views currently ignore this.
    models?: Array<{
      modelKey: string;
      modelName: string;
      complexity: string;
    }>;
  }
>;


const STORAGE_KEY = 'vrmts_module_assets_v1';

export function getModuleAssetsMapping(): ModuleAssetsMapping {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as ModuleAssetsMapping;
  } catch {
    return {};
  }
}

export function setModuleAssetsMapping(mapping: ModuleAssetsMapping) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
}

export function setModuleAssetsForModule(moduleId: string, assets: ModuleAssetsMapping[string]) {
  const mapping = getModuleAssetsMapping();
  mapping[moduleId] = assets;
  setModuleAssetsMapping(mapping);
}

export function getAssetsForModule(moduleId: string) {
  const mapping = getModuleAssetsMapping();
  return mapping[moduleId] ?? null;
}

export function getModelPathFromModelKey(modelKey: string) {
  // modelKey is expected to be a filename that already exists under /public/models
  // Example modelKey: "SkeletalSystem100.fbx"
  return `/models/${modelKey}`;
}

