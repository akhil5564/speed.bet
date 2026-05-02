export interface WinEntry {
  number: string;
  type: string;
  winType?: string;
  count: number;
  winAmount: number;
}

export interface Bill {
  billNo: string;
  createdBy: string;
  scheme: string;
  winnings: WinEntry[];
}

export interface Report {
  grandTotal: number;
  bills: Bill[];
}
