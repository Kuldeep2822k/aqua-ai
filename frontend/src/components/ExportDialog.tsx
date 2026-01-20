import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Download,
  FileDownload,
  TableChart,
  Description,
} from '@mui/icons-material';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  dataType: 'water-quality' | 'locations' | 'alerts';
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  data,
  dataType,
}) => {
  const [exportFormat, setExportFormat] = useState<
    'csv' | 'json' | 'excel' | 'pdf'
  >('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const getAvailableFields = () => {
    switch (dataType) {
      case 'water-quality':
        return [
          'location_name',
          'state',
          'district',
          'parameter',
          'value',
          'unit',
          'risk_level',
          'quality_score',
          'measurement_date',
        ];
      case 'locations':
        return [
          'name',
          'state',
          'district',
          'latitude',
          'longitude',
          'water_body_type',
          'population_affected',
          'avg_wqi_score',
          'active_alerts',
        ];
      case 'alerts':
        return [
          'location_name',
          'parameter',
          'alert_type',
          'severity',
          'message',
          'triggered_at',
          'status',
        ];
      default:
        return [];
    }
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const exportToCSV = () => {
    const fieldsToExport =
      selectedFields.length > 0 ? selectedFields : getAvailableFields();
    const filteredData = filterDataByDateRange(data);

    const csvContent = [
      fieldsToExport,
      ...filteredData.map((item) =>
        fieldsToExport.map((field) => {
          const value = item[field];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
      ),
    ]
      .map((row) => row.join(','))
      .join('\n');

    downloadFile(csvContent, 'text/csv', `${dataType}-data.csv`);
  };

  const exportToJSON = () => {
    const filteredData = filterDataByDateRange(data);
    const jsonContent = JSON.stringify(filteredData, null, 2);
    downloadFile(jsonContent, 'application/json', `${dataType}-data.json`);
  };

  const exportToExcel = () => {
    // For Excel export, we'll create a CSV that can be opened in Excel
    // In a real implementation, you'd use a library like xlsx
    const fieldsToExport =
      selectedFields.length > 0 ? selectedFields : getAvailableFields();
    const filteredData = filterDataByDateRange(data);

    const csvContent = [
      fieldsToExport,
      ...filteredData.map((item) =>
        fieldsToExport.map((field) => {
          const value = item[field];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
      ),
    ]
      .map((row) => row.join('\t'))
      .join('\n'); // Use tab separator for Excel

    downloadFile(
      csvContent,
      'text/tab-separated-values',
      `${dataType}-data.xls`
    );
  };

  const exportToPDF = () => {
    // For PDF export, we'll create a simple text representation
    // In a real implementation, you'd use a library like jsPDF
    const fieldsToExport =
      selectedFields.length > 0 ? selectedFields : getAvailableFields();
    const filteredData = filterDataByDateRange(data);

    let pdfContent = `Water Quality Data Export\n`;
    pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
    pdfContent += `Total Records: ${filteredData.length}\n\n`;

    filteredData.forEach((item, index) => {
      pdfContent += `Record ${index + 1}:\n`;
      fieldsToExport.forEach((field) => {
        pdfContent += `  ${field}: ${item[field]}\n`;
      });
      pdfContent += '\n';
    });

    downloadFile(pdfContent, 'text/plain', `${dataType}-data.txt`);
  };

  const filterDataByDateRange = (data: any[]) => {
    if (!dateRange.start && !dateRange.end) return data;

    return data.filter((item) => {
      const itemDate = new Date(item.measurement_date || item.triggered_at);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;

      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  };

  const downloadFile = (
    content: string,
    mimeType: string,
    filename: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
    onClose();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'excel':
        return <TableChart />;
      case 'json':
        return <Description />;
      case 'pdf':
        return <FileDownload />;
      default:
        return <Download />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Download sx={{ mr: 1 }} />
          Export Data
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            color="text.primary"
            sx={{ fontWeight: 500 }}
          >
            Export {data.length} records of {dataType} data
          </Typography>
        </Box>

        {/* Export Format */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            label="Export Format"
          >
            <MenuItem value="csv">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TableChart sx={{ mr: 1 }} />
                CSV (Comma Separated Values)
              </Box>
            </MenuItem>
            <MenuItem value="excel">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TableChart sx={{ mr: 1 }} />
                Excel Spreadsheet
              </Box>
            </MenuItem>
            <MenuItem value="json">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1 }} />
                JSON (JavaScript Object Notation)
              </Box>
            </MenuItem>
            <MenuItem value="pdf">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileDownload sx={{ mr: 1 }} />
                PDF Document
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Date Range Filter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Date Range Filter (Optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        {/* Field Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Fields to Export
          </Typography>
          <Typography
            variant="body2"
            color="text.primary"
            sx={{ mb: 2, fontWeight: 500 }}
          >
            Leave empty to export all fields
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getAvailableFields().map((field) => (
              <Chip
                key={field}
                label={field.replace(/_/g, ' ').toUpperCase()}
                onClick={() => handleFieldToggle(field)}
                color={selectedFields.includes(field) ? 'primary' : 'default'}
                variant={selectedFields.includes(field) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Additional Options */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
            }
            label="Include metadata (export date, record count, etc.)"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={getFormatIcon(exportFormat)}
        >
          Export {exportFormat.toUpperCase()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
