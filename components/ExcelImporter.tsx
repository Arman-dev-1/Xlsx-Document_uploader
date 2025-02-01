'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, Trash2, Download, Save, FolderOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ValidationError {
  sheet: string;
  row: number;
  error: string;
}

interface SheetData {
  [key: string]: any[];
}

const ExcelImporter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [sheetData, setSheetData] = useState<SheetData>({});
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();
  const rowsPerPage = 10;

  useEffect(() => {
    // Get or generate userId
    let storedUserId = localStorage.getItem('excelImporterId');
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem('excelImporterId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        await validateFile(acceptedFiles[0]);
      }
    },
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
  });

  const validateFile = async (file: File) => {
    setIsValidating(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/api/validate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.errors) {
        setErrors(data.errors);
      }

      if (data.sheetData) {
        setSheetData(data.sheetData);
        setSelectedSheet(Object.keys(data.sheetData)[0]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate file',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveData = async () => {
    try {
      console.log("Data Sended to Server");
      const response = await fetch('http://localhost:3001/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, data: sheetData }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Data saved successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save data',
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/load/${userId}`);
      const result = await response.json();

      if (result.success) {
        setSheetData(result.data);
        setSelectedSheet(Object.keys(result.data)[0]);
        toast({
          title: 'Success',
          description: 'Data loaded successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: sheetData }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported-data.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'File exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export file',
        variant: 'destructive',
      });
    }
  };

  const deleteRow = (sheetName: string, index: number) => {
    setSheetData((prev) => ({
      ...prev,
      [sheetName]: prev[sheetName].filter((_, i) => i !== index),
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const totalPages = Math.ceil(
    (sheetData[selectedSheet]?.length || 0) / rowsPerPage
  );

  const currentData = sheetData[selectedSheet]?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-8">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? 'Drop the Excel file here'
            : 'Drag and drop an Excel file here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Maximum file size: 2MB
        </p>
      </div>

      {errors.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <AlertCircle className="mr-2 h-4 w-4" />
              View Validation Errors
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Validation Errors</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue={errors[0].sheet}>
              <TabsList className="grid grid-cols-2 lg:grid-cols-3">
                {Array.from(new Set(errors.map((error) => error.sheet))).map(
                  (sheet) => (
                    <TabsTrigger key={sheet} value={sheet}>
                      {sheet}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
              {Array.from(new Set(errors.map((error) => error.sheet))).map(
                (sheet) => (
                  <TabsContent key={sheet} value={sheet}>
                    <div className="space-y-2">
                      {errors
                        .filter((error) => error.sheet === sheet)
                        .map((error, index) => (
                          <div
                            key={index}
                            className="p-3 bg-destructive/10 rounded-md"
                          >
                            <p className="text-sm">
                              <span className="font-semibold">Row {error.row}:</span>{' '}
                              {error.error}
                            </p>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                )
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {Object.keys(sheetData).length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Select
              value={selectedSheet}
              onValueChange={(value) => setSelectedSheet(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(sheetData).map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* <div className="flex gap-2">
              <Button onClick={saveData}>
                <Save className="mr-2 h-4 w-4" />
                Save Data
              </Button>
              <Button onClick={loadData}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Load Data
              </Button>
              <Button onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div> */}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.Name}</TableCell>
                    <TableCell>{formatAmount(row.Amount)}</TableCell>
                    <TableCell>{formatDate(row.Date)}</TableCell>
                    <TableCell>{row.Verified}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Row</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this row? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteRow(
                                  selectedSheet,
                                  (currentPage - 1) * rowsPerPage + index
                                )
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="py-2 px-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelImporter;