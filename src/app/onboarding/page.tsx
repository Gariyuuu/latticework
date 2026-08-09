"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";

const EXPERIENCE_LEVELS = [
  { value: "new", label: "New to coding" },
  { value: "some", label: "Some experience" },
  { value: "cs-student", label: "CS/student level" },
  { value: "intermediate", label: "Intermediate programmer" },
  { value: "advanced", label: "Advanced student" },
];

const TIME_GOALS = [10, 20, 30, 60];

const DIAGNOSTIC_QUESTIONS = [
  { q: "What does `len([1, 2, 3])` return?", options: ["3", "2", "Error", "None"], answer: 0 },
  { q: "Which keyword defines a function in Python?", options: ["func", "def", "function", "lambda only"], answer: 1 },
  { q: "What is `10 // 3` in Python?", options: ["3.33", "3", "1", "3.0"], answer: 1 },
  { q: "What does `range(3)` produce when iterated?", options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3"], answer: 1 },
  { q: "What does a function return if it has no `return` statement?", options: ["0", "None", "Error", "Empty string"], answer: 1 },
];

type Step = "familiar" | "experience" | "goal" | "time" | "diagnostic" | "summary";
const STEPS: Step[] = ["familiar", "experience", "goal", "time", "diagnostic", "summary"];

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const step = STEPS[stepIndex];

  const [familiar, setFamiliar] = React.useState<Set<string>>(new Set());
  const [experience, setExperience] = React.useState("");
  const [careerGoal, setCareerGoal] = React.useState("");
  const [dailyGoal, setDailyGoal] = React.useState(20);
  const [answers, setAnswers] = React.useState<(number | null)[]>(Array(DIAGNOSTIC_QUESTIONS.length).fill(null));
  const [saving, setSaving] = React.useState(false);

  const track = CAREER_TRACKS.find((t) => t.slug === careerGoal);
  const correctCount = answers.filter((a, i) => a === DIAGNOSTIC_QUESTIONS[i].answer).length;
  const detectedPythonLevel = Math.min(6, Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 6));

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerGoal: careerGoal || undefined,
          experienceLevel: experience || undefined,
          dailyGoalMinutes: dailyGoal,
          markOnboarded: true,
        }),
      });
      await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentSlug: "onboarding-diagnostic",
          topics: ["python"],
          detectedLevels: { python: detectedPythonLevel },
          score: correctCount / DIAGNOSTIC_QUESTIONS.length,
        }),
      });
    } finally {
      router.push("/dashboard");
    }
  }

  const recommendedFirst = track?.skills.filter((s) => s.stage === track.skills[0]?.stage).slice(0, 5) ?? [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Layers className="size-5 text-primary" />
          <span className="font-semibold">Latticework</span>
        </div>

        <Card className="p-6">
          {step === "familiar" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">What already sounds familiar?</h1>
              <div className="grid grid-cols-2 gap-2">
                {["Python", "Java", "C++", "JavaScript", "SQL", "R", "Git", "Linux", "Machine Learning", "Statistics", "None"].map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() =>
                        setFamiliar((prev) => {
                          const next = new Set(prev);
                          if (next.has(opt)) next.delete(opt);
                          else next.add(opt);
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-sm",
                        familiar.has(opt) ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>
              <Button onClick={next} className="w-full">
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === "experience" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">How would you describe yourself?</h1>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setExperience(l.value)}
                    className={cn(
                      "block w-full rounded-lg border px-3 py-2 text-left text-sm",
                      experience === l.value ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <Button onClick={next} className="w-full" disabled={!experience}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === "goal" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">What do you want to become?</h1>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {CAREER_TRACKS.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => setCareerGoal(t.slug)}
                    className={cn(
                      "block w-full rounded-lg border px-3 py-2 text-left text-sm",
                      careerGoal === t.slug ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    <span className="font-medium">{t.name}</span>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </button>
                ))}
              </div>
              <Button onClick={next} className="w-full" disabled={!careerGoal}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === "time" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">How much time do you want to study?</h1>
              <div className="grid grid-cols-2 gap-2">
                {TIME_GOALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setDailyGoal(m)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-sm",
                      dailyGoal === m ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    {m} min/day
                  </button>
                ))}
              </div>
              <Button onClick={next} className="w-full">
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === "diagnostic" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">Quick Python check</h1>
              <p className="text-xs text-muted-foreground">
                5 questions. Other topics (SQL, algorithms, math…) aren&apos;t assessed yet — planned.
              </p>
              <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                {DIAGNOSTIC_QUESTIONS.map((q, qi) => (
                  <div key={qi}>
                    <p className="mb-1.5 text-sm font-medium">{q.q}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() =>
                            setAnswers((prev) => {
                              const next = [...prev];
                              next[qi] = oi;
                              return next;
                            })
                          }
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-xs",
                            answers[qi] === oi ? "border-primary bg-primary/10" : "border-border"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={next} className="w-full" disabled={answers.some((a) => a === null)}>
                See my roadmap <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === "summary" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-2 size-8 text-forge-success" />
                <h1 className="text-lg font-semibold">Your roadmap is ready</h1>
                <p className="text-sm text-muted-foreground">Goal: {track?.name}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Python detected level: {detectedPythonLevel}/6
                </p>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommended first skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedFirst.map((s) => (
                    <Badge key={s.slug} variant="secondary">
                      {s.slug}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={finish} className="w-full" disabled={saving}>
                {saving ? "Setting up…" : "Start first lesson"} <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
