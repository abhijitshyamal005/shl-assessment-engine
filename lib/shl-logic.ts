export type Assessment = {
  id: string;
  name: string;
  category: "Cognitive" | "Behavioral" | "Skill" | "Simulation";
  duration: string;
  description: string;
};

const SHL_CATALOGUE: Record<string, Assessment> = {
  verify_g: { id: "1", name: "Verify Interactive G+", category: "Cognitive", duration: "24 mins", description: "General ability and learning agility." },
  verify_num: { id: "2", name: "Verify Numerical", category: "Cognitive", duration: "15 mins", description: "Data interpretation and budget analysis." },
  verify_deduct: { id: "3", name: "Verify Deductive", category: "Cognitive", duration: "18 mins", description: "Logic, troubleshooting, and problem solving." },
  opq32: { id: "4", name: "OPQ32r", category: "Behavioral", duration: "25 mins", description: "Workplace personality and preferred style." },
  opq_lead: { id: "5", name: "OPQ Leadership Report", category: "Behavioral", duration: "N/A", description: "Leadership potential and strategic fit." },
  sjt_grad: { id: "6", name: "Graduate SJT", category: "Simulation", duration: "20 mins", description: "Situational judgement for early careers." },
  coding_sim: { id: "7", name: "Coding Simulation", category: "Skill", duration: "60 mins", description: "Hands-on coding (Java/Python)." },
  motivation: { id: "8", name: "Motivation Questionnaire", category: "Behavioral", duration: "15 mins", description: "Drivers, engagement, and retention factors." },
};

export function generateRecommendation(level: string, role: string): Assessment[] {
  let bundle: Assessment[] = [];

  // 1. Level Logic
  if (level === "entry") {
    bundle.push(SHL_CATALOGUE.sjt_grad);
    bundle.push(SHL_CATALOGUE.verify_g);
  } else if (level === "mid") {
    bundle.push(SHL_CATALOGUE.opq32);
  } else if (level === "senior") {
    bundle.push(SHL_CATALOGUE.opq_lead);
    bundle.push(SHL_CATALOGUE.motivation);
  }

  // 2. Role Logic
  if (role === "tech") {
    bundle.push(SHL_CATALOGUE.verify_deduct);
    bundle.push(SHL_CATALOGUE.coding_sim);
  } else if (role === "finance") {
    bundle.push(SHL_CATALOGUE.verify_num);
    // Add general ability if not already present
    if (!bundle.find(x => x.id === SHL_CATALOGUE.verify_g.id)) {
      bundle.push(SHL_CATALOGUE.verify_g);
    }
  }

  return [...new Set(bundle)];
}