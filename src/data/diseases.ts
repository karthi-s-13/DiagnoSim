export const DISEASE_DATA = [
  {
    name: "Dengue",
    category: "Infectious",
    symptoms: ["High fever", "Severe headache", "Pain behind eyes", "Joint and muscle pain", "Rash"],
    risk_factors: ["Tropical climate", "Stagnant water", "Lack of mosquito protection"],
    tests: ["CBC (Platelet count)", "Dengue NS1 Antigen", "IgM/IgG Antibody"],
    treatment: "Hydration, pain relief (avoid NSAIDs), monitoring for warning signs.",
    pearl: "Watch for 'warning signs' like abdominal pain or persistent vomiting during the afebrile phase."
  },
  {
    name: "Malaria",
    category: "Infectious",
    symptoms: ["Fever with chills", "Sweating", "Headache", "Nausea", "Fatigue"],
    risk_factors: ["Mosquito-prone areas", "Lack of bed nets", "Travel to endemic regions"],
    tests: ["Blood Smear (MP)", "Rapid Diagnostic Test (RDT)"],
    treatment: "Antimalarial drugs (ACTs), supportive care.",
    pearl: "P. falciparum can cause cerebral malaria; always check for altered consciousness."
  },
  {
    name: "Typhoid",
    category: "Infectious",
    symptoms: ["Sustained high fever", "Weakness", "Stomach pain", "Headache", "Loss of appetite"],
    risk_factors: ["Contaminated food/water", "Poor sanitation", "Close contact with carriers"],
    tests: ["Widal Test", "Blood Culture", "Typhidot"],
    treatment: "Antibiotics, fluid replacement.",
    pearl: "Rose spots on the abdomen are a classic but rare finding in the second week."
  },
  {
    name: "Pneumonia",
    category: "Respiratory",
    symptoms: ["Cough with phlegm", "Fever", "Shortness of breath", "Chest pain during breathing"],
    risk_factors: ["Smoking", "Chronic lung disease", "Weakened immune system", "Recent viral infection"],
    tests: ["Chest X-Ray", "Sputum Culture", "Pulse Oximetry"],
    treatment: "Antibiotics (if bacterial), rest, fluids, oxygen therapy if needed.",
    pearl: "Use CURB-65 score to decide between outpatient and inpatient management."
  },
  {
    name: "Asthma",
    category: "Respiratory",
    symptoms: ["Wheezing", "Shortness of breath", "Chest tightness", "Nighttime cough"],
    risk_factors: ["Allergies", "Family history", "Air pollution", "Occupational exposures"],
    tests: ["Spirometry", "Peak Flow Monitoring", "FeNO Test"],
    treatment: "Inhaled corticosteroids, SABA for rescue, trigger avoidance.",
    pearl: "Silent chest in a severe asthma attack is an ominous sign of impending respiratory failure."
  },
  {
    name: "Hypertension",
    category: "Cardiovascular",
    symptoms: ["Often asymptomatic", "Headaches", "Blurred vision", "Chest pain (if severe)"],
    risk_factors: ["High salt intake", "Obesity", "Sedentary lifestyle", "Genetics"],
    tests: ["Blood Pressure Monitoring", "ECG", "Urinalysis", "Lipid Profile"],
    treatment: "Lifestyle changes (DASH diet), ACE inhibitors, ARBs, Beta-blockers.",
    pearl: "Primary hypertension accounts for 95% of cases; always screen for secondary causes in young patients."
  },
  {
    name: "Diabetes Mellitus",
    category: "Endocrine",
    symptoms: ["Polyuria", "Polydipsia", "Unexplained weight loss", "Fatigue", "Blurred vision"],
    risk_factors: ["Family history", "Obesity", "Age", "Gestational diabetes history"],
    tests: ["HbA1c", "Fasting Blood Glucose", "Oral Glucose Tolerance Test"],
    treatment: "Metformin, Insulin, Diet, Exercise, Monitoring.",
    pearl: "HbA1c reflects average blood glucose over the past 3 months."
  }
];
