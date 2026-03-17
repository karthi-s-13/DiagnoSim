export const FALLBACK_CASES: Record<string, any> = {
  "Dengue": {
    patientName: "Sarah Johnson",
    age: 28,
    gender: "Female",
    severity: "moderate",
    vitals: {
      temp: 39.2,
      bp: "110/70",
      heartRate: 105,
      respRate: 20,
      o2: 98
    },
    chiefComplaint: "High fever and severe joint pain for 3 days.",
    history: "Patient presents with sudden onset high-grade fever, retro-orbital pain, and intense myalgia ('breakbone fever'). She recently returned from a tropical vacation. No significant past medical history.",
    tasks: [
      { id: "1", description: "Assess for warning signs (abdominal pain, vomiting)", isCompleted: false },
      { id: "2", description: "Order Complete Blood Count (CBC)", isCompleted: false },
      { id: "3", description: "Check for rash or petechiae", isCompleted: false }
    ]
  },
  "Malaria": {
    patientName: "Michael Chen",
    age: 35,
    gender: "Male",
    severity: "moderate",
    vitals: {
      temp: 38.8,
      bp: "120/80",
      heartRate: 98,
      respRate: 18,
      o2: 97
    },
    chiefComplaint: "Cyclical fever with intense chills and sweating.",
    history: "Patient reports episodes of high fever followed by profuse sweating every 48 hours. He works as a field researcher and frequently travels to rural areas. Complains of fatigue and mild headache.",
    tasks: [
      { id: "1", description: "Perform thick and thin blood smears", isCompleted: false },
      { id: "2", description: "Check for splenomegaly", isCompleted: false },
      { id: "3", description: "Assess neurological status", isCompleted: false }
    ]
  },
  "Typhoid": {
    patientName: "Anita Sharma",
    age: 22,
    gender: "Female",
    severity: "moderate",
    vitals: {
      temp: 39.5,
      bp: "100/60",
      heartRate: 85, // Relative bradycardia
      respRate: 18,
      o2: 98
    },
    chiefComplaint: "Step-ladder fever and abdominal discomfort.",
    history: "Patient has had a gradually increasing fever for the past week. Reports constipation followed by mild diarrhea. Complains of a dull headache and loss of appetite.",
    tasks: [
      { id: "1", description: "Order blood culture", isCompleted: false },
      { id: "2", description: "Check for rose spots on abdomen", isCompleted: false },
      { id: "3", description: "Assess for hepatosplenomegaly", isCompleted: false }
    ]
  },
  "Pneumonia": {
    patientName: "Robert Miller",
    age: 62,
    gender: "Male",
    severity: "severe",
    vitals: {
      temp: 38.9,
      bp: "105/65",
      heartRate: 110,
      respRate: 28,
      o2: 91
    },
    chiefComplaint: "Productive cough and shortness of breath.",
    history: "Patient presents with rusty-colored sputum, pleuritic chest pain, and significant dyspnea. He has a history of COPD and is a former smoker. Appears acutely ill.",
    tasks: [
      { id: "1", description: "Auscultate for crackles or bronchial breath sounds", isCompleted: false },
      { id: "2", description: "Order urgent Chest X-Ray", isCompleted: false },
      { id: "3", description: "Calculate CURB-65 score", isCompleted: false }
    ]
  },
  "Asthma": {
    patientName: "Emily Davis",
    age: 19,
    gender: "Female",
    severity: "moderate",
    vitals: {
      temp: 37.0,
      bp: "120/80",
      heartRate: 115,
      respRate: 24,
      o2: 94
    },
    chiefComplaint: "Wheezing and chest tightness.",
    history: "Patient has a known history of asthma. Symptoms were triggered by exercise and cold air. She has been using her rescue inhaler with minimal relief. Reports nighttime awakenings.",
    tasks: [
      { id: "1", description: "Measure Peak Expiratory Flow (PEF)", isCompleted: false },
      { id: "2", description: "Auscultate for expiratory wheeze", isCompleted: false },
      { id: "3", description: "Check for use of accessory muscles", isCompleted: false }
    ]
  },
  "Hypertension": {
    patientName: "James Wilson",
    age: 52,
    gender: "Male",
    severity: "mild",
    vitals: {
      temp: 36.8,
      bp: "175/105",
      heartRate: 72,
      respRate: 16,
      o2: 99
    },
    chiefComplaint: "Occasional morning headaches and blurred vision.",
    history: "Patient presents for a routine check-up. He has a sedentary job and a diet high in processed foods. No previous diagnosis of hypertension, but family history is positive.",
    tasks: [
      { id: "1", description: "Perform fundoscopy to check for hypertensive retinopathy", isCompleted: false },
      { id: "2", description: "Order urinalysis and renal function tests", isCompleted: false },
      { id: "3", description: "Assess BMI and waist circumference", isCompleted: false }
    ]
  },
  "Diabetes Mellitus": {
    patientName: "Linda Thompson",
    age: 45,
    gender: "Female",
    severity: "moderate",
    vitals: {
      temp: 36.6,
      bp: "130/85",
      heartRate: 78,
      respRate: 16,
      o2: 98
    },
    chiefComplaint: "Excessive thirst and frequent urination.",
    history: "Patient reports constant thirst (polydipsia) and waking up multiple times at night to urinate (polyuria). She has noticed unintentional weight loss of 5kg over the last month.",
    tasks: [
      { id: "1", description: "Order Fasting Blood Glucose and HbA1c", isCompleted: false },
      { id: "2", description: "Perform monofilament test for peripheral neuropathy", isCompleted: false },
      { id: "3", description: "Check for acanthosis nigricans", isCompleted: false }
    ]
  }
};
