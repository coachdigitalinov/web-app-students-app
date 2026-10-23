import bcrypt from "bcryptjs";
import type Database from "better-sqlite3";

/**
 * Seeds a rich, realistic demo set so every page is populated out of the box.
 * Runs once when the users table is empty (in-memory DB on Vercel re-seeds on
 * every cold start, so demo accounts are always available).
 */
export function seedDemo(db: Database.Database) {
  const demoHash = bcrypt.hashSync("demo12345", 10);
  const adminHash = bcrypt.hashSync("demo12345", 10);
  const now = Date.now();
  const dayMs = 86_400_000;
  const iso = (ms: number) => new Date(ms).toISOString();

  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (name, email, password_hash, role, school, grade, referral_code, referred_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  const insertWorksheet = db.prepare(
    "INSERT INTO worksheets (title, subject, description, grade, file_path, mime, created_at) VALUES (?,?,?,?,?,?,?)",
  );
  const insertTest = db.prepare(
    "INSERT INTO tests (title, subject, instructions, total_marks, duration_minutes, grade, paper_path, paper_mime, published, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  );
  const insertAttempt = db.prepare(
    "INSERT INTO attempts (test_id, student_id, started_at, deadline_at, submitted_at, late, status, assigned_teacher_id, corrected_by, corrected_at, marks, mistakes, weak_areas, feedback, suggestions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  );
  const insertAttemptFile = db.prepare(
    "INSERT INTO attempt_files (attempt_id, file_path, mime, original_name) VALUES (?,?,?,?)",
  );
  const insertSchoolTest = db.prepare(
    "INSERT INTO school_tests (student_id, name, subject, marks, total, taken_on, added_by) VALUES (?,?,?,?,?,?,?)",
  );
  const insertPayment = db.prepare(
    "INSERT INTO payments (teacher_id, student_id, amount, note, status, created_at, paid_at) VALUES (?,?,?,?,?,?,?)",
  );

  db.transaction(() => {
    // Admin demo account (login-friendly).
    insertUser.run("Demo Admin", "admin@demo.local", adminHash, "admin", null, null, null, null, iso(now - 90 * dayMs));

    // Teachers.
    const teachers: Array<[string, string, string, string]> = [
      ["Alex Hale", "teacher@demo.local", "Oakridge School", "T000001"],
      ["Priya Rao", "priya@demo.local", "Horizon Academy", "T000002"],
      ["Noah Lee", "noah@demo.local", "Oakridge School", "T000003"],
    ];
    const teacherIds: number[] = [];
    for (const [name, email, school, code] of teachers) {
      const r = insertUser.run(name, email, demoHash, "teacher", school, null, code, null, iso(now - 60 * dayMs));
      teacherIds.push(Number(r.lastInsertRowid));
    }

    // Students.
    const students: Array<[string, string, string, string, number | null]> = [
      ["Sam Student", "student@demo.local", "Oakridge School", "10", teacherIds[0]],
      ["Mia Chen", "mia@demo.local", "Oakridge School", "10", teacherIds[0]],
      ["Ravi Kumar", "ravi@demo.local", "Horizon Academy", "10", teacherIds[1]],
      ["Zara Khan", "zara@demo.local", "Oakridge School", "9", teacherIds[0]],
      ["Ethan Park", "ethan@demo.local", "Sunrise Public", "11", teacherIds[2]],
      ["Lila Mehta", "lila@demo.local", "Horizon Academy", "10", teacherIds[1]],
      ["Owen Wright", "owen@demo.local", "Oakridge School", "9", teacherIds[2]],
      ["Nia Oyelowo", "nia@demo.local", "Sunrise Public", "11", null],
      ["Kai Tanaka", "kai@demo.local", "Oakridge School", "10", teacherIds[0]],
      ["Anya Volkov", "anya@demo.local", "Horizon Academy", "11", teacherIds[1]],
    ];
    const studentIds: number[] = [];
    for (let i = 0; i < students.length; i++) {
      const [name, email, school, grade, ref] = students[i];
      const r = insertUser.run(name, email, demoHash, "student", school, grade, null, ref, iso(now - (40 - i * 3) * dayMs));
      studentIds.push(Number(r.lastInsertRowid));
    }

    // Worksheets.
    const worksheets: Array<[string, string, string, string | null]> = [
      ["Algebra Essentials", "Maths", "Linear equations, factoring, polynomials.", "10"],
      ["Reading Comprehension Pack 1", "English", "Four short passages with inference questions.", null],
      ["Chemistry: Mole Concept", "Science", "Avogadro's number, mass-mole conversions.", "11"],
      ["Grammar Drills: Tenses", "English", "Mixed-tense fill-in-the-blank and rewrites.", "9"],
      ["Trigonometry Starter", "Maths", "Sine, cosine, tangent — basic identities.", "10"],
      ["Physics: Motion & Forces", "Science", "Kinematics equations, Newton's laws.", "11"],
    ];
    for (let i = 0; i < worksheets.length; i++) {
      const [t, s, d, g] = worksheets[i];
      insertWorksheet.run(t, s, d, g, `seed:ws-${i + 1}.pdf`, "application/pdf", iso(now - (30 - i * 2) * dayMs));
    }

    // Tests.
    const tests: Array<[string, string, string, number, number, string | null]> = [
      ["Algebra Weekly Quiz", "Maths", "Covers chapters 1–3. Show your working.", 50, 45, "10"],
      ["Reading Comprehension Test", "English", "Read each passage carefully before answering.", 40, 30, null],
      ["Chemistry Mock", "Science", "Mock paper matching your school syllabus.", 60, 60, "11"],
      ["Grammar Diagnostic", "English", "Tests your grammar baseline.", 30, 25, "9"],
      ["Trigonometry Checkpoint", "Maths", "Short-answer problems.", 40, 40, "10"],
      ["Physics Term Paper", "Science", "Full-length term paper.", 70, 90, "11"],
    ];
    const testIds: number[] = [];
    for (let i = 0; i < tests.length; i++) {
      const [t, s, ins, marks, dur, g] = tests[i];
      const r = insertTest.run(t, s, ins, marks, dur, g, `seed:paper-${i + 1}.pdf`, "application/pdf", 1, iso(now - (25 - i * 3) * dayMs));
      testIds.push(Number(r.lastInsertRowid));
    }

    // Attempts — a believable mix across students, teachers, and statuses.
    // Each tuple: [testIdx, studentIdx, status, daysAgo, marksOutOfTotal, teacherIdx]
    const attempts: Array<[number, number, "in_progress" | "submitted" | "corrected", number, number | null, number]> = [
      [0, 0, "corrected", 20, 0.78, 0], // Sam Algebra 78%
      [1, 0, "corrected", 15, 0.85, 0], // Sam Reading 85%
      [4, 0, "corrected", 10, 0.72, 0], // Sam Trig 72%
      [2, 0, "submitted",  1, null, 0], // Sam Chemistry awaiting (unique pair)
      [2, 4, "corrected", 12, 0.65, 2], // Ethan Chemistry 65%
      [5, 4, "submitted",  2, null, 2], // Ethan Physics awaiting
      [0, 1, "corrected", 18, 0.90, 0], // Mia Algebra 90%
      [1, 1, "corrected", 11, 0.75, 0], // Mia Reading 75%
      [4, 1, "in_progress", 0, null, 0], // Mia Trig in-progress
      [0, 2, "corrected", 14, 0.60, 1], // Ravi Algebra 60%
      [1, 2, "corrected",  7, 0.68, 1], // Ravi Reading 68%
      [3, 3, "corrected", 10, 0.92, 0], // Zara Grammar 92%
      [1, 3, "submitted",  2, null, 0], // Zara Reading awaiting
      [2, 9, "corrected",  8, 0.70, 1], // Anya Chemistry 70%
      [5, 9, "corrected",  3, 0.82, 1], // Anya Physics 82%
      [0, 5, "corrected",  6, 0.74, 1], // Lila Algebra 74%
      [4, 8, "submitted",  1, null, 0], // Kai Trig awaiting
      [3, 6, "corrected",  9, 0.86, 2], // Owen Grammar 86%
      [1, 7, "corrected",  4, 0.70, 0], // Nia Reading 70%
    ];

    for (const [ti, si, status, daysAgo, markRatio, tiTeacher] of attempts) {
      const started = now - daysAgo * dayMs - 60 * 60_000;
      const [, , , marks, dur] = tests[ti];
      const deadline = started + dur * 60_000;
      const submitted = status === "in_progress" ? null : started + 30 * 60_000;
      const corrected = status === "corrected" ? now - (daysAgo - 1) * dayMs : null;
      const teacherId = teacherIds[tiTeacher];
      const r = insertAttempt.run(
        testIds[ti],
        studentIds[si],
        iso(started),
        iso(deadline),
        submitted ? iso(submitted) : null,
        0,
        status,
        teacherId,
        status === "corrected" ? teacherId : null,
        corrected ? iso(corrected) : null,
        markRatio !== null ? Math.round(markRatio * marks * 10) / 10 : null,
        status === "corrected" ? "Q3 sign slip, Q7 skipped last step" : null,
        status === "corrected" ? pickWeakAreas(ti) : null,
        status === "corrected" ? "Clear improvement over last attempt. Keep going." : null,
        status === "corrected" ? "Revisit the worksheet on this chapter before next test." : null,
      );
      if (status !== "in_progress") {
        insertAttemptFile.run(Number(r.lastInsertRowid), `seed:answer-${r.lastInsertRowid}.pdf`, "application/pdf", "answer-sheet.pdf");
      }
    }

    // School-test records (student self or teacher-added).
    const schoolTests: Array<[number, string, string, number, number, number]> = [
      [0, "Term 1 Maths", "Maths", 72, 100, 25],
      [0, "Term 1 English", "English", 81, 100, 25],
      [0, "Term 1 Science", "Science", 68, 100, 25],
      [1, "Term 1 Maths", "Maths", 88, 100, 24],
      [2, "Term 1 Maths", "Maths", 55, 100, 22],
      [4, "Mid-term Physics", "Science", 74, 100, 15],
      [9, "Term 1 Chemistry", "Science", 79, 100, 16],
      [3, "Grammar check", "English", 92, 100, 20],
    ];
    for (const [si, name, subj, marks, total, daysAgo] of schoolTests) {
      insertSchoolTest.run(studentIds[si], name, subj, marks, total, iso(now - daysAgo * dayMs).slice(0, 10), teacherIds[0]);
    }

    // Payments — pending + paid mix.
    const payments: Array<[number, number | null, number, string, "pending" | "paid", number, number | null]> = [
      [0, 0, 500, "Referral fee", "paid", 40, 32],
      [0, 1, 500, "Referral fee", "paid", 38, 30],
      [0, 3, 500, "Referral fee", "pending", 20, null],
      [0, 8, 500, "Referral fee", "pending", 10, null],
      [1, 2, 500, "Referral fee", "paid", 35, 28],
      [1, 5, 500, "Referral fee", "pending", 15, null],
      [1, 9, 500, "Referral fee", "pending", 5, null],
      [2, 4, 500, "Referral fee", "paid", 30, 22],
      [2, 6, 500, "Referral fee", "pending", 12, null],
      [0, null, 1500, "Bonus — top referrer Q1", "paid", 25, 20],
    ];
    for (const [tiTeacher, siStudent, amount, note, status, daysAgo, paidDaysAgo] of payments) {
      insertPayment.run(
        teacherIds[tiTeacher],
        siStudent !== null ? studentIds[siStudent] : null,
        amount,
        note,
        status,
        iso(now - daysAgo * dayMs),
        paidDaysAgo !== null ? iso(now - paidDaysAgo * dayMs) : null,
      );
    }
  })();
}

function pickWeakAreas(ti: number) {
  const map: Record<number, string> = {
    0: "Factoring, Quadratics",
    1: "Inference, Vocabulary",
    2: "Mole calculations",
    3: "Past perfect, Conditionals",
    4: "Identities, Angle sum",
    5: "Projectile motion",
  };
  return map[ti] ?? "General revision";
}
