import { promises as fs } from 'fs';
import path from 'path';

type KnowledgeType = {
  id: string;
  title: string;
};

const knowledgeRoot = path.join(process.cwd(), 'knowledge');

const resolveKnowledgePath = (relativePath: string) => {
  const resolvedPath = path.resolve(knowledgeRoot, relativePath);
  if (!resolvedPath.startsWith(knowledgeRoot + path.sep)) {
    throw new Error('Invalid knowledge path');
  }
  return resolvedPath;
};

const toTitle = (value: string) =>
  value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const readKnowledgeMarkdown = async (relativePath: string) => {
  const resolvedPath = resolveKnowledgePath(relativePath);
  return fs.readFile(resolvedPath, 'utf8');
};

export const listKnowledgeTypes = async (): Promise<KnowledgeType[]> => {
  const typesDir = resolveKnowledgePath('types');
  const entries = await fs.readdir(typesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.basename(entry.name, '.md'))
    .sort()
    .map((id) => ({ id, title: toTitle(id) }));
};
