export interface Project {
  name: string;
  type: string;
  teamSize: number;
  requirements: string[];
}

export interface FrontendStack {
  framework: string;
  language: string;
  cssFramework: string;
  justification: string;
}

export interface BackendStack {
  language: string;
  framework: string;
  database: string;
  justification: string;
}

export interface DevOpsStack {
  hosting: string;
  CI_CD: string;
  monitoring: string;
  justification: string;
}

export interface ToolsStack {
  versionControl: string;
  projectManagement: string;
  communication: string;
  justification: string;
}

export interface RecommendedStack {
  frontend: FrontendStack;
  backend: BackendStack;
  devOps: DevOpsStack;
  tools: ToolsStack;
}

export interface TechStackAdvice {
  project: Project;
  recommendedStack: RecommendedStack;
}
