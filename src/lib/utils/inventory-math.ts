export function calculateMonthsInOperation(receptionDate: string | null | undefined, manualOffset: number | null | undefined): number {
  if (receptionDate) {
    const start = new Date(receptionDate);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(start.getTime())) {
      return manualOffset || 0;
    }

    let months = (now.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += now.getMonth();
    
    return months > 0 ? months : 0;
  }
  
  return manualOffset || 0;
}
