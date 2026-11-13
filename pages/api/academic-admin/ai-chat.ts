import type { NextApiRequest, NextApiResponse } from "next";

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text: string;
}

interface ChatRequestPayload {
  message: string;
  history?: ChatTurn[];
  scope: "OVERALL" | "DEPARTMENT" | "COURSE" | "CLASS";
  scopeLabel: string;
  mode: "CIA" | "MCQ";
  targetBenchmark: number;
  metrics?: {
    scorePct: number;
    participationPct?: number;
    kLevels?: Record<string, number>;
    pushingUp?: Array<{ course_code: string; course_name: string; attainment_pct: number }>;
    pullingDown?: Array<{ course_code: string; course_name: string; attainment_pct: number }>;
    classrooms?: Array<{ name: string; faculty_name: string; score: number; baseline_diff?: number }>;
  };
}

// In-memory conversation state for session continuity
const serverChatSessions: Record<string, ChatTurn[]> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    const sessionId = (req.query.sessionId as string) || "default";
    delete serverChatSessions[sessionId];
    return res.status(200).json({ success: true, message: "Session memory cleared" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const payload = req.body as ChatRequestPayload;
    const { message, history = [], scope, scopeLabel, mode, targetBenchmark, metrics } = payload;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const isMcq = mode === "MCQ";
    const scoreWord = isMcq ? "score" : "attainment";
    const ScoreWord = isMcq ? "Score" : "Attainment";

    const currentScore = metrics?.scorePct ?? 72.0;
    const diff = Number((currentScore - targetBenchmark).toFixed(1));
    const kLevels = metrics?.kLevels || { K1: 76, K2: 70, K3: 58, K4: 62, K5: 54, K6: 48 };
    const pushingUp = metrics?.pushingUp || [];
    const pullingDown = metrics?.pullingDown || [];

    const lowerQuery = message.toLowerCase();

    let responseText = "";

    // ── 1. Anomaly & Outlier Queries ──
    if (
      lowerQuery.includes("outlier") ||
      lowerQuery.includes("abnormal") ||
      lowerQuery.includes("divergen") ||
      lowerQuery.includes("struggl") ||
      lowerQuery.includes("falling") ||
      lowerQuery.includes("failing")
    ) {
      responseText = `### 🚨 Outlier & Performance Divergence Analysis for **${scopeLabel}**

Based on current **${mode}** records against the **${targetBenchmark}% target**:

1. **Current Standing**:
   - Institutional Score: **${currentScore}%** (${diff >= 0 ? `+${diff}% above` : `${diff}% below`} target).
   - High Performing Units: **${pushingUp.length}** courses/sections.
   - Lagging Behind Target: **${pullingDown.length}** courses/sections.

2. **Key Identified Divergence Points**:
   ${
     pullingDown.length > 0
       ? pullingDown
           .slice(0, 3)
           .map(
             (c) =>
               `- **${c.course_code} (${c.course_name})**: Currently at **${c.attainment_pct}%**, lagging by **${(
                 targetBenchmark - c.attainment_pct
               ).toFixed(1)}%** below benchmark.`
           )
           .join("\n   ")
       : `- No critical course drops identified below ${targetBenchmark}%. All evaluated units are meeting the threshold.`
   }

3. **Classroom Variance & Faculty Spread**:
   - In courses with multiple sections, variance greater than **10%** between parallel classrooms indicates pedagogical differences rather than curriculum difficulty.
   - Sections showing steep drops typically experience lower attendance and delayed feedback on internal milestones.

4. **Recommended Administrative Action**:
   - Schedule a **Mistake Pattern Review** with faculties handling sections below ${targetBenchmark}%.
   - Pair struggling sections with high-attaining peer faculty for collaborative lesson planning and shared question banks.`;
    }
    // ── 2. Cognitive Bloom Levels (K1 - K6) ──
    else if (
      lowerQuery.includes("bloom") ||
      lowerQuery.includes("cognitive") ||
      lowerQuery.includes("k1") ||
      lowerQuery.includes("k2") ||
      lowerQuery.includes("k3") ||
      lowerQuery.includes("k4") ||
      lowerQuery.includes("k5") ||
      lowerQuery.includes("k6")
    ) {
      responseText = `### 🧠 Cognitive Mastery & Bloom's Taxonomy Diagnosis for **${scopeLabel}**

Here is the cognitive mastery breakdown across the six Bloom's levels:

| Level | Cognitive Domain | Current ${ScoreWord} | Target | Status |
| :--- | :--- | :---: | :---: | :---: |
| **K1** | Remember (Recall facts) | **${kLevels.K1 || 76}%** | ${targetBenchmark}% | ${
        (kLevels.K1 || 76) >= targetBenchmark ? "✅ On Target" : "⚠️ Lagging"
      } |
| **K2** | Understand (Explain concepts) | **${kLevels.K2 || 70}%** | ${targetBenchmark}% | ${
        (kLevels.K2 || 70) >= targetBenchmark ? "✅ On Target" : "⚠️ Lagging"
      } |
| **K3** | Apply (Use in practical cases) | **${kLevels.K3 || 58}%** | ${targetBenchmark}% | ${
        (kLevels.K3 || 58) >= targetBenchmark ? "✅ On Target" : "🚨 Bottleneck"
      } |
| **K4** | Analyze (Breakdown & relate) | **${kLevels.K4 || 62}%** | ${targetBenchmark}% | ${
        (kLevels.K4 || 62) >= targetBenchmark ? "✅ On Target" : "⚠️ Needs Focus"
      } |
| **K5** | Evaluate (Critique & assess) | **${kLevels.K5 || 54}%** | ${targetBenchmark}% | ${
        (kLevels.K5 || 54) >= targetBenchmark ? "✅ On Target" : "🚨 Critical Gap"
      } |
| **K6** | Create (Synthesize & design) | **${kLevels.K6 || 48}%** | ${targetBenchmark}% | ${
        (kLevels.K6 || 48) >= targetBenchmark ? "✅ On Target" : "🚨 Critical Gap"
      } |

#### 🔍 Root-Cause Takeaways:
- **Foundational Retention is Solid**: Students demonstrate high grasp on K1/K2 (average **${Math.round(
        ((kLevels.K1 || 76) + (kLevels.K2 || 70)) / 2
      )}%**), meaning rote memorization and direct recall are functional.
- **The Application Drop (K3 & K5)**: Attainment drops significantly when students are asked to solve un-seen numerical problems, debug scenarios, or design systems.

#### 💡 Targeted Interventions:
1. Shift 20 minutes of lectures toward **live guided problem solving** instead of slide presentations.
2. Provide **Bloom-aligned sample question templates** so students become familiar with phrasing at K3/K4 before high-stakes exams.`;
    }
    // ── 3. Multi-Course & Classroom Drops ──
    else if (
      lowerQuery.includes("multi") ||
      lowerQuery.includes("classroom") ||
      lowerQuery.includes("cohort") ||
      lowerQuery.includes("section")
    ) {
      responseText = `### 🏫 Classroom Cohort & Multi-Course Performance for **${scopeLabel}**

#### Cohort Consistency Overview:
- When examining classroom cohorts taking 5 to 6 simultaneous subjects, **abnormal course-specific drops** occur when:
  1. A class cohort maintains **>75%** in most theory subjects but plummets to **<50%** in analytical/mathematical courses.
  2. High student absenteeism coincides with heavy lab schedules or early morning periods.

#### Diagnostic Checklist:
- **Syllabus Pacing Divergence**: Check if individual faculty members are racing through foundational modules to cover syllabus timelines.
- **Test Paper Calibration**: Verify that internal question papers across sections maintain identical difficulty distributions rather than teacher-specific bias.

#### Recommended Action:
- Convene a short 15-minute sync with class representatives and course instructors for cohorts showing dual-course dips.
- Implement weekly 30-minute peer-assisted doubt clearance circles.`;
    }
    // ── 4. Faculty & Teaching Effectiveness ──
    else if (
      lowerQuery.includes("teacher") ||
      lowerQuery.includes("faculty") ||
      lowerQuery.includes("teaching") ||
      lowerQuery.includes("pedagogy") ||
      lowerQuery.includes("instructor")
    ) {
      responseText = `### 👨‍🏫 Faculty Effectiveness & Pedagogical Guidance for **${scopeLabel}**

#### Observations from Scope:
- Top performing teachers achieve high ${scoreWord} percentages by employing **frequent formative checks** (2-minute micro quizzes at the end of class) and **active code/problem walkthroughs**.
- Sections experiencing dips often suffer from passive lecture delivery where students do not get sufficient hands-on engagement during contact hours.

#### Practical Faculty Support Recommendations:
1. **Peer Faculty Co-Teaching**:
   - Encourage instructors of parallel sections to swap one guest lecture per month to share best-in-class explanation methods.
2. **Standardized Rubrics**:
   - Ensure assessment criteria are published in advance so students understand scoring benchmarks.
3. **Praise & Recognition**:
   - Recognize high-attaining faculty at the departmental review to encourage knowledge transfer.`;
    }
    // ── 5. General Performance Overview ──
    else if (
      lowerQuery.includes("overview") ||
      lowerQuery.includes("summary") ||
      lowerQuery.includes("how is") ||
      lowerQuery.includes("status") ||
      lowerQuery.includes("perform")
    ) {
      responseText = `### 📊 Executive Performance Overview for **${scopeLabel}**

- **Evaluation Mode**: **${mode}**
- **Benchmark Target**: **${targetBenchmark}%**
- **Current Average ${ScoreWord}**: **${currentScore}%**
- **Performance Delta**: **${diff >= 0 ? `+${diff}%` : `${diff}%`}** vs institutional goal

#### Key Scope Highlights:
- **Courses Pushing Up**: **${pushingUp.length}** courses are exceeding the ${targetBenchmark}% standard.
- **Courses Requiring Attention**: **${pullingDown.length}** courses are currently below target.
- **Cognitive Profile**: Strong foundational mastery (**K1: ${kLevels.K1 || 76}%**, **K2: ${kLevels.K2 || 70}%**), with primary growth opportunity in higher-order application (**K3: ${kLevels.K3 || 58}%**, **K5: ${kLevels.K5 || 54}%**).

#### Quick Inquiries You Can Ask:
- *"Which courses are pulling down the average?"*
- *"Show me K1-K6 Bloom's gaps"*
- *"What are the recommended pedagogical steps for struggling teachers?"*
- *"Generate the full 6-point action plan"*`;
    }
    // ── 6. Fallback General Analytical Response ──
    else {
      responseText = `### 💡 Academic Analytics Insights for **${scopeLabel}**

Regarding your query: *"**${message}**"*

1. **Current Standing in Context**:
   - Under **${mode}** assessment at a **${targetBenchmark}%** target benchmark, the current attainment stands at **${currentScore}%**.
   - ${
     diff >= 0
       ? `Performance is **healthy** and currently tracking **${diff}%** ahead of the target standard.`
       : `Performance requires **strategic monitoring**, currently trailing the goal by **${Math.abs(diff)}%**.`
   }

2. **Data-Driven Observations**:
   - Evaluated units demonstrate consistent grasp on fundamental knowledge (**K1/K2**), while critical divergence emerges in analytical problem solving (**K3/K4**).
   - High-variance classrooms within the same course indicate that instructional delivery method is the leading driver of outcome differences.

3. **Immediate Recommended Next Steps**:
   - **Targeted Tutorials**: Provide supplementary tutorials for students scoring in the bottom quartile.
   - **Cross-Section Calibration**: Review recent assessment papers to ensure uniform evaluation rubrics across sections.
   - **Continuous Feedback**: Conduct a mid-semester feedback check with student class representatives to address pacing issues early.

*Feel free to ask for specific course breakdowns, cognitive gaps, or the complete 6-point action plan.*`;
    }

    const assistantMsg: ChatTurn = {
      id: `asst-${Date.now()}`,
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: responseText,
    };

    return res.status(200).json({
      success: true,
      message: assistantMsg,
    });
  } catch (error: any) {
    console.error("AI Chat API error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
}

