export interface CSVParseResult {
  headers: string[];
  data: Record<string, string>[];
  errors: string[];
}

export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.trim().split('\n');
  const errors: string[] = [];
  
  if (lines.length === 0) {
    return { headers: [], data: [], errors: ['CSV file is empty'] };
  }

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return { headers, data, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote
      current += '"';
      i += 2;
    } else if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
      i++;
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      // Regular character
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}

export function validateAssetCSV(data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['name', 'type', 'criticality'];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push(`Row ${index + 2}: Missing required field '${field}'`);
      }
    });
    
    if (row.criticality && !['low', 'medium', 'high', 'critical'].includes(row.criticality.toLowerCase())) {
      errors.push(`Row ${index + 2}: Invalid criticality value '${row.criticality}'`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateThreatCSV(data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['threat', 'likelihood', 'impact'];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push(`Row ${index + 2}: Missing required field '${field}'`);
      }
    });
    
    ['likelihood', 'impact'].forEach(field => {
      if (row[field]) {
        const value = parseInt(row[field]);
        if (isNaN(value) || value < 1 || value > 5) {
          errors.push(`Row ${index + 2}: ${field} must be a number between 1 and 5`);
        }
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

export function validateControlsCSV(data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['control', 'status'];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push(`Row ${index + 2}: Missing required field '${field}'`);
      }
    });
    
    if (row.status && !['implemented', 'partial', 'not-implemented'].includes(row.status.toLowerCase())) {
      errors.push(`Row ${index + 2}: Invalid status value '${row.status}'`);
    }
  });

  return { valid: errors.length === 0, errors };
}
