"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";

const EXPERIENCE_LEVELS = [
  { value: "new", label: "New to coding" },
  { value: "some", label: "Some experience" },
  { value: "cs-student", label: "CS/student level" },
  { value: "intermediate", label: "Intermediate programmer" },
  { value: "advanced", label: "Advanced student" },
];

interface Initial {
  careerGoal: string;
  experienceLevel: string;
  dailyGoalMinutes: number;
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const [careerGoal, setCareerGoal] = React.useState(initial.careerGoal);
  const [experienceLevel, setExperienceLevel] = React.useState(initial.experienceLevel);
  const [dailyGoalMinutes, setDailyGoalMinutes] = React.useState(initial.dailyGoalMinutes);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerGoal: careerGoal || undefined,
          experienceLevel: experienceLevel || undefined,
          dailyGoalMinutes,
        }),
      });
      if (res.ok) toast.success("Settings saved");
      else toast.error("Couldn't save — is DATABASE_URL configured?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Career goal</Label>
        <Select value={careerGoal} onValueChange={setCareerGoal}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a career goal" />
          </SelectTrigger>
          <SelectContent>
            {CAREER_TRACKS.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Experience level</Label>
        <Select value={experienceLevel} onValueChange={setExperienceLevel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Describe yourself" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_LEVELS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Daily goal (minutes)</Label>
        <Input
          type="number"
          min={5}
          max={240}
          value={dailyGoalMinutes}
          onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
        />
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
