/**
 * The full technology/concept catalog from the product brief (~95 entries,
 * sections 4-10). Python is authored separately with real lesson content
 * (see content/python/); everything here is written to disk as a skeleton
 * metadata.json by generate-skeletons.ts — see docs/COURSE_CONTENT_SPEC.md.
 * `hours` are rough author-time estimates for the *learner*, not this build.
 */

export type Category =
  | "language"
  | "web"
  | "database"
  | "ai-ml"
  | "data-science"
  | "quant"
  | "cs"
  | "devops"
  | "cloud"
  | "math"
  | "tooling";

export type Difficulty = "intro" | "beginner" | "intermediate" | "advanced";

export interface CatalogEntry {
  slug: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  hours: number;
  prereqs?: string[];
  usefulFor?: string[];
  modules: string[]; // titles; slugs are auto-derived
}

const SWE = ["software-engineer", "full-stack-engineer", "backend-engineer", "research-engineer"];
const DATA = ["data-engineer", "data-scientist"];
const ML = ["ml-engineer", "ai-engineer", "research-engineer"];
const QUANT = ["quant-developer", "quant-researcher", "quant-trader"];
const ALL_CAREERS = [...SWE, ...DATA, ...ML, ...QUANT];

export const CATALOG: CatalogEntry[] = [
  // ---- Core languages ----
  { slug: "python", name: "Python", category: "language", difficulty: "beginner", hours: 14, usefulFor: ALL_CAREERS, modules: ["Syntax & Variables", "Conditionals", "Loops", "Functions", "Collections", "Classes", "Files", "Exceptions", "Comprehensions", "Iterators", "Decorators", "Typing", "Testing", "Performance"] },
  { slug: "javascript", name: "JavaScript", category: "language", difficulty: "beginner", hours: 14, usefulFor: [...SWE, "full-stack-engineer"], modules: ["Syntax & Variables", "Functions", "Objects & Arrays", "Async/Promises", "DOM Basics", "Modules", "Error Handling"] },
  { slug: "typescript", name: "TypeScript", category: "language", difficulty: "intermediate", hours: 10, prereqs: ["javascript"], usefulFor: [...SWE, "full-stack-engineer"], modules: ["Types & Interfaces", "Generics", "Narrowing", "Utility Types", "Configuring strict mode"] },
  { slug: "java", name: "Java", category: "language", difficulty: "beginner", hours: 16, usefulFor: ["software-engineer", "backend-engineer"], modules: ["Syntax & Types", "OOP in Java", "Collections", "Exceptions", "Streams", "Concurrency Basics"] },
  { slug: "c", name: "C", category: "language", difficulty: "intermediate", hours: 14, usefulFor: ["software-engineer", "research-engineer"], modules: ["Syntax & Pointers", "Memory Management", "Structs", "File I/O", "Build Tools"] },
  { slug: "cpp", name: "C++", category: "language", difficulty: "intermediate", hours: 18, prereqs: ["c"], usefulFor: ["software-engineer", "quant-developer", "research-engineer"], modules: ["Syntax & Types", "Memory & Pointers", "OOP in C++", "STL Containers", "Templates", "RAII & Smart Pointers", "Concurrency", "Performance"] },
  { slug: "sql", name: "SQL", category: "language", difficulty: "beginner", hours: 10, usefulFor: ALL_CAREERS, modules: ["SELECT & WHERE", "GROUP BY & Aggregates", "JOINs", "Subqueries", "CTEs", "Window Functions", "Indexes & Query Plans", "Schema Design", "Transactions & Isolation", "Interview Patterns"] },
  { slug: "r", name: "R", category: "language", difficulty: "beginner", hours: 10, usefulFor: ["data-scientist"], modules: ["Vectors & Data Frames", "dplyr", "ggplot2", "Statistical Modeling"] },
  { slug: "go", name: "Go", category: "language", difficulty: "intermediate", hours: 10, usefulFor: ["backend-engineer", "software-engineer"], modules: ["Syntax & Types", "Goroutines & Channels", "Interfaces", "Error Handling", "Modules & Tooling"] },
  { slug: "rust", name: "Rust", category: "language", difficulty: "advanced", hours: 14, usefulFor: ["software-engineer", "quant-developer"], modules: ["Ownership & Borrowing", "Structs & Enums", "Traits", "Error Handling", "Concurrency"] },
  { slug: "bash", name: "Bash / Shell", category: "tooling", difficulty: "beginner", hours: 5, usefulFor: ALL_CAREERS, modules: ["Shell Basics", "Pipes & Redirection", "Scripting", "Text Processing (grep/sed/awk)"] },
  { slug: "julia", name: "Julia", category: "language", difficulty: "intermediate", hours: 8, usefulFor: ["quant-researcher", "research-engineer"], modules: ["Syntax & Types", "Arrays & Broadcasting", "Multiple Dispatch", "Performance"] },
  { slug: "matlab", name: "MATLAB Fundamentals", category: "language", difficulty: "beginner", hours: 6, usefulFor: ["quant-researcher"], modules: ["Matrices & Vectors", "Plotting", "Scripts & Functions"] },
  { slug: "html", name: "HTML", category: "web", difficulty: "intro", hours: 4, usefulFor: ["full-stack-engineer", "software-engineer"], modules: ["Document Structure", "Forms", "Semantic Elements", "Accessibility Basics"] },
  { slug: "css", name: "CSS", category: "web", difficulty: "beginner", hours: 6, prereqs: ["html"], usefulFor: ["full-stack-engineer", "software-engineer"], modules: ["Box Model", "Flexbox", "Grid", "Responsive Design"] },
  { slug: "kotlin", name: "Kotlin Fundamentals", category: "language", difficulty: "beginner", hours: 6, usefulFor: ["software-engineer"], modules: ["Syntax & Types", "Null Safety", "Coroutines Basics"] },
  { slug: "swift", name: "Swift Fundamentals", category: "language", difficulty: "beginner", hours: 6, usefulFor: ["software-engineer"], modules: ["Syntax & Types", "Optionals", "Structs & Protocols"] },

  // ---- Python ecosystem ----
  { slug: "numpy", name: "NumPy", category: "data-science", difficulty: "beginner", hours: 6, prereqs: ["python"], usefulFor: [...DATA, ...ML, ...QUANT], modules: ["Arrays", "Vectorization", "Broadcasting", "Indexing & Slicing", "Linear Algebra Ops"] },
  { slug: "pandas", name: "Pandas", category: "data-science", difficulty: "beginner", hours: 8, prereqs: ["numpy"], usefulFor: [...DATA, ...ML, ...QUANT], modules: ["Series & DataFrames", "Selection & Filtering", "GroupBy", "Joins & Merges", "Missing Data", "Time Series"] },
  { slug: "scipy", name: "SciPy", category: "data-science", difficulty: "intermediate", hours: 6, prereqs: ["numpy"], usefulFor: [...DATA, "quant-researcher"], modules: ["Optimization", "Statistics", "Linear Algebra", "Interpolation"] },
  { slug: "matplotlib", name: "Matplotlib", category: "data-science", difficulty: "beginner", hours: 4, prereqs: ["numpy"], usefulFor: [...DATA, ...QUANT], modules: ["Basic Plots", "Subplots", "Styling", "Saving Figures"] },
  { slug: "plotly", name: "Plotly", category: "data-science", difficulty: "beginner", hours: 4, usefulFor: [...DATA], modules: ["Interactive Charts", "Dashboards Basics"] },
  { slug: "jupyter", name: "Jupyter", category: "tooling", difficulty: "intro", hours: 2, usefulFor: [...DATA, ...ML], modules: ["Notebook Basics", "Magic Commands", "Kernel Management"] },
  { slug: "polars", name: "Polars", category: "data-science", difficulty: "intermediate", hours: 5, prereqs: ["pandas"], usefulFor: ["data-engineer", "data-scientist"], modules: ["DataFrame Basics", "Lazy Evaluation", "Performance vs Pandas"] },
  { slug: "pydantic", name: "Pydantic", category: "tooling", difficulty: "beginner", hours: 3, prereqs: ["python"], usefulFor: ["backend-engineer", "ai-engineer"], modules: ["Models & Validation", "Settings Management"] },

  // ---- ML / AI ----
  { slug: "scikit-learn", name: "Scikit-learn", category: "ai-ml", difficulty: "beginner", hours: 8, prereqs: ["pandas"], usefulFor: ["data-scientist", "ml-engineer"], modules: ["Estimators API", "Train/Test Split", "Pipelines", "Model Evaluation"] },
  { slug: "pytorch", name: "PyTorch", category: "ai-ml", difficulty: "intermediate", hours: 16, prereqs: ["python", "numpy", "linear-algebra"], usefulFor: ["ml-engineer", "ai-engineer", "research-engineer"], modules: ["Tensors", "Broadcasting", "Autograd", "nn.Module", "Losses & Optimizers", "Datasets & DataLoaders", "Training Loops", "Evaluation", "GPU Concepts", "CNN Fundamentals", "Transformer Fundamentals", "Debugging", "Saving/Loading Models"] },
  { slug: "tensorflow", name: "TensorFlow", category: "ai-ml", difficulty: "intermediate", hours: 12, prereqs: ["python", "numpy"], usefulFor: ["ml-engineer", "ai-engineer"], modules: ["Tensors & Ops", "Keras Sequential/Functional", "Training Loops", "Saving Models"] },
  { slug: "keras", name: "Keras", category: "ai-ml", difficulty: "beginner", hours: 5, prereqs: ["tensorflow"], usefulFor: ["ml-engineer"], modules: ["Sequential API", "Functional API", "Callbacks"] },
  { slug: "xgboost", name: "XGBoost", category: "ai-ml", difficulty: "intermediate", hours: 5, prereqs: ["scikit-learn"], usefulFor: ["data-scientist", "ml-engineer"], modules: ["Gradient Boosting Intuition", "Tuning", "Feature Importance"] },
  { slug: "lightgbm", name: "LightGBM", category: "ai-ml", difficulty: "intermediate", hours: 4, prereqs: ["xgboost"], usefulFor: ["data-scientist", "ml-engineer"], modules: ["Leaf-wise Growth", "Tuning vs XGBoost"] },
  { slug: "huggingface-transformers", name: "Hugging Face Transformers", category: "ai-ml", difficulty: "intermediate", hours: 8, prereqs: ["pytorch"], usefulFor: ["ai-engineer", "ml-engineer"], modules: ["Pipelines", "Tokenizers", "Fine-tuning", "Model Hub"] },
  { slug: "openai-api-concepts", name: "OpenAI-style API Concepts", category: "ai-ml", difficulty: "beginner", hours: 3, usefulFor: ["ai-engineer"], modules: ["Chat Completions", "Streaming", "Function/Tool Calling"] },
  { slug: "embeddings", name: "Embeddings", category: "ai-ml", difficulty: "intermediate", hours: 4, usefulFor: ["ai-engineer", "ml-engineer"], modules: ["Vector Representations", "Similarity Metrics", "Use Cases"] },
  { slug: "vector-databases", name: "Vector Databases", category: "ai-ml", difficulty: "intermediate", hours: 4, prereqs: ["embeddings"], usefulFor: ["ai-engineer"], modules: ["Indexing (HNSW/IVF)", "Hybrid Search", "Tradeoffs"] },
  { slug: "rag-fundamentals", name: "RAG Fundamentals", category: "ai-ml", difficulty: "intermediate", hours: 5, prereqs: ["embeddings", "vector-databases"], usefulFor: ["ai-engineer"], modules: ["Retrieval Pipeline", "Chunking Strategies", "Evaluation"] },
  { slug: "llm-fundamentals", name: "LLM Fundamentals", category: "ai-ml", difficulty: "intermediate", hours: 6, usefulFor: ["ai-engineer", "ml-engineer"], modules: ["Tokenization", "Attention Intuition", "Context Windows", "Limitations"] },
  { slug: "prompt-engineering", name: "Prompt Engineering", category: "ai-ml", difficulty: "beginner", hours: 4, usefulFor: ["ai-engineer"], modules: ["Instruction Design", "Few-shot Examples", "Structured Output"] },
  { slug: "model-evaluation", name: "Model Evaluation", category: "ai-ml", difficulty: "intermediate", hours: 5, prereqs: ["statistics"], usefulFor: ["data-scientist", "ml-engineer"], modules: ["Metrics", "Cross-validation", "Bias/Variance"] },
  { slug: "feature-engineering", name: "Feature Engineering", category: "ai-ml", difficulty: "intermediate", hours: 5, prereqs: ["pandas"], usefulFor: ["data-scientist", "ml-engineer"], modules: ["Encoding", "Scaling", "Interaction Features"] },
  { slug: "ml-experiment-design", name: "ML Experiment Design", category: "ai-ml", difficulty: "intermediate", hours: 4, usefulFor: ["ml-engineer", "research-engineer"], modules: ["Hypotheses & Baselines", "Ablations", "Tracking"] },
  { slug: "model-deployment", name: "Model Deployment", category: "ai-ml", difficulty: "intermediate", hours: 5, usefulFor: ["ml-engineer"], modules: ["Serving Patterns", "Batch vs Real-time", "Versioning"] },
  { slug: "mlops-fundamentals", name: "MLOps Fundamentals", category: "ai-ml", difficulty: "intermediate", hours: 5, prereqs: ["model-deployment"], usefulFor: ["ml-engineer"], modules: ["Pipelines", "Monitoring", "Retraining Triggers"] },

  // ---- Databases / data engineering ----
  { slug: "postgresql", name: "PostgreSQL", category: "database", difficulty: "beginner", hours: 6, prereqs: ["sql"], usefulFor: [...SWE, "data-engineer"], modules: ["Data Types", "Indexes", "EXPLAIN", "Extensions"] },
  { slug: "mysql", name: "MySQL Concepts", category: "database", difficulty: "beginner", hours: 4, prereqs: ["sql"], usefulFor: ["backend-engineer"], modules: ["Storage Engines", "Indexing", "Replication Basics"] },
  { slug: "sqlite", name: "SQLite", category: "database", difficulty: "intro", hours: 2, prereqs: ["sql"], usefulFor: ["software-engineer"], modules: ["File-based DB Basics", "When to Use It"] },
  { slug: "redis", name: "Redis", category: "database", difficulty: "beginner", hours: 4, usefulFor: ["backend-engineer", "data-engineer"], modules: ["Data Structures", "Caching Patterns", "Pub/Sub"] },
  { slug: "mongodb", name: "MongoDB", category: "database", difficulty: "beginner", hours: 4, usefulFor: ["backend-engineer"], modules: ["Documents & Collections", "Aggregation Pipeline", "Indexing"] },
  { slug: "database-design", name: "Database Design", category: "database", difficulty: "intermediate", hours: 6, prereqs: ["sql"], usefulFor: [...SWE, "data-engineer"], modules: ["Normalization", "ER Modeling", "Constraints"] },
  { slug: "data-modeling", name: "Data Modeling", category: "database", difficulty: "intermediate", hours: 5, prereqs: ["database-design"], usefulFor: ["data-engineer"], modules: ["Star/Snowflake Schema", "Slowly Changing Dimensions"] },
  { slug: "etl-elt", name: "ETL / ELT", category: "database", difficulty: "intermediate", hours: 6, prereqs: ["sql"], usefulFor: ["data-engineer"], modules: ["Batch Pipelines", "Idempotency", "Orchestration Basics"] },
  { slug: "spark", name: "Apache Spark Fundamentals", category: "database", difficulty: "intermediate", hours: 8, prereqs: ["python", "sql"], usefulFor: ["data-engineer"], modules: ["RDDs & DataFrames", "Transformations & Actions", "Partitioning"] },
  { slug: "kafka", name: "Kafka Fundamentals", category: "database", difficulty: "intermediate", hours: 6, usefulFor: ["data-engineer", "backend-engineer"], modules: ["Topics & Partitions", "Producers/Consumers", "Delivery Guarantees"] },
  { slug: "data-warehousing", name: "Warehousing Concepts", category: "database", difficulty: "intermediate", hours: 5, prereqs: ["data-modeling"], usefulFor: ["data-engineer"], modules: ["OLAP vs OLTP", "Columnar Storage"] },
  { slug: "snowflake", name: "Snowflake Fundamentals", category: "database", difficulty: "intermediate", hours: 4, prereqs: ["data-warehousing"], usefulFor: ["data-engineer"], modules: ["Architecture", "Virtual Warehouses", "Cost Model"] },

  // ---- Software engineering ----
  { slug: "git", name: "Git", category: "devops", difficulty: "beginner", hours: 5, usefulFor: ALL_CAREERS, modules: ["Commits & Branches", "Merging & Rebasing", "Resolving Conflicts", "Remotes"] },
  { slug: "github", name: "GitHub", category: "devops", difficulty: "beginner", hours: 3, prereqs: ["git"], usefulFor: ALL_CAREERS, modules: ["Pull Requests", "Actions Basics", "Issues & Projects"] },
  { slug: "linux", name: "Linux", category: "devops", difficulty: "beginner", hours: 6, prereqs: ["bash"], usefulFor: ALL_CAREERS, modules: ["Filesystem", "Permissions", "Processes", "Package Management"] },
  { slug: "cli-terminal", name: "Terminal / CLI", category: "tooling", difficulty: "intro", hours: 3, usefulFor: ALL_CAREERS, modules: ["Navigation", "File Operations", "Environment Variables"] },
  { slug: "docker", name: "Docker", category: "devops", difficulty: "intermediate", hours: 6, prereqs: ["linux"], usefulFor: [...SWE, "data-engineer", "ml-engineer"], modules: ["Images & Containers", "Dockerfile", "Volumes & Networking", "Compose"] },
  { slug: "rest-apis", name: "REST APIs", category: "web", difficulty: "beginner", hours: 5, usefulFor: [...SWE], modules: ["Resources & Verbs", "Status Codes", "Pagination", "Versioning"] },
  { slug: "graphql", name: "GraphQL Fundamentals", category: "web", difficulty: "intermediate", hours: 4, prereqs: ["rest-apis"], usefulFor: ["full-stack-engineer", "backend-engineer"], modules: ["Schemas & Types", "Queries & Mutations", "Resolvers"] },
  { slug: "http", name: "HTTP", category: "web", difficulty: "beginner", hours: 3, usefulFor: [...SWE], modules: ["Requests & Responses", "Headers", "Caching"] },
  { slug: "websockets", name: "WebSockets", category: "web", difficulty: "intermediate", hours: 3, prereqs: ["http"], usefulFor: ["full-stack-engineer", "backend-engineer"], modules: ["Handshake", "Message Framing", "Reconnection Patterns"] },
  { slug: "authentication", name: "Authentication", category: "web", difficulty: "intermediate", hours: 4, usefulFor: [...SWE], modules: ["Sessions vs Tokens", "OAuth Basics", "Password Storage"] },
  { slug: "testing", name: "Testing", category: "cs", difficulty: "beginner", hours: 5, usefulFor: ALL_CAREERS, modules: ["Unit Tests", "Mocking", "Integration Tests", "Test Design"] },
  { slug: "ci-cd", name: "CI/CD", category: "devops", difficulty: "intermediate", hours: 4, prereqs: ["github", "testing"], usefulFor: [...SWE], modules: ["Pipelines", "Automated Testing Gates", "Deployment Strategies"] },
  { slug: "cloud-fundamentals", name: "Cloud Fundamentals", category: "cloud", difficulty: "beginner", hours: 5, usefulFor: [...SWE, "data-engineer"], modules: ["Compute/Storage/Network", "Managed Services", "Cost Basics"] },
  { slug: "aws-concepts", name: "AWS Concepts", category: "cloud", difficulty: "intermediate", hours: 6, prereqs: ["cloud-fundamentals"], usefulFor: [...SWE, "data-engineer"], modules: ["EC2/S3/IAM", "Lambda", "RDS"] },
  { slug: "gcp-concepts", name: "GCP Concepts", category: "cloud", difficulty: "intermediate", hours: 5, prereqs: ["cloud-fundamentals"], usefulFor: ["data-engineer", "ml-engineer"], modules: ["Compute Engine/GCS", "BigQuery", "IAM"] },
  { slug: "networking-basics", name: "Networking Basics", category: "cs", difficulty: "beginner", hours: 4, usefulFor: [...SWE], modules: ["TCP/IP", "DNS", "Load Balancing"] },
  { slug: "system-design", name: "System Design Fundamentals", category: "cs", difficulty: "advanced", hours: 8, prereqs: ["networking-basics", "database-design"], usefulFor: [...SWE], modules: ["Scalability Basics", "Caching", "Load Balancing", "Trade-off Interviews"] },
  { slug: "distributed-systems", name: "Distributed Systems Fundamentals", category: "cs", difficulty: "advanced", hours: 8, prereqs: ["system-design"], usefulFor: ["software-engineer", "data-engineer"], modules: ["CAP Theorem", "Consensus Basics", "Replication"] },
  { slug: "software-architecture", name: "Software Architecture", category: "cs", difficulty: "advanced", hours: 6, prereqs: ["design-patterns"], usefulFor: [...SWE], modules: ["Layering", "Microservices vs Monolith", "Trade-offs"] },
  { slug: "debugging", name: "Debugging", category: "cs", difficulty: "beginner", hours: 3, usefulFor: ALL_CAREERS, modules: ["Reading Stack Traces", "Bisection", "Tooling"] },
  { slug: "clean-code", name: "Clean Code", category: "cs", difficulty: "beginner", hours: 4, usefulFor: [...SWE], modules: ["Naming", "Functions", "Code Smells"] },
  { slug: "design-patterns", name: "Design Patterns", category: "cs", difficulty: "intermediate", hours: 6, prereqs: ["oop"], usefulFor: [...SWE], modules: ["Creational", "Structural", "Behavioral"] },

  // ---- Computer science ----
  { slug: "data-structures", name: "Data Structures", category: "cs", difficulty: "beginner", hours: 12, prereqs: ["python"], usefulFor: ALL_CAREERS, modules: ["Arrays & Lists", "Stacks & Queues", "Hash Tables", "Trees & BSTs", "Heaps", "Graphs", "Tries"] },
  { slug: "algorithms", name: "Algorithms", category: "cs", difficulty: "intermediate", hours: 14, prereqs: ["data-structures"], usefulFor: ALL_CAREERS, modules: ["Sorting", "Searching", "Recursion", "Dynamic Programming", "Graph Algorithms", "Greedy"] },
  { slug: "oop", name: "Object-Oriented Programming", category: "cs", difficulty: "beginner", hours: 6, usefulFor: [...SWE], modules: ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation"] },
  { slug: "functional-programming", name: "Functional Programming Fundamentals", category: "cs", difficulty: "intermediate", hours: 5, usefulFor: [...SWE], modules: ["Pure Functions", "Immutability", "Map/Filter/Reduce"] },
  { slug: "operating-systems", name: "Operating Systems Fundamentals", category: "cs", difficulty: "intermediate", hours: 8, usefulFor: ["software-engineer", "research-engineer"], modules: ["Processes & Threads", "Scheduling", "Virtual Memory"] },
  { slug: "computer-networking", name: "Computer Networking", category: "cs", difficulty: "intermediate", hours: 6, prereqs: ["networking-basics"], usefulFor: ["software-engineer"], modules: ["OSI Model", "Routing Basics", "Sockets"] },
  { slug: "concurrency", name: "Concurrency", category: "cs", difficulty: "advanced", hours: 6, usefulFor: ["software-engineer", "quant-developer"], modules: ["Threads & Locks", "Race Conditions", "Async Models"] },
  { slug: "parallel-computing", name: "Parallel Computing", category: "cs", difficulty: "advanced", hours: 5, prereqs: ["concurrency"], usefulFor: ["research-engineer", "quant-developer"], modules: ["SIMD Basics", "Parallel Algorithms", "GPU Parallelism Intuition"] },
  { slug: "memory-management", name: "Memory Management", category: "cs", difficulty: "intermediate", hours: 5, prereqs: ["c"], usefulFor: ["software-engineer", "quant-developer"], modules: ["Stack vs Heap", "Garbage Collection", "Manual Management Pitfalls"] },
  { slug: "compilers", name: "Compilers Fundamentals", category: "cs", difficulty: "advanced", hours: 6, usefulFor: ["research-engineer"], modules: ["Lexing & Parsing", "ASTs", "Codegen Intuition"] },
  { slug: "complexity-analysis", name: "Complexity Analysis", category: "cs", difficulty: "beginner", hours: 4, prereqs: ["data-structures"], usefulFor: ALL_CAREERS, modules: ["Big-O", "Time vs Space", "Amortized Analysis"] },

  // ---- Quant / math ----
  { slug: "probability", name: "Probability", category: "math", difficulty: "beginner", hours: 8, usefulFor: [...DATA, ...ML, ...QUANT], modules: ["Random Variables", "Distributions", "Bayes' Theorem", "Expectation & Variance"] },
  { slug: "statistics", name: "Statistics", category: "math", difficulty: "beginner", hours: 8, prereqs: ["probability"], usefulFor: [...DATA, ...ML, ...QUANT], modules: ["Hypothesis Testing", "Confidence Intervals", "Regression", "A/B Testing"] },
  { slug: "linear-algebra", name: "Linear Algebra", category: "math", difficulty: "beginner", hours: 8, usefulFor: [...ML, ...QUANT], modules: ["Vectors & Matrices", "Eigenvalues", "Matrix Decompositions"] },
  { slug: "calculus-review", name: "Calculus Review", category: "math", difficulty: "beginner", hours: 5, usefulFor: [...ML, ...QUANT], modules: ["Derivatives", "Gradients", "Chain Rule for Backprop"] },
  { slug: "optimization", name: "Optimization", category: "math", difficulty: "intermediate", hours: 6, prereqs: ["calculus-review"], usefulFor: [...ML, ...QUANT], modules: ["Gradient Descent", "Convexity Intuition", "Constrained Optimization"] },
  { slug: "time-series", name: "Time Series", category: "quant", difficulty: "intermediate", hours: 6, prereqs: ["statistics"], usefulFor: ["data-scientist", "quant-researcher"], modules: ["Stationarity", "Autocorrelation", "ARIMA Intuition", "Rolling Windows"] },
  { slug: "stochastic-processes", name: "Stochastic Processes Fundamentals", category: "quant", difficulty: "advanced", hours: 6, prereqs: ["probability"], usefulFor: ["quant-researcher", "quant-developer"], modules: ["Random Walks", "Brownian Motion Intuition", "Markov Chains"] },
  { slug: "monte-carlo-simulation", name: "Monte Carlo Simulation", category: "quant", difficulty: "intermediate", hours: 5, prereqs: ["probability", "python"], usefulFor: [...QUANT], modules: ["Random Sampling", "Simulating Stock Paths", "Variance Reduction"] },
  { slug: "numerical-methods", name: "Numerical Methods", category: "quant", difficulty: "intermediate", hours: 6, prereqs: ["linear-algebra"], usefulFor: ["quant-developer", "research-engineer"], modules: ["Root Finding", "Numerical Integration", "Solving Linear Systems"] },
  { slug: "financial-markets", name: "Financial Markets Fundamentals", category: "quant", difficulty: "beginner", hours: 5, usefulFor: [...QUANT], modules: ["Asset Classes", "Order Types", "Market Structure"] },
  { slug: "quant-finance-fundamentals", name: "Quantitative Finance Fundamentals", category: "quant", difficulty: "intermediate", hours: 8, prereqs: ["financial-markets", "statistics"], usefulFor: [...QUANT], modules: ["Options Basics", "Derivatives Basics", "Black-Scholes Intuition", "Greeks Intuition", "Portfolio Theory", "Risk", "Factor Models", "Backtesting", "Market Microstructure Basics"] },
];
