import * as fs from 'fs';
import * as path from 'path';
import { Safety, FileOp, FileOpResult } from './safety';

export interface FileGuardDecision extends FileOpResult {
  canProceed: boolean;
  trashPath?: string;
}

export interface SafeDeleteOptions {
  confirmed?: boolean;
  dryRun?: boolean;
  trashDir?: string;
}

export interface SafeDeleteResult extends FileGuardDecision {
  deleted: boolean;
}

export function evaluateFileGuard(op: FileOp, confirmed = false): FileGuardDecision {
  const base = Safety.protectFileOp(op);
  if (!base.allowed) {
    return {
      ...base,
      canProceed: false,
    };
  }

  if (base.requireConfirm && !confirmed) {
    return {
      ...base,
      canProceed: false,
    };
  }

  return {
    ...base,
    requireConfirm: false,
    canProceed: true,
  };
}

export async function safeDeleteFile(filePath: string, options: SafeDeleteOptions = {}): Promise<SafeDeleteResult> {
  const size = await getOptionalSize(filePath);
  const decision = evaluateFileGuard({ type: 'delete', path: filePath, size }, options.confirmed);
  if (!decision.canProceed) {
    return {
      ...decision,
      deleted: false,
    };
  }

  const trashPath = buildTrashPath(filePath, options.trashDir);
  if (!options.dryRun) {
    await fs.promises.mkdir(path.dirname(trashPath), { recursive: true });
    await fs.promises.rename(filePath, trashPath);
  }

  return {
    ...decision,
    trashPath,
    deleted: true,
  };
}

async function getOptionalSize(filePath: string): Promise<number | undefined> {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.size;
  } catch {
    return undefined;
  }
}

function buildTrashPath(filePath: string, trashDir?: string): string {
  const parsed = path.parse(filePath);
  const targetDir = trashDir || path.join(parsed.dir, '.anan-trash');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(targetDir, `${parsed.name}-${stamp}${parsed.ext}`);
}
