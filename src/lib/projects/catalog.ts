// Static project catalog — brief §20/§21. A handful of real, fully-specified
// projects for the skills that have real lesson content today; the rest of
// the brief's project list is tracked as planned in ROADMAP.md rather than
// stubbed out here with fake detail pages.

export interface ProjectDef {
  slug: string;
  title: string;
  difficulty: "mini" | "project" | "advanced" | "capstone";
  skillSlug: string;
  overview: string;
  requirements: string[];
  milestones: string[];
  stretchGoals: string[];
}

export const PROJECT_CATALOG: ProjectDef[] = [
  {
    slug: "cli-expense-tracker",
    title: "CLI Expense Tracker",
    difficulty: "mini",
    skillSlug: "python",
    overview:
      "Build a command-line tool that logs expenses to a file and reports totals by category — a practical use of functions, loops, and file I/O.",
    requirements: [
      "Accept an expense (amount, category, note) as command-line input",
      "Persist expenses to a local file between runs",
      "Print a summary of total spend per category",
      "Handle invalid input (non-numeric amount) without crashing",
    ],
    milestones: [
      "Parse and validate a single expense entry",
      "Append entries to a persistent store",
      "Compute per-category totals",
      "Wire up a simple CLI loop",
    ],
    stretchGoals: [
      "Add a monthly filter",
      "Export a summary as CSV",
      "Add a budget warning when a category exceeds a threshold",
    ],
  },
  {
    slug: "file-organizer",
    title: "File Organizer",
    difficulty: "mini",
    skillSlug: "python",
    overview: "Write a script that sorts files in a directory into subfolders by file extension.",
    requirements: [
      "Scan a target directory",
      "Group files by extension",
      "Move each file into a matching subfolder, creating it if needed",
      "Skip files already in the right place",
    ],
    milestones: ["List and classify files by extension", "Create destination folders", "Move files safely"],
    stretchGoals: ["Dry-run mode that only prints planned moves", "Undo log"],
  },
];

export function getProject(slug: string): ProjectDef | undefined {
  return PROJECT_CATALOG.find((p) => p.slug === slug);
}
