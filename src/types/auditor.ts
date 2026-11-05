export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type IssueCategory =
  | 'wcag_a11y'
  | 'ux_deadend'
  | 'touch_target'
  | 'layout_regression'
  | 'friction_rage'
  | 'i18n_overflow';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface UxIssue {
  id: string;
  title: string;
  category: IssueCategory;
  severity: Severity;
  wcagRule?: string;
  explanation: string;
  boundingBox: BoundingBox;
  quickFix: string;
  timestamp?: number;
  frameSnapshot?: string;
}

export interface DeepRefactorResult {
  diagnosis: string;
  wcagReference: string;
  architecturalAdvice: string;
  beforeCode: string;
  afterCode: string;
  explanation: string;
  testSnippet: string;
}

export interface CjmStep {
  stepIndex: number;
  name: string;
  userIntent: string;
  status: 'success' | 'friction' | 'blocked' | 'abandoned';
  frictionDetails: string;
  rageClickCount: number;
  dropOffRisk: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface CjmData {
  flowName: string;
  completionRateEstimated: number;
  totalFrictionScore: number;
  steps: CjmStep[];
  frictionPointsSummary: string[];
  executiveAdvice: string;
}

export interface BrokerQueueItem {
  id: string;
  timestamp: number;
  frameThumbnail: string;
  issueCount: number;
  status: 'buffered' | 'processing_deep' | 'analyzed';
  issues: UxIssue[];
}

export interface VoiceNote {
  id: string;
  timestampSeconds: number;
  timeFormatted: string;
  transcript: string;
}

export interface SessionStats {
  framesScanned: number;
  issuesDetected: number;
  criticalBlockers: number;
  wcagScore: number;
  rageClicks: number;
  sessionDuration: number;
}
