const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class StudentGradeTracker {
  constructor() {
    this.students = [];
  }

  addStudent(name, scores) {
    if (!name || name.trim() === "") {
      throw new Error("Student name cannot be empty.");
    }

    const validScores = scores.map(Number);

    if (validScores.some(score => isNaN(score))) {
      throw new Error("All scores must be valid numbers.");
    }

    this.students.push({
      name: name.trim(),
      scores: validScores
    });
  }

  getAverage(scores) {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, score) => sum + score, 0);
    return total / scores.length;
  }

  getHighest(scores) {
    if (scores.length === 0) return 0;
    return Math.max(...scores);
  }

  getLowest(scores) {
    if (scores.length === 0) return 0;
    return Math.min(...scores);
  }

  getOverallAverage() {
    if (this.students.length === 0) return 0;

    let allScores = [];
    this.students.forEach(student => {
      allScores = allScores.concat(student.scores);
    });

    return this.getAverage(allScores);
  }

  displaySummary() {
    if (this.students.length === 0) {
      console.log("\nNo student records available.");
      return;
    }

    console.log("\n========== STUDENT GRADE SUMMARY ==========");
    console.log("Name\t\tScores\t\tAverage\tHighest\tLowest");

    this.students.forEach(student => {
      const avg = this.getAverage(student.scores);
      const high = this.getHighest(student.scores);
      const low = this.getLowest(student.scores);

      console.log(
        `${student.name}\t\t${student.scores.join(", ")}\t${avg.toFixed(2)}\t${high}\t${low}`
      );
    });

    console.log("==========================================");
    console.log(`Overall Class Average: ${this.getOverallAverage().toFixed(2)}`);
  }
}

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

async function main() {
  const tracker = new StudentGradeTracker();

  const totalStudents = parseInt(await askQuestion("Enter number of students: "), 10);

  if (isNaN(totalStudents) || totalStudents <= 0) {
    console.log("Please enter a valid number greater than 0.");
    rl.close();
    return;
  }

  for (let i = 1; i <= totalStudents; i++) {
    const name = await askQuestion(`\nEnter student ${i} name: `);
    const subjectCount = parseInt(await askQuestion("Enter number of scores for this student: "), 10);

    if (isNaN(subjectCount) || subjectCount <= 0) {
      console.log("Please enter a valid number of scores greater than 0.");
      rl.close();
      return;
    }

    let scores = [];

    for (let j = 1; j <= subjectCount; j++) {
      const score = parseFloat(await askQuestion(`Enter score ${j}: `));
      if (isNaN(score)) {
        console.log("Invalid score entered. Please enter a number.");
        rl.close();
        return;
      }
      scores.push(score);
    }

    try {
      tracker.addStudent(name, scores);
    } catch (error) {
      console.log(error.message);
      rl.close();
      return;
    }
  }

  tracker.displaySummary();

  rl.close();
}

main();
