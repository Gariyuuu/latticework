// Career track → skill roadmap data (brief §11/§39). Skill slugs here must
// match content/<slug>/metadata.json — content-sync.ts warns loudly if one
// doesn't exist yet. Stages group skills into the visual roadmap lanes.

export interface CareerTrackSkillEntry {
  slug: string;
  stage: string;
  importance: number; // weight in the readiness-percentage calc, 0-2
  order: number;
}

export interface CareerTrackDef {
  slug: string;
  name: string;
  description: string;
  skills: CareerTrackSkillEntry[];
}

function stage(stageName: string, slugs: string[], importance = 1): CareerTrackSkillEntry[] {
  return slugs.map((slug, i) => ({ slug, stage: stageName, importance, order: i }));
}

export const CAREER_TRACKS: CareerTrackDef[] = [
  {
    slug: "software-engineer",
    name: "Software Engineer",
    description: "General-purpose backend/full-stack engineering foundations.",
    skills: [
      ...stage("Foundation", ["python", "javascript", "git", "linux", "cli-terminal"], 1.5),
      ...stage("CS Fundamentals", ["data-structures", "algorithms", "complexity-analysis", "oop"], 1.5),
      ...stage("Engineering", ["rest-apis", "http", "testing", "docker", "debugging", "clean-code", "design-patterns"]),
      ...stage("Systems", ["networking-basics", "system-design", "database-design"]),
      ...stage("Interview Prep", ["system-design"], 0.5),
    ],
  },
  {
    slug: "full-stack-engineer",
    name: "Full-Stack Engineer",
    description: "Frontend + backend, from HTML to a deployed API.",
    skills: [
      ...stage("Foundation", ["html", "css", "javascript", "typescript", "git"], 1.5),
      ...stage("Frontend", ["rest-apis", "websockets"]),
      ...stage("Backend", ["python", "database-design", "postgresql", "authentication", "docker"]),
      ...stage("CS Fundamentals", ["data-structures", "algorithms"]),
      ...stage("Engineering", ["testing", "ci-cd", "cloud-fundamentals"]),
    ],
  },
  {
    slug: "backend-engineer",
    name: "Backend Engineer",
    description: "APIs, databases, and the systems that keep them reliable.",
    skills: [
      ...stage("Foundation", ["python", "go", "git", "linux"], 1.5),
      ...stage("CS Fundamentals", ["data-structures", "algorithms", "concurrency"], 1.5),
      ...stage("Data", ["sql", "postgresql", "redis", "database-design"], 1.5),
      ...stage("Engineering", ["rest-apis", "graphql", "authentication", "docker", "testing", "ci-cd"]),
      ...stage("Systems", ["networking-basics", "system-design", "distributed-systems"]),
    ],
  },
  {
    slug: "data-engineer",
    name: "Data Engineer",
    description: "Pipelines, warehouses, and moving data reliably at scale.",
    skills: [
      ...stage("Foundation", ["python", "sql", "git", "linux"], 1.5),
      ...stage("Data Modeling", ["database-design", "data-modeling", "data-warehousing"], 1.5),
      ...stage("Pipelines", ["etl-elt", "spark", "kafka", "snowflake"], 1.5),
      ...stage("Engineering", ["docker", "cloud-fundamentals", "aws-concepts", "testing"]),
      ...stage("Math", ["statistics"]),
    ],
  },
  {
    slug: "data-scientist",
    name: "Data Scientist",
    description: "Statistics, experimentation, and applied ML on real data.",
    skills: [
      ...stage("Foundation", ["python", "sql", "git"], 1.5),
      ...stage("Data", ["numpy", "pandas", "matplotlib", "jupyter"], 1.5),
      ...stage("Math", ["probability", "statistics", "linear-algebra"], 1.5),
      ...stage("ML", ["scikit-learn", "feature-engineering", "model-evaluation", "xgboost"]),
      ...stage("Projects", ["plotly"]),
    ],
  },
  {
    slug: "ml-engineer",
    name: "ML Engineer",
    description: "Building, training, and shipping ML models in production.",
    skills: [
      ...stage("Foundation", ["python", "git", "linux"], 1.5),
      ...stage("Data", ["numpy", "pandas"], 1.5),
      ...stage("Math", ["linear-algebra", "calculus-review", "probability", "optimization"], 1.5),
      ...stage("ML Core", ["scikit-learn", "pytorch", "feature-engineering", "model-evaluation"], 1.5),
      ...stage("Deployment", ["model-deployment", "mlops-fundamentals", "docker", "cloud-fundamentals"]),
    ],
  },
  {
    slug: "ai-engineer",
    name: "AI Engineer",
    description: "Applied LLM/AI systems — RAG, agents, embeddings, evaluation.",
    skills: [
      ...stage("Foundation", ["python", "git"], 1.5),
      ...stage("AI Core", ["llm-fundamentals", "prompt-engineering", "embeddings", "vector-databases", "rag-fundamentals"], 1.5),
      ...stage("Applied", ["openai-api-concepts", "huggingface-transformers", "pydantic"]),
      ...stage("Engineering", ["rest-apis", "docker", "testing", "model-evaluation"]),
      ...stage("Math", ["linear-algebra", "probability"]),
    ],
  },
  {
    slug: "quant-developer",
    name: "Quant Developer",
    description: "Low-latency systems and infrastructure for trading strategies.",
    skills: [
      ...stage("Foundation", ["python", "cpp", "git", "linux", "sql"], 1.5),
      ...stage("Math", ["probability", "statistics", "linear-algebra"], 1.5),
      ...stage("Algorithms", ["data-structures", "algorithms", "complexity-analysis"], 1.5),
      ...stage("Quant", ["time-series", "monte-carlo-simulation", "financial-markets"], 1.5),
      ...stage("Engineering", ["memory-management", "concurrency", "networking-basics"]),
    ],
  },
  {
    slug: "quant-researcher",
    name: "Quant Researcher",
    description: "Statistical research, factor models, and strategy backtesting.",
    skills: [
      ...stage("Foundation", ["python", "sql", "git"], 1.5),
      ...stage("Math", ["probability", "statistics", "linear-algebra", "calculus-review", "optimization"], 1.5),
      ...stage("Quant", ["time-series", "stochastic-processes", "monte-carlo-simulation", "numerical-methods", "quant-finance-fundamentals"], 1.5),
      ...stage("Data", ["numpy", "pandas", "scipy"]),
      ...stage("Projects", ["jupyter", "matplotlib"]),
    ],
  },
  {
    slug: "quant-trader",
    name: "Quant Trader",
    description: "Markets, risk, and systematic strategy intuition.",
    skills: [
      ...stage("Foundation", ["python", "sql"], 1.5),
      ...stage("Math", ["probability", "statistics"], 1.5),
      ...stage("Markets", ["financial-markets", "quant-finance-fundamentals", "time-series"], 1.5),
      ...stage("Quant", ["monte-carlo-simulation"]),
      ...stage("Data", ["numpy", "pandas"]),
    ],
  },
  {
    slug: "research-engineer",
    name: "Research Engineer",
    description: "Systems + ML research — bridging papers and production code.",
    skills: [
      ...stage("Foundation", ["python", "c", "cpp", "git"], 1.5),
      ...stage("CS Fundamentals", ["data-structures", "algorithms", "operating-systems", "compilers"], 1.5),
      ...stage("Math", ["linear-algebra", "calculus-review", "probability", "optimization"], 1.5),
      ...stage("ML", ["pytorch", "ml-experiment-design"]),
      ...stage("Systems", ["concurrency", "parallel-computing"]),
    ],
  },
];
