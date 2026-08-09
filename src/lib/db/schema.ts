import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  careerGoal: text("career_goal"), // CareerTrack.slug
  experienceLevel: text("experience_level"), // new | some | cs-student | intermediate | advanced
  dailyGoalMinutes: integer("daily_goal_minutes").default(20),
  editorTheme: text("editor_theme").default("dark"),
  appTheme: text("app_theme").default("dark"),
  aiTutorEnabled: boolean("ai_tutor_enabled").default(true),
  onboardedAt: timestamp("onboarded_at"),
});

// ---------------------------------------------------------------------------
// Content graph
// ---------------------------------------------------------------------------

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // language | web | database | ai-ml | ...
  difficulty: text("difficulty").notNull(), // intro | beginner | intermediate | advanced
  estimatedHours: real("estimated_hours").notNull().default(1),
  status: text("status").notNull().default("skeleton"), // built | skeleton
  description: text("description"),
  usefulFor: jsonb("useful_for").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skillDependencies = pgTable(
  "skill_dependencies",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    prerequisiteSkillId: uuid("prerequisite_skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.skillId, t.prerequisiteSkillId] })]
);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  order: integer("order").default(0),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  status: text("status").notNull().default("planned"), // built | planned
}, (t) => [uniqueIndex("modules_course_slug_idx").on(t.courseId, t.slug)]);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  contentPath: text("content_path").notNull(), // path under /content
  estimatedMinutes: integer("estimated_minutes").default(10),
  order: integer("order").notNull().default(0),
}, (t) => [uniqueIndex("lessons_module_slug_idx").on(t.moduleId, t.slug)]);

export const lessonBlocks = pgTable("lesson_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  blockKey: text("block_key").notNull(), // matches the `id` in MDX frontmatter
  type: text("type").notNull(), // explanation | codeExample | exercise | quiz | checkpoint | visualization | projectStep
  order: integer("order").notNull().default(0),
}, (t) => [uniqueIndex("lesson_blocks_lesson_key_idx").on(t.lessonId, t.blockKey)]);

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonBlockId: uuid("lesson_block_id").references(() => lessonBlocks.id, {
    onDelete: "cascade",
  }),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // write-code | fill-blank | fix-bug | predict-output |
  // code-ordering | multiple-choice | sql-query | refactor | performance |
  // build-feature | notebook-analysis | explain-code | cli-simulation |
  // git-simulation | interview
  language: text("language"), // python | javascript | typescript | sql | ...
  prompt: text("prompt").notNull(),
  starterCode: text("starter_code"),
  difficulty: text("difficulty").notNull().default("beginner"),
  concept: text("concept"), // SRS concept tag, e.g. "python-decorators"
});

export const testCases = pgTable("test_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  call: text("call"), // for code exercises: expression/call to evaluate
  expect: text("expect"), // expected stringified result
  optionIndex: integer("option_index"), // for multiple-choice: correct option
  order: integer("order").default(0),
});

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // bug-hunt | code-detective | code-sprint | daily-forge | interview
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  careerCategory: text("career_category"), // swe | ml | quant | data-science
});

export const datasets = pgTable("datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  source: text("source"),
  license: text("license"),
  filePath: text("file_path").notNull(),
  description: text("description"),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // mini | project | advanced | capstone
  skillId: uuid("skill_id").references(() => skills.id),
  overview: text("overview"),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  milestones: jsonb("milestones").$type<{ id: string; title: string }[]>().default([]),
  stretchGoals: jsonb("stretch_goals").$type<string[]>().default([]),
});

// ---------------------------------------------------------------------------
// Career tracks / roadmap
// ---------------------------------------------------------------------------

export const careerTracks = pgTable("career_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const careerTrackSkills = pgTable(
  "career_track_skills",
  {
    careerTrackId: uuid("career_track_id")
      .notNull()
      .references(() => careerTracks.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    stage: text("stage").notNull(), // Foundation | Math | Algorithms | Domain | Engineering | Projects | Interview Prep
    importance: real("importance").notNull().default(1), // weight in readiness calc
    order: integer("order").default(0),
  },
  (t) => [primaryKey({ columns: [t.careerTrackId, t.skillId] })]
);

// ---------------------------------------------------------------------------
// Progress & scoring
// ---------------------------------------------------------------------------

export const courseProgress = pgTable(
  "course_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("not-started"), // not-started | in-progress | completed
    percent: real("percent").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })]
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("not-started"),
    completedBlocks: jsonb("completed_blocks").$type<string[]>().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    passed: boolean("passed").notNull(),
    hintsUsed: integer("hints_used").notNull().default(0),
    timeSpentSeconds: integer("time_spent_seconds").default(0),
    code: text("code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("submissions_user_idx").on(t.userId), index("submissions_exercise_idx").on(t.exerciseId)]
);

export const skillRatings = pgTable(
  "skill_ratings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull().default(0), // 0-6
    lessonScore: real("lesson_score").notNull().default(0),
    accuracyScore: real("accuracy_score").notNull().default(0),
    assessmentScore: real("assessment_score").notNull().default(0),
    projectScore: real("project_score").notNull().default(0),
    retentionScore: real("retention_score").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })]
);

export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    source: text("source").notNull(), // lesson-block | exercise | challenge | project-milestone | assessment
    sourceId: text("source_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("xp_events_user_idx").on(t.userId)]
);

export const projectProgress = pgTable(
  "project_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("not-started"),
    completedMilestones: jsonb("completed_milestones").$type<string[]>().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId] })]
);

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull().default("diagnostic"), // diagnostic | certification
  topics: jsonb("topics").$type<string[]>().default([]), // skill slugs covered
});

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  detectedLevels: jsonb("detected_levels").$type<Record<string, number>>().default({}),
  score: real("score"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const reviewItems = pgTable(
  "review_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    concept: text("concept").notNull(),
    intervalDays: real("interval_days").notNull().default(1),
    easeFactor: real("ease_factor").notNull().default(2.5),
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
    dueAt: timestamp("due_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.concept] }), index("review_items_due_idx").on(t.dueAt)]
);

export const streaks = pgTable("streaks", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentLength: integer("current_length").notNull().default(0),
  longestLength: integer("longest_length").notNull().default(0),
  freezesAvailable: integer("freezes_available").notNull().default(2),
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  icon: text("icon"),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })]
);

// ---------------------------------------------------------------------------
// Notes, bookmarks, activity
// ---------------------------------------------------------------------------

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(), // lesson | challenge | project | visualization
  entityId: text("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").references(() => lessons.id),
  content: text("content").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snippets = pgTable("snippets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  language: text("language").notNull(),
  code: text("code").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    minutesLearned: integer("minutes_learned").notNull().default(0),
    exercisesCompleted: integer("exercises_completed").notNull().default(0),
  },
  (t) => [uniqueIndex("activity_user_date_idx").on(t.userId, t.date)]
);

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").references(() => lessons.id),
  messages: jsonb("messages").$type<{ role: string; content: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hintUsage = pgTable("hint_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1-4, 5 = revealed solution
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations (for query ergonomics)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  streak: one(streaks, { fields: [users.id], references: [streaks.userId] }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  skill: one(skills, { fields: [courses.skillId], references: [skills.id] }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  blocks: many(lessonBlocks),
}));

export const lessonBlocksRelations = relations(lessonBlocks, ({ one, many }) => ({
  lesson: one(lessons, { fields: [lessonBlocks.lessonId], references: [lessons.id] }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  lessonBlock: one(lessonBlocks, {
    fields: [exercises.lessonBlockId],
    references: [lessonBlocks.id],
  }),
  testCases: many(testCases),
}));
