export type StepStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';
export type Decision = 'approved' | 'rejected' | 'changes_requested' | 'awaiting' | 'not_required';
export type StageKind = 'approval' | 'document' | 'milestone';
export type Stage = { id: string; name: string; short: string; owner: string; action: string; documentId?: string; kind: StageKind; description: string };
export type DemoState = { statuses: Record<string, StepStatus>; decisions: Record<string, Decision>; documents: Record<string, boolean>; activity: string[] };
export type Document = { id: string; title: string; type: string; owner: string; date: string; summary: string; fields: [string, string][] };

export const CAMPAIGN = { company: 'Northstar Cloud', name: 'US Growth Summit 2026', amount: 100000, currency: 'USD', partner: 'Cloud partner', code: 'MKT-US-0426' };

// Reorder, add, or remove objects here to change the demo workflow.
export const STAGES: Stage[] = [
  { id: 'request', name: 'Funding request', short: 'Request', owner: 'Marketing', action: 'Submit campaign funding request', documentId: 'request', kind: 'document', description: 'Marketing outlines the campaign, expected impact, and the $100,000 funding need.' },
  { id: 'plan', name: 'Plan & budget', short: 'Plan', owner: 'Marketing', action: 'Prepare the plan and itemized budget', documentId: 'budget', kind: 'document', description: 'The team provides a campaign plan and spreadsheet-style cost breakdown.' },
  { id: 'finance', name: 'Finance review', short: 'Finance', owner: 'Finance', action: 'Review budget and approve funding request', documentId: 'finance', kind: 'approval', description: 'Finance checks the budget, policy threshold, and expected cash requirements.' },
  { id: 'management', name: 'Management approval', short: 'Management', owner: 'VP, Marketing', action: 'Approve campaign spend', kind: 'approval', description: 'Management signs off on the campaign amount and business case.' },
  { id: 'external_request', name: 'Partner funding request', short: 'Partner request', owner: 'Partnerships', action: 'Submit co-marketing funding request', kind: 'milestone', description: 'Partnerships sends the approved plan to the fictional external funding partner.' },
  { id: 'po', name: 'Purchase order', short: 'PO', owner: 'Procurement', action: 'Provide purchase order', documentId: 'po', kind: 'document', description: 'Procurement issues a purchase order before invoice processing. This document is intentionally missing at the start of the demo.' },
  { id: 'invoice', name: 'Invoice processing', short: 'Invoice', owner: 'Finance', action: 'Create and process invoice', documentId: 'invoice', kind: 'document', description: 'Finance records the invoice against the purchase order and campaign budget.' },
  { id: 'partner', name: 'Partner approval', short: 'Partner approval', owner: 'External partner', action: 'Approve co-marketing funding', documentId: 'partner', kind: 'approval', description: 'The fictional partner approves the funding request after reviewing the documents.' },
  { id: 'funding', name: 'Funding confirmed', short: 'Funded', owner: 'Treasury', action: 'Confirm demo wallet funding', documentId: 'confirmation', kind: 'milestone', description: 'Treasury records a simulated $100,000 funding confirmation. No money moves in this prototype.' },
  { id: 'handoff', name: 'Marketing handoff', short: 'Handoff', owner: 'Marketing', action: 'Accept funded budget and deliverables', kind: 'milestone', description: 'Marketing receives the funded budget and begins execution, including event and whitepaper deliverables.' }
];

export const DOCUMENTS: Document[] = [
  { id: 'request', title: 'Marketing Funding Request', type: 'Request', owner: 'Marketing', date: '14 Oct 2026', summary: 'Request for a US field marketing campaign and executive event series.', fields: [['Campaign', CAMPAIGN.name], ['Requested amount', '$100,000'], ['Market', 'United States'], ['Objective', 'Generate qualified pipeline and support partner awareness'], ['Expected output', '3 events, 1 whitepaper, follow-up nurture']] },
  { id: 'budget', title: 'Campaign Budget', type: 'Budget', owner: 'Marketing', date: '15 Oct 2026', summary: 'Itemized working budget for the campaign.', fields: [['Venue & production', '$36,000'], ['Paid media', '$24,000'], ['Content & whitepaper', '$18,000'], ['Travel & logistics', '$12,000'], ['Contingency', '$10,000'], ['Total', '$100,000']] },
  { id: 'plan', title: 'Marketing Plan', type: 'Plan', owner: 'Marketing', date: '15 Oct 2026', summary: 'Audience, channels, milestones, and proposed deliverables.', fields: [['Audience', 'US technology decision makers'], ['Channels', 'Field events, partner email, paid media'], ['Timeline', 'November 2026 – February 2027'], ['KPIs', '300 registrations; 80 qualified meetings'], ['Deliverables', '3 events and a co-branded whitepaper']] },
  { id: 'finance', title: 'Finance Approval', type: 'Approval', owner: 'Finance', date: 'Pending', summary: 'Finance review of budget, approval threshold, and funding availability.', fields: [['Request', CAMPAIGN.code], ['Review threshold', '$75,000'], ['Requested amount', '$100,000'], ['Finding', 'Above threshold; explicit finance approval required']] },
  { id: 'po', title: 'Purchase Order', type: 'Procurement', owner: 'Procurement', date: 'Not created', summary: 'Purchase order covering the approved campaign commitment.', fields: [['PO number', 'PO-US-2026-1084'], ['Vendor / program', 'Northstar Cloud US Growth Summit'], ['Amount', '$100,000'], ['Cost centre', 'US Marketing']] },
  { id: 'invoice', title: 'Invoice', type: 'Finance', owner: 'Finance', date: 'Not created', summary: 'Invoice record associated with the purchase order.', fields: [['Invoice number', 'INV-2026-0448'], ['PO reference', 'PO-US-2026-1084'], ['Amount', '$100,000'], ['Payment terms', 'Demo record only']] },
  { id: 'partner', title: 'External Partner Approval', type: 'Approval', owner: 'External partner', date: 'Pending', summary: 'Fictional co-marketing funding approval.', fields: [['Program', 'US Growth Summit 2026'], ['Approved amount', '$100,000'], ['Status', 'Pending partner review'], ['Note', 'Hypothetical process for discussion']] },
  { id: 'confirmation', title: 'Funding Confirmation', type: 'Treasury', owner: 'Treasury', date: 'Pending', summary: 'Simulated confirmation that the campaign wallet is funded.', fields: [['Campaign wallet', 'MKT-US-0426'], ['Funding amount', '$100,000'], ['Balance', '$100,000'], ['Rail', 'Simulation only — no transfer']] }
];

export function initialState(): DemoState {
  return {
    statuses: Object.fromEntries(STAGES.map((s, i) => [s.id, i < 2 ? 'completed' : i === 2 ? 'in_progress' : 'pending'])) as Record<string, StepStatus>,
    decisions: Object.fromEntries(STAGES.map(s => [s.id, s.kind === 'approval' ? 'awaiting' : 'not_required'])) as Record<string, Decision>,
    documents: { request: true, budget: true, plan: true, finance: false, po: false, invoice: false, partner: false, confirmation: false },
    activity: ['Marketing plan and budget submitted', 'Funding request submitted']
  };
}
