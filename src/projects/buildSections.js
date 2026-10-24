// src/projects/buildSections.js — project data → ScrollStage sections.
import { normalizeSections, assignIds } from './normalize.js';
import { section } from './sectionTypes.jsx';

/**
 * Build the ScrollStage section list for a data-driven project.
 * An entry with an unknown type or a broken config is skipped with a console error instead of
 * taking the whole page down.
 */
export function buildSections(project) {
  const entries = assignIds(normalizeSections(project));
  const out = [];
  for (const entry of entries) {
    try {
      out.push(section(entry.type, entry, project));
    } catch (err) {
      console.error(`[projects] "${project?.id}": skipped section "${entry.id}" —`, err.message);
    }
  }
  return out;
}
